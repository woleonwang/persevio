import { useEffect, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteAudioTrack,
  LocalAudioTrack,
  createLocalAudioTrack,
  ConnectionState,
  RemoteParticipant,
  LocalParticipant,
} from "livekit-client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type: "text" | "audio";
}

interface UseLivekitRoomOptions {
  serverUrl: string;
  token: string;
  roomName: string;
  onAudioData?: (audioData: Float32Array) => void;
  onParticipantJoined?: (participant: RemoteParticipant) => void;
  onParticipantLeft?: (participant: RemoteParticipant) => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
  onUserSpeaking?: () => void; // 用户开始说话时的回调
  onUserSilent?: () => void; // 用户停止说话时的回调
  onMessageReceived?: (message: Message) => void; // 收到消息时的回调
}

interface UseLivekitRoomReturn {
  room: Room | null;
  isConnected: boolean;
  connectionState: ConnectionState;
  participants: Map<string, RemoteParticipant>;
  localParticipant: LocalParticipant | null;
  localAudioTrack: LocalAudioTrack | null;
  isRecording: boolean;
  isSpeaking: boolean;
  isUserSpeaking: boolean; // 用户是否正在说话
  messages: Message[]; // 对话消息列表
  createAndJoinRoom: () => Promise<void>;
  disconnect: () => Promise<void>;
  toggleRecording: () => Promise<void>;
  toggleMute: () => Promise<void>;
  publishTrack: () => Promise<void>;
  unpublishTrack: () => Promise<void>;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void; // 添加消息
}

