import { useRef } from "react";
import { AudioOutlined, LoadingOutlined } from "@ant-design/icons";
import { Button } from "antd";
import classnames from "classnames";

import useAssemblyOffline from "@/hooks/useAssemblyOffline";
import Pause from "@/assets/icons/pause";
import MarkdownEditor, { type MDXEditorMethods } from "@/components/MarkdownEditor";

import styles from "./style.module.less";

interface IProps {
  value?: string;
  onChange?: (value: string) => void;
  minHeight?: number;
  style?: React.CSSProperties;
  className?: string;
}

const RichTextWithVoice: React.FC<IProps> = (props) => {
  const { value, onChange, minHeight = 200, style, className } = props;
  const editorRef = useRef<MDXEditorMethods | null>(null);
  const editorWrapRef = useRef<HTMLDivElement>(null);

  const {
    startTranscription,
    endTranscription,
    isRecording,
    volumeHistory,
    isTranscribing,
  } = useAssemblyOffline({
    onFinish: (result) => {
      const hasFocus =
        document.activeElement &&
        editorWrapRef.current?.contains(document.activeElement);
      if (hasFocus && editorRef.current) {
        editorRef.current.insertMarkdown(result);
      } else {
        onChange?.((value ?? "") + result);
      }
    },
  });

  return (
    <div className={classnames(styles.container, className)} style={style}>
      <div
        ref={editorWrapRef}
        className={styles.editorWrap}
        style={{ minHeight }}
      >
        <MarkdownEditor
          ref={editorRef}
          value={value}
          onChange={(v) => onChange?.(v)}
          style={{
            flex: "auto",
            overflow: "hidden",
            display: "flex",
          }}
        />
      </div>
      <div className={styles.voiceContainer}>
        <div
          className={classnames(styles.volumeHistoryContainer, {
            [styles.active]: isRecording,
          })}
        >
          {volumeHistory.map((volume, index) => (
            <div
              key={index}
              className={styles.volumeHistoryItem}
              style={{
                height: 4 + Math.min(30, volume * 75),
              }}
            />
          ))}
        </div>
        {isRecording ? (
          <Button
            className={styles.voiceButton}
            icon={<Pause />}
            onClick={() => endTranscription()}
            size="large"
            type="primary"
          />
        ) : isTranscribing ? (
          <Button
            className={styles.voiceButton}
            icon={<LoadingOutlined spin />}
            size="large"
          />
        ) : (
          <Button
            className={styles.voiceButton}
            icon={<AudioOutlined />}
            onClick={() => startTranscription()}
            size="large"
          />
        )}
      </div>
    </div>
  );
};

export default RichTextWithVoice;
