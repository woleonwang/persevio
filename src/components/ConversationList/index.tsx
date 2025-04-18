import React, { useState } from 'react';
import { Modal, Input, List, Avatar, Badge } from 'antd';
import { MessageOutlined, ClockCircleOutlined } from '@ant-design/icons';
import styles from './style.module.less';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: string;
}

interface Conversation {
  id: string;
  name: string;
  unreadCount: number;
  lastMessageTime: string;
  messages: Message[];
}

interface ConversationListProps {
  conversations: Conversation[];
}

const ConversationList: React.FC<ConversationListProps> = ({ conversations }) => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [feedback, setFeedback] = useState('');

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleModalClose = () => {
    setSelectedConversation(null);
    setFeedback('');
  };

  const handleFeedbackSubmit = () => {
    // TODO: 处理反馈提交
    console.log('Feedback submitted:', feedback);
    setFeedback('');
  };

  return (
    <div className={styles.container}>
      <List
        itemLayout="horizontal"
        dataSource={conversations}
        renderItem={(conversation) => (
          <List.Item
            className={styles.conversationItem}
            onClick={() => handleConversationClick(conversation)}
          >
            <List.Item.Meta
              avatar={
                <Badge count={conversation.unreadCount}>
                  <Avatar icon={<MessageOutlined />} />
                </Badge>
              }
              title={conversation.name}
              description={
                <div className={styles.description}>
                  <span className={styles.time}>
                    <ClockCircleOutlined /> {conversation.lastMessageTime}
                  </span>
                </div>
              }
            />
          </List.Item>
        )}
      />

      <Modal
        title={selectedConversation?.name}
        open={!!selectedConversation}
        onCancel={handleModalClose}
        footer={null}
        width={600}
      >
        <div className={styles.messagesContainer}>
          {selectedConversation?.messages.map((message) => (
            <div key={message.id} className={styles.messageItem}>
              <div className={styles.messageHeader}>
                <span className={styles.sender}>{message.sender}</span>
                <span className={styles.timestamp}>{message.timestamp}</span>
              </div>
              <div className={styles.messageContent}>{message.content}</div>
            </div>
          ))}
        </div>
        <div className={styles.feedbackContainer}>
          <Input.TextArea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="请输入您的反馈..."
            rows={3}
          />
          <div className={styles.feedbackActions}>
            <button onClick={handleFeedbackSubmit} className={styles.submitButton}>
              提交反馈
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ConversationList; 