export const useLivekitRoom = (
  options: UseLivekitRoomOptions
): UseLivekitRoomReturn => {
  const {
    serverUrl,
    token,
    onParticipantJoined,
    onParticipantLeft,
    onConnectionStateChange,
    onUserSpeaking,
    onUserSilent,
    onMessageReceived,
  } = options;

  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected
  );
  const [participants, setParticipants] = useState<
    Map<string, RemoteParticipant>
  >(new Map());
  const [localParticipant, setLocalParticipant] =
    useState<LocalParticipant | null>(null);
  const [localAudioTrack, setLocalAudioTrack] =
    useState<LocalAudioTrack | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const roomRef = useRef<Room | null>(null);
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);

  // 添加消息
  const addMessage = (messageData: Omit<Message, "id" | "timestamp">) => {
    const message: Message = {
      ...messageData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, message]);
    onMessageReceived?.(message);
  };

  // 设置房间事件监听器
  const setupRoomEventListeners = (room: Room) => {
    room.on(RoomEvent.Connected, () => {
      console.log("房间连接成功");
      setConnectionState(room.state);
      setIsConnected(true);
      onConnectionStateChange?.(room.state);
    });

    room.on(RoomEvent.Disconnected, (reason) => {
      console.log("房间断开连接:", reason);
      setConnectionState(room.state);
      setIsConnected(false);
      setIsRecording(false);
      setIsSpeaking(false);
      onConnectionStateChange?.(room.state);
    });

    room.on(
      RoomEvent.TrackSubscribed,
      (track: RemoteTrack, _publication, participant: RemoteParticipant) => {
        console.log("订阅轨道:", track.kind, participant.identity);

        if (track.kind === Track.Kind.Audio) {
          const audioTrack = track as RemoteAudioTrack;
          audioTrack.attach();
        }
      }
    );

    room.on(
      RoomEvent.TrackUnsubscribed,
      (track: RemoteTrack, _publication, _participant: RemoteParticipant) => {
        console.log("取消订阅轨道:", track.kind);
        track.detach();
      }
    );

    room.on(
      RoomEvent.LocalTrackPublished,
      (_publication, participant: LocalParticipant) => {
        console.log("本地轨道发布成功");
        setLocalParticipant(participant);
      }
    );

    room.on(
      RoomEvent.LocalTrackUnpublished,
      (_publication, _participant: LocalParticipant) => {
        console.log("本地轨道取消发布");
      }
    );

    // 监听说话状态
    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      const isLocalSpeaking = speakers.some((speaker) => speaker.isLocal);
      setIsSpeaking(isLocalSpeaking);

      // 使用 ActiveSpeakersChanged 来检测用户说话状态
      const wasUserSpeaking = isUserSpeaking;
      setIsUserSpeaking(isLocalSpeaking);

      if (isLocalSpeaking && !wasUserSpeaking) {
        console.log("用户开始说话");
        onUserSpeaking?.();
      } else if (!isLocalSpeaking && wasUserSpeaking) {
        console.log("用户停止说话");
        onUserSilent?.();
      }
    });
  };

  // 创建并加入房间
  const createAndJoinRoom = async () => {
    try {
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          audioPreset: {
            maxBitrate: 32000,
            priority: "high",
          },
        },
      });

      // 设置事件监听器
      setupRoomEventListeners(newRoom);

      // 加入房间
      await newRoom.connect(serverUrl, token);

      setRoom(newRoom);
      roomRef.current = newRoom;
    } catch (error) {
      console.error("加入房间失败:", error);
      throw error;
    }
  };

  // 发布音频轨道
  const publishTrack = async () => {
    if (!room || localAudioTrackRef.current) return;

    try {
      const audioTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 24000,
        channelCount: 1,
      });

      localAudioTrackRef.current = audioTrack;
      setLocalAudioTrack(audioTrack);

      await room.localParticipant.publishTrack(audioTrack, {
        name: "microphone",
        source: Track.Source.Microphone,
      });

      setIsRecording(true);
    } catch (error) {
      console.error("发布音频轨道失败:", error);
      throw error;
    }
  };

  // 取消发布音频轨道
  const unpublishTrack = async () => {
    if (!room || !localAudioTrackRef.current) return;

    try {
      await room.localParticipant.unpublishTrack(localAudioTrackRef.current);
      await localAudioTrackRef.current.stop();

      localAudioTrackRef.current = null;
      setLocalAudioTrack(null);
      setIsRecording(false);
    } catch (error) {
      console.error("取消发布音频轨道失败:", error);
      throw error;
    }
  };

  // 开始/停止录音
  const toggleRecording = async () => {
    if (!localAudioTrackRef.current) return;

    try {
      if (isRecording) {
        await localAudioTrackRef.current.stop();
        setIsRecording(false);
      } else {
        // LiveKit 的 LocalAudioTrack 没有 start 方法，录音是自动的
        setIsRecording(true);
      }
    } catch (error) {
      console.error("录音控制失败:", error);
      throw error;
    }
  };

  // 静音/取消静音
  const toggleMute = async () => {
    if (!localAudioTrackRef.current) return;

    try {
      if (localAudioTrackRef.current.isMuted) {
        await localAudioTrackRef.current.unmute();
      } else {
        await localAudioTrackRef.current.mute();
      }
    } catch (error) {
      console.error("静音控制失败:", error);
      throw error;
    }
  };

  // 断开连接
  const disconnect = async () => {
    try {
      if (roomRef.current) {
        await roomRef.current.disconnect();
        setRoom(null);
        roomRef.current = null;
        setIsConnected(false);
        setIsRecording(false);
        setIsSpeaking(false);
        setIsUserSpeaking(false);
      }

      if (localAudioTrackRef.current) {
        await localAudioTrackRef.current.stop();
        localAudioTrackRef.current = null;
        setLocalAudioTrack(null);
      }
    } catch (error) {
      console.error("断开连接失败:", error);
      throw error;
    }
  };

  // 清理资源
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
      }
    };
  }, []);

  return {
    room,
    isConnected,
    connectionState,
    participants,
    localParticipant,
    localAudioTrack,
    isRecording,
    isSpeaking,
    isUserSpeaking,
    messages,
    createAndJoinRoom,
    disconnect,
    toggleRecording,
    toggleMute,
    publishTrack,
    unpublishTrack,
    addMessage,
  };
};
