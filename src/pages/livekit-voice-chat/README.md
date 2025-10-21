# LiveKit 语音对话组件

基于 `livekit-client` 实现的语音对话组件，支持实时音频传输、AI 语音回复和打断功能。

## 功能特性

✅ **创建并加入房间** - 一键创建 LiveKit 房间并自动加入  
✅ **自动录音** - 加入房间后自动开启录音并发送音频数据  
✅ **AI 语音回复** - 接收并自动播放 AI 的语音回复  
✅ **打断功能** - 支持打断正在播放的 AI 语音  
✅ **静音控制** - 可以随时静音/取消静音  
✅ **结束对话** - 一键结束对话并清理资源  
✅ **实时状态** - 显示连接状态、参与者信息和说话状态  

## 文件结构

```
src/pages/livekit-voice-chat/
├── index.tsx              # 主组件
├── style.module.less      # 样式文件
└── page.tsx               # 路由页面

src/hooks/
└── useLivekitRoom.ts      # LiveKit 连接管理 Hook
```

## 使用方法

### 1. 基本使用

```tsx
import LivekitVoiceChat from '@/pages/livekit-voice-chat';

function App() {
  return (
    <LivekitVoiceChat
      roomName="my-voice-room"
      token="your-livekit-token"
      serverUrl="wss://your-livekit-server.com"
      onClose={() => console.log('对话结束')}
    />
  );
}
```

### 2. 使用自定义 Hook

```tsx
import { useLivekitRoom } from '@/hooks/useLivekitRoom';

function CustomVoiceChat() {
  const {
    room,
    isConnected,
    participants,
    isRecording,
    createAndJoinRoom,
    disconnect,
    toggleRecording,
    toggleMute
  } = useLivekitRoom({
    serverUrl: 'wss://your-livekit-server.com',
    token: 'your-token',
    roomName: 'my-room',
    onAudioData: (audioData) => {
      // 处理接收到的音频数据
      console.log('收到音频数据:', audioData);
    },
    onParticipantJoined: (participant) => {
      console.log('参与者加入:', participant.identity);
    }
  });

  return (
    <div>
      <button onClick={createAndJoinRoom}>
        {isConnected ? '已连接' : '连接'}
      </button>
      <button onClick={toggleRecording}>
        {isRecording ? '停止录音' : '开始录音'}
      </button>
    </div>
  );
}
```

## API 参考

### LivekitVoiceChat Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `roomName` | `string` | `'voice-chat-room'` | 房间名称 |
| `token` | `string` | - | LiveKit 访问令牌 |
| `serverUrl` | `string` | `'wss://your-livekit-server.com'` | LiveKit 服务器地址 |
| `onClose` | `() => void` | - | 关闭回调 |

### useLivekitRoom Hook

#### 参数

```tsx
interface UseLivekitRoomOptions {
  serverUrl: string;           // LiveKit 服务器地址
  token: string;              // 访问令牌
  roomName: string;           // 房间名称
  onAudioData?: (audioData: Float32Array) => void;  // 音频数据回调
  onParticipantJoined?: (participant: RemoteParticipant) => void;  // 参与者加入回调
  onParticipantLeft?: (participant: RemoteParticipant) => void;     // 参与者离开回调
  onConnectionStateChange?: (state: ConnectionState) => void;       // 连接状态变化回调
}
```

#### 返回值

```tsx
interface UseLivekitRoomReturn {
  room: Room | null;                    // LiveKit 房间实例
  isConnected: boolean;                 // 是否已连接
  connectionState: ConnectionState;      // 连接状态
  participants: Map<string, RemoteParticipant>;  // 参与者列表
  localParticipant: LocalParticipant | null;      // 本地参与者
  localAudioTrack: LocalAudioTrack | null;        // 本地音频轨道
  isRecording: boolean;                 // 是否正在录音
  isSpeaking: boolean;                  // 是否正在说话
  createAndJoinRoom: () => Promise<void>;         // 创建并加入房间
  disconnect: () => Promise<void>;               // 断开连接
  toggleRecording: () => Promise<void>;           // 切换录音状态
  toggleMute: () => Promise<void>;               // 切换静音状态
  publishTrack: () => Promise<void>;             // 发布音频轨道
  unpublishTrack: () => Promise<void>;           // 取消发布音频轨道
}
```

## 配置要求

### 1. LiveKit 服务器

确保您有一个运行中的 LiveKit 服务器，可以通过以下方式获取：

- [LiveKit Cloud](https://cloud.livekit.io/) - 托管服务
- [自建服务器](https://docs.livekit.io/deploy/) - 本地部署

### 2. 访问令牌

需要生成有效的访问令牌来加入房间：

```javascript
// 示例：生成访问令牌
const token = await generateAccessToken({
  room: 'my-room',
  participantName: 'user',
  participantMetadata: 'metadata'
});
```

### 3. 浏览器权限

确保浏览器已授权麦克风权限：

```javascript
// 请求麦克风权限
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('麦克风权限已授权');
  })
  .catch(err => {
    console.error('麦克风权限被拒绝:', err);
  });
```

## 样式自定义

组件使用 CSS Modules，可以通过修改 `style.module.less` 文件来自定义样式：

```less
.container {
  // 自定义容器样式
}

.controlButtons {
  // 自定义控制按钮样式
}

.recordButton {
  // 自定义录音按钮样式
}
```

## 注意事项

1. **音频格式**: 组件使用 24kHz 采样率的单声道音频
2. **浏览器兼容性**: 需要支持 WebRTC 的现代浏览器
3. **网络要求**: 需要稳定的网络连接以确保音频质量
4. **资源清理**: 组件会自动清理音频资源和连接

## 故障排除

### 常见问题

1. **无法连接房间**
   - 检查服务器地址是否正确
   - 验证访问令牌是否有效
   - 确认网络连接正常

2. **无法录音**
   - 检查浏览器麦克风权限
   - 确认麦克风设备正常工作
   - 查看浏览器控制台错误信息

3. **音频播放问题**
   - 检查浏览器音频权限
   - 确认音频设备正常工作
   - 查看音频上下文状态

### 调试信息

组件会在控制台输出详细的调试信息，包括：
- 连接状态变化
- 参与者加入/离开
- 音频轨道订阅/取消订阅
- 错误信息

## 更新日志

- **v1.0.0** - 初始版本，支持基本的语音对话功能
- 支持创建并加入房间
- 支持自动录音和播放
- 支持打断和静音控制
- 支持结束对话功能
