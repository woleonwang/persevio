import React, { useState } from 'react';
import { Button, Modal, Input, Form, message } from 'antd';
import LivekitVoiceChat from './index';

const LivekitVoiceChatPage: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [chatConfig, setChatConfig] = useState<{
    roomName: string;
    token: string;
    serverUrl: string;
  } | null>(null);

  const handleStartChat = () => {
    form.validateFields().then(values => {
      setChatConfig({
        roomName: values.roomName,
        token: values.token,
        serverUrl: values.serverUrl
      });
      setIsModalVisible(true);
    }).catch(() => {
      message.error('请填写所有必填字段');
    });
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setChatConfig(null);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '32px', color: '#1890ff' }}>
        LiveKit 语音对话演示
      </h1>
      
      <div style={{ 
        background: '#f8f9fa', 
        padding: '24px', 
        borderRadius: '8px',
        marginBottom: '24px'
      }}>
        <h3>功能特性：</h3>
        <ul style={{ margin: '16px 0', paddingLeft: '20px' }}>
          <li>✅ 创建并加入 LiveKit 房间</li>
          <li>✅ 自动开启录音并发送音频数据</li>
          <li>✅ AI 回复后自动播放录音</li>
          <li>✅ <strong>语音打断</strong> - 用户说话时自动打断 AI</li>
          <li>✅ 支持点击按钮结束对话</li>
          <li>✅ 实时显示参与者状态</li>
          <li>✅ 静音/取消静音控制</li>
          <li>✅ <strong>LiveKit VAD</strong> - 使用 LiveKit 内置语音活动检测</li>
          <li>✅ 对话文字内容展示</li>
        </ul>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          roomName: 'meeting-room-marvin',
          serverUrl: 'wss://persevio-yitfnnaa.livekit.cloud',
          token: ''
        }}
      >
        <Form.Item
          label="房间名称"
          name="roomName"
          rules={[{ required: true, message: '请输入房间名称' }]}
        >
          <Input placeholder="输入房间名称" />
        </Form.Item>

        <Form.Item
          label="服务器地址"
          name="serverUrl"
          rules={[{ required: true, message: '请输入 LiveKit 服务器地址' }]}
        >
          <Input placeholder="wss://your-livekit-server.com" />
        </Form.Item>

        <Form.Item
          label="访问令牌"
          name="token"
          rules={[{ required: true, message: '请输入访问令牌' }]}
        >
          <Input.TextArea 
            placeholder="输入 LiveKit 访问令牌"
            rows={3}
          />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            size="large" 
            onClick={handleStartChat}
            style={{ width: '100%' }}
          >
            开始语音对话
          </Button>
        </Form.Item>
      </Form>

      <div style={{ 
        background: '#fff7e6', 
        padding: '16px', 
        borderRadius: '6px',
        border: '1px solid #ffd591'
      }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#d46b08' }}>使用说明：</h4>
        <ol style={{ margin: 0, paddingLeft: '20px', color: '#8c4a00' }}>
          <li>确保您有有效的 LiveKit 服务器地址和访问令牌</li>
          <li>点击"开始语音对话"按钮打开语音聊天界面</li>
          <li>首次使用需要授权麦克风权限</li>
          <li>可以通过静音按钮控制是否发送音频</li>
          <li><strong>语音打断</strong>：当 AI 说话时，您开始说话会自动打断 AI 的播放</li>
          <li>界面会实时显示说话状态（使用 LiveKit VAD 检测）</li>
          <li>支持查看对话的文字记录</li>
        </ol>
      </div>

      <Modal
        title="LiveKit 语音对话"
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width="90%"
        style={{ maxWidth: '900px' }}
        destroyOnClose
      >
        {chatConfig && (
          <LivekitVoiceChat
            roomName={chatConfig.roomName}
            token={chatConfig.token}
            serverUrl={chatConfig.serverUrl}
            onClose={handleCloseModal}
          />
        )}
      </Modal>
    </div>
  );
};

export default LivekitVoiceChatPage;
