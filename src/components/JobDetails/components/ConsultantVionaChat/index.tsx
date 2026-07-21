import { useEffect, useRef, useState, ClipboardEvent } from "react";
import { Button, Input, Spin, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";

import { Get, Post } from "@/utils/request";
import { copy } from "@/utils";
import MarkdownContainer from "@/components/MarkdownContainer";
import styles from "./style.module.less";

interface IProps {
  jobId: number;
  active?: boolean;
}

type TMessage = {
  id: number;
  content: {
    role: string;
    content: string;
    metadata?: {
      extra_tags?: { name: string; content: string }[];
    };
  };
};

const ConsultantVionaChat = (props: IProps) => {
  const { jobId, active = false } = props;
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<number>();

  const stopPolling = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = undefined;
    }
  };

  useEffect(() => {
    if (!active) {
      stopPolling();
      setStreamingContent("");
      return;
    }
    fetchMessages(true);
    return () => {
      stopPolling();
    };
  }, [jobId, active]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const fetchMessages = async (withLoading = false) => {
    if (withLoading) setLoading(true);
    const { code, data } = await Get(
      `/api/admin/jobs/${jobId}/consultant/viona/messages`,
    );
    if (withLoading) setLoading(false);
    if (code === 0) {
      setMessages(data.messages ?? []);
      if (data.is_invoking === 1) {
        startPolling();
      } else {
        setSending(false);
      }
    }
  };

  const startPolling = () => {
    if (!active) return;
    stopPolling();
    setSending(true);
    pollRef.current = window.setInterval(async () => {
      const { code, data } = await Get(
        `/api/admin/jobs/${jobId}/consultant/viona/streaming_message`,
      );
      if (code !== 0) return;
      setStreamingContent(data.content || "");
      if (data.is_invoking === 0) {
        stopPolling();
        setStreamingContent("");
        setSending(false);
        fetchMessages();
      }
    }, 800);
  };

  const handleSend = async () => {
    const content = inputValue.trim();
    if ((!content && pendingImages.length === 0) || sending) return;

    setSending(true);
    const { code } = await Post(
      `/api/admin/jobs/${jobId}/consultant/viona/send`,
      {
        content,
        images: pendingImages,
      },
    );
    if (code === 0) {
      setInputValue("");
      setPendingImages([]);
      await fetchMessages();
      startPolling();
    } else {
      setSending(false);
      message.error("Failed to send message");
    }
  };

  const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItems = items.filter((item) => item.type.startsWith("image/"));
    if (imageItems.length === 0) return;

    e.preventDefault();
    const readers = imageItems.map(
      (item) =>
        new Promise<string>((resolve, reject) => {
          const file = item.getAsFile();
          if (!file) {
            reject(new Error("no file"));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        }),
    );
    try {
      const images = await Promise.all(readers);
      setPendingImages((prev) => [...prev, ...images.filter(Boolean)]);
      message.success("Screenshot attached");
    } catch {
      message.error("Failed to read pasted image");
    }
  };

  const renderMarkdown = (content: string) => (
    <MarkdownContainer
      content={content}
      components={{
        code: ({ className, children, ...rest }: any) => {
          const text = String(children).replace(/\n$/, "");
          const isBlock = String(className || "").includes("language-") || text.includes("\n");
          if (!isBlock) {
            return (
              <code className={className} {...rest}>
                {children}
              </code>
            );
          }
          return (
            <div className={styles.codeBlockWrap}>
              <Button
                size="small"
                icon={<CopyOutlined />}
                className={styles.copyBtn}
                onClick={() => {
                  copy(text);
                  message.success("Copied");
                }}
              >
                Copy
              </Button>
              <pre className={styles.codeBlock}>
                <code className={className} {...rest}>
                  {children}
                </code>
              </pre>
            </div>
          );
        },
      }}
    />
  );

  if (loading) {
    return <Spin />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.messageList} ref={listRef}>
        {messages.length === 0 && !streamingContent && (
          <div className={styles.empty}>
            Opening Viona briefing…
          </div>
        )}
        {messages.map((msg) => {
          const role = msg.content?.role;
          const isUser = role === "user";
          const imageTags =
            msg.content?.metadata?.extra_tags?.filter(
              (tag) => tag.name === "images",
            ) || [];
          let images: string[] = [];
          if (imageTags[0]?.content) {
            try {
              images = JSON.parse(imageTags[0].content);
            } catch {
              images = [];
            }
          }
          return (
            <div
              key={msg.id}
              className={`${styles.messageItem} ${
                isUser ? styles.userMessage : styles.assistantMessage
              }`}
            >
              <div className={styles.roleLabel}>{isUser ? "You" : "Viona"}</div>
              {images.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt="attached"
                  className={styles.attachedImage}
                />
              ))}
              {renderMarkdown(msg.content?.content || "")}
            </div>
          );
        })}
        {!!streamingContent && (
          <div className={`${styles.messageItem} ${styles.assistantMessage}`}>
            <div className={styles.roleLabel}>Viona</div>
            {renderMarkdown(streamingContent)}
          </div>
        )}
      </div>

      <div className={styles.inputArea}>
        {pendingImages.length > 0 && (
          <div className={styles.pendingImages}>
            {pendingImages.map((src, idx) => (
              <img key={idx} src={src} alt="pending" />
            ))}
            <Button type="link" onClick={() => setPendingImages([])}>
              Clear images
            </Button>
          </div>
        )}
        <Input.TextArea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPaste={handlePaste}
          placeholder="Ask Viona about sourcing, or paste a LinkedIn screenshot"
          autoSize={{ minRows: 2, maxRows: 6 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={sending}
        />
        <div className={styles.sendRow}>
          <span className={styles.hint}>Paste screenshot to attach · Shift+Enter for newline</span>
          <Button type="primary" loading={sending} onClick={handleSend}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConsultantVionaChat;
