import React, { useState, useRef, useEffect } from 'react';
import { Avatar, List, Input, Button, message } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import { Get, Post } from '../../../../utils/request';

type TMessage = {
  id: string;
  role: 'ai' | 'user';
  content: string;
};
const ChatRoom: React.FC = () => {
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [chatId, setChatId] = useState(localStorage.getItem('chatId') ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isCompositingRef = useRef(false);

  useEffect(() => {
    if (chatId) {
      initMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initMessages = async () => {
    const result = await Get(`/api/chat/${chatId}`);
    setMessages(formatMessages(result.data.messages));
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const clearChat = () => {
    setInputValue('');
    setChatId('');
    setMessages([]);
    localStorage.removeItem('chatId');
  };

  const formatMessages = (
    messages: {
      id: string[];
      kwargs: { content: string; id: string };
    }[]
  ): TMessage[] => {
    return messages.map((m) => ({
      id: m.kwargs.id,
      role: m.id[2] === 'HumanMessage' ? 'user' : 'ai',
      content: m.kwargs.content,
    }));
  };

  const submit = async () => {
    if (!inputValue || isLoading) return;

    setIsLoading(true);
    setInputValue('');

    const isNewChat = !chatId;
    setMessages([
      ...messages,
      {
        id: 'fake_user_id',
        role: 'user',
        content: inputValue,
      },
      {
        id: 'fake_ai_id',
        role: 'ai',
        content: '...',
      },
    ]);
    if (isNewChat) {
      const result = await Post('/api/start', {
        content: inputValue,
      });
      if (result.code === 0) {
        const chatId = result.data.thread_id;
        setChatId(chatId);
        localStorage.setItem('chatId', chatId);
        setMessages(formatMessages(result.data.result.messages));
      } else {
        message.error('请求失败');
        return;
      }
    } else {
      const result = await Post('/api/talk', {
        content: inputValue,
        thread_id: chatId,
      });
      setMessages(formatMessages(result.data.result.messages));
    }

    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div
      style={{
        height: '100vh',
        flex: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <List
          dataSource={messages}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={
                      item.role === 'user' ? (
                        <UserOutlined />
                      ) : (
                        <RobotOutlined />
                      )
                    }
                  />
                }
                title={<span>{item.role === 'user' ? '用户' : 'AI'}</span>}
                description={
                  <div>
                    <p>{item.content}</p>
                  </div>
                }
              />
            </List.Item>
          )}
        />
        <div ref={messagesEndRef} />
      </div>
      <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder='输入消息'
          style={{ width: 'calc(100% - 100px)', marginRight: '8px' }}
          onCompositionStart={() => {
            isCompositingRef.current = true;
          }}
          onCompositionEnd={() => {
            isCompositingRef.current = false;
          }}
          onPressEnter={() => {
            if (!isCompositingRef.current) {
              submit();
            }
          }}
        />
        <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
          <Button
            type='primary'
            onClick={submit}
            disabled={!inputValue || isLoading}
          >
            发送
          </Button>
          <Button type='default' onClick={clearChat} disabled={!chatId}>
            开启新会话
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
