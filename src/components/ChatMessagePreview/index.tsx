import { Avatar, List } from "antd";
import VionaAvatar from "@/assets/viona-avatar.png";
import UserAvatar from "@/assets/user-avatar.png";
import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import classnames from "classnames";
import MarkdownContainer from "../MarkdownContainer";

const datetimeFormat = "YYYY/MM/DD HH:mm:ss";
const ChatMessagePreview = (props: { messages: TMessageFromApi[] }) => {
  const { messages } = props;

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`chat.${key}`);
  const formatMessages = (): TMessage[] => {
    // 根据 extraTag 添加系统消息
    return messages.map((item) => {
      return {
        id: item.id.toString(),
        role: item.content.role === "assistant" ? "ai" : "user",
        content: item.content.content,
        thinking: item.content.thinking ?? "",
        updated_at: item.updated_at,
        messageType: item.content.metadata.message_type || "normal",
        messageSubType: item.content.metadata.message_sub_type || "normal",
        extraTags: item.content.metadata.extra_tags || [],
      };
    });
  };

  return (
    <div>
      <List
        dataSource={formatMessages()}
        split={false}
        renderItem={(item) => {
          return (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={
                      item.role === "user" ? (
                        <img src={UserAvatar} />
                      ) : (
                        <img src={VionaAvatar} />
                      )
                    }
                  />
                }
                title={
                  <div>
                    <span style={{ fontSize: 18 }}>
                      {item.role === "user"
                        ? t("you")
                        : `Viona, ${t("viona_intro_staff")}`}
                    </span>
                    <span className={styles.timestamp}>
                      {dayjs(item.updated_at).format(datetimeFormat)}
                    </span>
                  </div>
                }
                description={
                  <div
                    className={classnames(
                      styles.messageContainer,
                      item.role === "user" ? styles.user : ""
                    )}
                  >
                    <MarkdownContainer
                      content={
                        item.messageSubType === "error"
                          ? t("error_message")
                          : item.content
                      }
                    />
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />
    </div>
  );
};

export default ChatMessagePreview;
