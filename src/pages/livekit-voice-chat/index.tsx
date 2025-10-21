import React, { useEffect, useRef, useState } from 'react';
import { Button, message } from 'antd';
import { 
  AudioOutlined, 
  AudioMutedOutlined, 
  CloseOutlined,
  PlayCircleOutlined,
  StopOutlined,
  UserOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { useLivekitRoom } from '@/hooks/useLivekitRoom';
import dayjs from 'dayjs';
import styles from './style.module.less';

interface LivekitVoiceChatProps {
  onClose?: () => void;
  roomName?: string;
  token?: string;
  serverUrl?: string;
}

const LivekitVoiceChat: React.FC<LivekitVoiceChatProps> = ({
  onClose,
  roomName = 'voice-chat-room',
  token,
  serverUrl = 'wss://your-livekit-server.com'
}) => {
  const [isMuted, setIsMuted] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const isAudioPlayingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 播放音频数据
  const playAudioData = async (audioData: Float32Array) => {
    if (!audioContextRef.current) return;

    try {
      // 确保 audioData 是正确的 Float32Array 类型
      const buffer = audioData.buffer instanceof ArrayBuffer ? audioData.buffer : new ArrayBuffer(audioData.buffer.byteLength);
      const float32Data = new Float32Array(buffer, audioData.byteOffset, audioData.length);
      const audioBuffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
      audioBuffer.copyToChannel(float32Data, 0);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        audioQueueRef.current = audioQueueRef.current.slice(1);
        const nextSource = audioQueueRef.current[0];
        if (nextSource) {
          nextSource.start();
        } else {
          isAudioPlayingRef.current = false;
        }
      };

      audioQueueRef.current.push(source);
      
      if (!isAudioPlayingRef.current) {
        isAudioPlayingRef.current = true;
        source.start();
      }
    } catch (error) {
      console.error('播放音频失败:', error);
    }
  };

  // 使用 LiveKit Hook
  const {
    isConnected,
    participants,
    isRecording,
    isSpeaking,
    isUserSpeaking,
    messages,
    createAndJoinRoom,
    disconnect,
    toggleRecording,
    toggleMute,
    publishTrack,
    addMessage
  } = useLivekitRoom({
    serverUrl,
    token: token || '',
    roomName,
    onParticipantJoined: (participant) => {
      console.log('参与者加入:', participant.identity);
    },
    onParticipantLeft: (participant) => {
      console.log('参与者离开:', participant.identity);
    },
    onConnectionStateChange: (state) => {
      console.log('连接状态变化:', state);
    },
    onUserSpeaking: () => {
      console.log('用户开始说话，准备打断 AI');
      interruptAI();
    },
    onUserSilent: () => {
      console.log('用户停止说话');
    },
    onMessageReceived: (message) => {
      console.log('收到消息:', message);
    }
  });

  // 初始化音频上下文
  useEffect(() => {
    audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 当消息更新时自动滚动
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 处理创建并加入房间
  const handleCreateAndJoinRoom = async () => {
    try {
      await createAndJoinRoom();
      await publishTrack();
      message.success('成功加入房间并开始录音');
      
      // 添加欢迎消息
      addMessage({
        role: 'assistant',
        content: '您好！我是 AI 助手，很高兴与您进行语音对话。请开始说话吧！',
        type: 'text'
      });
    } catch (error) {
      console.error('加入房间失败:', error);
      message.error('加入房间失败');
    }
  };

  // 处理录音控制
  const handleToggleRecording = async () => {
    try {
      await toggleRecording();
      message.info(isRecording ? '录音已停止' : '开始录音');
    } catch (error) {
      console.error('录音控制失败:', error);
      message.error('录音控制失败');
    }
  };

  // 处理静音控制
  const handleToggleMute = async () => {
    try {
      await toggleMute();
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      message.info(newMutedState ? '已静音' : '已取消静音');
    } catch (error) {
      console.error('静音控制失败:', error);
      message.error('静音控制失败');
    }
  };

  // 打断 AI 说话
  const interruptAI = () => {
    if (audioQueueRef.current.length > 0) {
      // 停止所有正在播放的音频
      audioQueueRef.current.forEach(source => {
        try {
          source.stop();
        } catch (e) {
          // 忽略已停止的 source
        }
      });
      audioQueueRef.current = [];
      isAudioPlayingRef.current = false;
      message.info('已打断 AI 说话');
    }
  };

  // 结束对话
  const endConversation = async () => {
    try {
      await disconnect();
      message.info('对话已结束');
      
      // 清理音频队列
      audioQueueRef.current.forEach(source => {
        try {
          source.stop();
        } catch (e) {
          // 忽略已停止的 source
        }
      });
      audioQueueRef.current = [];
      isAudioPlayingRef.current = false;
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('结束对话失败:', error);
      message.error('结束对话失败');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>LiveKit 语音对话</h2>
        <div className={styles.status}>
          <span className={`${styles.statusDot} ${isConnected ? styles.connected : styles.disconnected}`} />
          {isConnected ? '已连接' : '未连接'}
        </div>
      </div>

      <div className={styles.content}>
        {!isConnected ? (
          <div className={styles.startSection}>
            <Button 
              type="primary" 
              size="large"
              onClick={handleCreateAndJoinRoom}
              className={styles.startButton}
            >
              创建并加入房间
            </Button>
          </div>
        ) : (
          <div className={styles.controlsSection}>
            {/* 对话消息区域 */}
            <div className={styles.messagesSection}>
              <h3>对话记录</h3>
              <div className={styles.messagesContainer}>
                {messages.length === 0 ? (
                  <div className={styles.emptyMessages}>
                    <p>暂无对话记录</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`${styles.message} ${styles[msg.role]}`}>
                      <div className={styles.messageHeader}>
                        <div className={styles.messageAvatar}>
                          {msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                        </div>
                        <div className={styles.messageInfo}>
                          <span className={styles.messageRole}>
                            {msg.role === 'user' ? '我' : 'AI 助手'}
                          </span>
                          <span className={styles.messageTime}>
                            {dayjs(msg.timestamp).format('HH:mm:ss')}
                          </span>
                        </div>
                      </div>
                      <div className={styles.messageContent}>
                        {msg.content}
                      </div>
                      {msg.type === 'audio' && (
                        <div className={styles.audioIndicator}>
                          🎵 语音消息
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className={styles.participants}>
              <h3>参与者 ({participants.size + 1})</h3>
              <div className={styles.participantList}>
                <div className={styles.participant}>
                  <span className={styles.participantName}>我</span>
                    <div className={styles.participantStatus}>
                      {isUserSpeaking && <span className={styles.speakingIndicator}>正在说话 (VAD)</span>}
                      {isSpeaking && <span className={styles.aiSpeakingIndicator}>AI 正在说话</span>}
                    </div>
                </div>
                {Array.from(participants.values()).map(participant => (
                  <div key={participant.identity} className={styles.participant}>
                    <span className={styles.participantName}>{participant.identity}</span>
                    {participant.isSpeaking && <span className={styles.speakingIndicator}>正在说话</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.controlButtons}>
              <Button
                type={isRecording ? "primary" : "default"}
                shape="circle"
                size="large"
                onClick={handleToggleRecording}
                className={styles.recordButton}
                icon={isRecording ? <StopOutlined /> : <PlayCircleOutlined />}
              >
                {isRecording ? '停止录音' : '开始录音'}
              </Button>

              <Button
                type={isMuted ? "default" : "primary"}
                shape="circle"
                size="large"
                onClick={handleToggleMute}
                className={styles.muteButton}
                icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
              >
                {isMuted ? '取消静音' : '静音'}
              </Button>


              <Button
                type="default"
                shape="circle"
                size="large"
                onClick={() => {
                  addMessage({
                    role: 'user',
                    content: '这是一条测试消息',
                    type: 'text'
                  });
                }}
                className={styles.testButton}
              >
                测试
              </Button>

              <Button
                type="default"
                shape="circle"
                size="large"
                onClick={endConversation}
                className={styles.endButton}
                icon={<CloseOutlined />}
              >
                结束对话
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LivekitVoiceChat;
