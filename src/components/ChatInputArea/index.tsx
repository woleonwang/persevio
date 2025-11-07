import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input, Tooltip } from "antd";
import { AudioOutlined, LoadingOutlined } from "@ant-design/icons";
import classnames from "classnames";

import Icon from "../Icon";
import Send from "@/assets/icons/send";
import useAssemblyOffline from "@/hooks/useAssemblyOffline";
import Pause from "@/assets/icons/pause";
import Edit from "@/assets/icons/edit";

import styles from "./style.module.less";

interface IProps {
  onSubmit: (
    rawMessage: string,
    options?: {
      voice_payload_id?: number;
      metadata?: {
        before_text?: string;
        after_text?: string;
      };
    }
  ) => void;
  isLoading?: boolean;
  disabledVoiceInput?: boolean;
}

const RECORD_HISTORY_DURATION_SECONDS = 6;
const POINTS_PER_SECOND = 10;
const getInitialVolumeHistory = () => {
  return Array.from(
    { length: RECORD_HISTORY_DURATION_SECONDS * POINTS_PER_SECOND },
    () => 0
  );
};

const LONG_PRESS_DURATION = 300; // 长按时间阈值（毫秒）

const ChatInputArea = (props: IProps) => {
  const { onSubmit, isLoading = false, disabledVoiceInput = false } = props;
  const [textInputVisible, setTextInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [volumeHistory, setVolumeHistory] = useState<number[]>([]);
  const volumeRef = useRef(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isCompositingRef = useRef(false);
  const { t: originalT } = useTranslation();

  const {
    startTranscription,
    endTranscription,
    isRecording,
    volume,
    isTranscribing,
    isStartRecordingOutside,
  } = useAssemblyOffline({
    onFinish: (result, payloadId) => {
      onSubmit(result, { voice_payload_id: payloadId });
    },
    disabled: disabledVoiceInput,
  });
  volumeRef.current = volume;
  const t = (key: string) => originalT(`chat.${key}`);

  useEffect(() => {
    if (!isTranscribing) {
      setVolumeHistory(getInitialVolumeHistory());
    }
  }, [isTranscribing]);

  useEffect(() => {
    if (isRecording) {
      setTextInputVisible(false);
      const interval = setInterval(() => {
        setVolumeHistory((prev) => [
          ...prev.slice(
            -(RECORD_HISTORY_DURATION_SECONDS * POINTS_PER_SECOND - 1)
          ),
          volumeRef.current,
        ]);
      }, 1000 / POINTS_PER_SECOND);

      return () => {
        clearInterval(interval);
      };
    }
  }, [isRecording]);
  // 聊天框是否能发送
  const canSubmit = () => {
    return inputValue?.trim() && !isLoading;
  };

  const submit = () => {
    if (!canSubmit()) return;
    onSubmit(inputValue.trim().replaceAll("\n", "\n\n"));
  };

  return (
    <div className={classnames(styles.inputAreaContainer)}>
      <div className={styles.inputPanel}>
        {textInputVisible ? (
          <>
            <div
              className={classnames(
                styles.textInputContainer,
                styles.desktopVisible
              )}
            >
              <div className={styles.textInputLeft}>
                <Input.TextArea
                  className={styles.textInputArea}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                  }}
                  placeholder={t("reply_viona_directly_or_edit")}
                  onCompositionStartCapture={() =>
                    (isCompositingRef.current = true)
                  }
                  onCompositionEndCapture={() =>
                    (isCompositingRef.current = false)
                  }
                  onPressEnter={(e) => {
                    if (
                      !e.shiftKey &&
                      !isCompositingRef.current &&
                      canSubmit()
                    ) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  autoSize={{
                    minRows: 1,
                    maxRows: 6,
                  }}
                />
                <div
                  className={classnames(styles.sendButton, {
                    [styles.disabled]: !canSubmit(),
                  })}
                  onClick={() => submit()}
                >
                  <Icon icon={<Send />} style={{ fontSize: 24 }} />
                </div>
              </div>

              <Tooltip title={t("voice_input")}>
                <div
                  className={styles.button}
                  onClick={() => setTextInputVisible(false)}
                >
                  <AudioOutlined style={{ fontSize: 24 }} />
                </div>
              </Tooltip>
            </div>
            <div
              className={classnames(
                styles.textInputContainer,
                styles.mobileVisible
              )}
            >
              <div className={styles.textInputLeft}>
                <Input.TextArea
                  className={styles.textInputArea}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                  }}
                  placeholder={t("reply_viona_directly_or_edit")}
                  onCompositionStartCapture={() =>
                    (isCompositingRef.current = true)
                  }
                  onCompositionEndCapture={() =>
                    (isCompositingRef.current = false)
                  }
                  autoSize={{
                    minRows: 1,
                    maxRows: 6,
                  }}
                />
                <div
                  className={classnames(styles.sendButton, {
                    [styles.disabled]: !canSubmit(),
                  })}
                  onClick={() => submit()}
                >
                  <Icon icon={<Send />} style={{ fontSize: 24 }} />
                </div>
              </div>

              <Tooltip title={t("voice_input")}>
                <div
                  className={styles.button}
                  onClick={() => setTextInputVisible(false)}
                >
                  <AudioOutlined style={{ fontSize: 24 }} />
                </div>
              </Tooltip>
            </div>
          </>
        ) : (
          <>
            <div
              className={classnames(
                styles.audioInputContainer,
                styles.desktopVisible
              )}
            >
              <div className={styles.left}>
                <div
                  className={classnames(styles.volumeHistoryContainer, {
                    [styles.active]: isRecording,
                  })}
                >
                  {volumeHistory.map((volume, index) => {
                    return (
                      <div
                        key={index}
                        className={styles.volumeHistoryItem}
                        style={{
                          height: 4 + Math.min(50, volume * 100),
                        }}
                      />
                    );
                  })}
                </div>
                <div className={styles.voiceInputHint}>
                  {isRecording && !isStartRecordingOutside ? (
                    <>
                      Release
                      <span
                        className={classnames(styles.highlight, {
                          [styles.active]: isRecording,
                        })}
                      >
                        Ctrl
                      </span>
                      to stop speaking
                    </>
                  ) : !isRecording ? (
                    <>
                      Press and hold{" "}
                      <span
                        className={classnames(styles.highlight, {
                          [styles.active]: isRecording,
                        })}
                      >
                        Ctrl
                      </span>{" "}
                      to speak
                    </>
                  ) : null}
                </div>
              </div>
              <div className={styles.right}>
                <div className={styles.divider} />
                <div
                  className={styles.button}
                  onClick={() => {
                    if (isRecording) {
                      if (isTranscribing || !isStartRecordingOutside) {
                        return;
                      }
                      endTranscription();
                    } else {
                      startTranscription();
                    }
                  }}
                >
                  {isRecording ? (
                    <Icon
                      icon={<Pause />}
                      style={{ fontSize: 24, color: "#3682fe" }}
                    />
                  ) : isTranscribing ? (
                    <LoadingOutlined
                      style={{ fontSize: 24, color: "#3682fe" }}
                    />
                  ) : (
                    <Tooltip title={t("voice_input")}>
                      <AudioOutlined style={{ fontSize: 24 }} />
                    </Tooltip>
                  )}
                </div>
                <div className={styles.divider} />
                <div
                  className={styles.button}
                  onClick={() => setTextInputVisible(true)}
                >
                  <Tooltip title={t("text_edit")}>
                    <Icon icon={<Edit />} style={{ fontSize: 24 }} />
                  </Tooltip>
                </div>
              </div>
            </div>
            <div
              className={classnames(
                styles.audioInputContainer,
                styles.mobileVisible
              )}
            >
              <div className={classnames(styles.left, styles.mobileVisible)}>
                <div
                  className={styles.voiceInputButton}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    longPressTimerRef.current = setTimeout(() => {
                      startTranscription();
                    }, LONG_PRESS_DURATION);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    // 清除长按定时器
                    if (longPressTimerRef.current) {
                      clearTimeout(longPressTimerRef.current);
                      longPressTimerRef.current = null;
                    }

                    // 如果正在录音，则停止
                    if (isRecording) {
                      endTranscription();
                    }
                  }}
                >
                  {isRecording
                    ? "Release to stop speaking"
                    : "Press and hold to speak"}
                </div>
              </div>
              <div className={styles.right}>
                <div
                  className={styles.button}
                  onClick={() => setTextInputVisible(true)}
                >
                  <Tooltip title={t("text_edit")}>
                    <Icon icon={<Edit />} style={{ fontSize: 24 }} />
                  </Tooltip>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatInputArea;
