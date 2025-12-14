import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import ChatMessageList from "../ChatMessageList";
import { SIDE_DOCUMENT_TYPES } from "@/utils/consts";
import { useRef, useState } from "react";
import { getDocumentType, parseJSON } from "@/utils";
import { Button, Drawer } from "antd";
import MarkdownContainer from "../MarkdownContainer";
import AudioPlayer from "../AudioPlayer";
const ChatMessagePreview = (props: {
  messages: TMessageFromApi[];
  role?: "admin" | "staff";
  job?: IJob;
  talent?: TTalent;
}) => {
  const { messages, job, talent, role = "staff" } = props;
  const [sideDocumentDrawerVisible, setSideDocumentDrawerVisible] =
    useState(false);
  const [sideDocumentContent, setSideDocumentContent] = useState<string>("");

  const jrdContextDocumentJsonRef = useRef();
  jrdContextDocumentJsonRef.current = parseJSON(job?.jrd_context_document_json);

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`chat.${key}`);
  const formatMessages = (): TMessage[] => {
    // 根据 extraTag 添加系统消息
    // 过滤对该角色隐藏的消息

    return messages
      .filter(
        (item) =>
          item.content.content ||
          item.content.metadata.message_sub_type === "error"
      )
      .map((item) => {
        return {
          id: item.id.toString(),
          role: item.content.role === "assistant" ? "ai" : "user",
          content: item.content.content,
          thinking: item.content.thinking ?? "",
          updated_at: item.updated_at,
          messageType: item.content.metadata.message_type || "normal",
          messageSubType: item.content.metadata.message_sub_type || "normal",
          extraTags: item.content.metadata.extra_tags || [],
          payloadId: item.payload_id,
          duration: item.payload?.duration,
        };
      });
  };

  const supportTags: TSupportTag[] = [
    ...(SIDE_DOCUMENT_TYPES as TExtraTagName[]).map((key) => {
      return {
        key: key,
        title: t("view_document"),
        handler: () => {
          const documentType = getDocumentType(key);
          setSideDocumentDrawerVisible(true);
          setSideDocumentContent(
            jrdContextDocumentJsonRef.current?.[documentType] ?? ""
          );
        },
        autoTrigger: true,
      };
    }),
  ];

  return (
    <div className={styles.container}>
      <ChatMessageList
        messages={formatMessages()}
        renderTagsContent={(item) => {
          const canPlayAudio = !!item.payloadId && item.duration;

          const visibleTags = (item.extraTags ?? [])
            .map((extraTag) => {
              return supportTags.find((tag) => tag.key === extraTag.name);
            })
            .filter(Boolean) as TSupportTag[];

          return (
            <>
              {visibleTags.length > 0 && (
                <div className={styles.inlineButtonWrapper}>
                  {visibleTags.map((tag) => {
                    return (
                      <div
                        style={{ marginBottom: 16 }}
                        key={tag.key ?? (tag.title as string)}
                      >
                        <Button
                          type="primary"
                          className={styles.inlineButton}
                          onClick={() => {
                            const extraTag = (item.extraTags ?? []).find(
                              (extraTag) => extraTag.name === tag.key
                            );
                            tag.handler?.(extraTag);
                          }}
                        >
                          {tag.title}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
              {canPlayAudio && (
                <AudioPlayer
                  duration={item.duration ?? 0}
                  payloadUrl={
                    role === "staff"
                      ? `/api/jobs/${talent?.job_id}/talents/${talent?.id}/messages/${item.id}`
                      : `/api/admin/messages/${item.id}`
                  }
                  onPlay={() => {}}
                  onStop={() => {}}
                />
              )}
            </>
          );
        }}
        showUserTimestamp
      />
      <Drawer
        title={t("view_document")}
        open={sideDocumentDrawerVisible}
        onClose={() => setSideDocumentDrawerVisible(false)}
        width={1000}
      >
        <MarkdownContainer
          className={styles.sideDocumentContent}
          content={sideDocumentContent}
        />
      </Drawer>
    </div>
  );
};

export default ChatMessagePreview;
