import ChatMessagePreview from "@/components/ChatMessagePreview";
import { Get } from "@/utils/request";
import { Empty, message, Skeleton, Typography } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";

import styles from "./style.module.less";

const ChatMessagesPage = () => {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<TMessageFromApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!id) {
      message.error("Missing chat id");
      return;
    }

    setLoading(true);
    try {
      const { code, data } = await Get<{ messages: TMessageFromApi[] }>(
        `/api/admin/chats/${id}/messages`,
      );
      if (code === 0) {
        setMessages(
          (data.messages ?? []).filter((item) => {
            const hideForRoles = item.content.metadata.hide_for_roles ?? [];
            // 过滤对该角色隐藏的消息
            return !hideForRoles.includes("staff");
          }),
        );
        setLoaded(true);
      } else {
        message.error("Failed to fetch chat messages");
      }
    } catch {
      message.error("Failed to fetch chat messages");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  if (loading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  if (!loaded) {
    return <Empty description="Failed to load chat messages" />;
  }

  return (
    <div className={styles.container}>
      <Typography.Title level={3} className={styles.pageTitle}>
        Chat #{id} Messages
      </Typography.Title>
      <div className={styles.messageSection}>
        {messages.length > 0 ? (
          <ChatMessagePreview messages={messages} role="admin" />
        ) : (
          <Empty description="No messages" />
        )}
      </div>
    </div>
  );
};

export default ChatMessagesPage;
