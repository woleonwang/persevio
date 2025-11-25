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
import RecordImg from "@/assets/record.png";
import SendImg from "@/assets/send.png";

import styles from "./style.module.less";
import { getQuery } from "@/utils";
import Keyboard from "@/assets/icons/keyboard";

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

const ChatInputArea = (props: IProps) => {
  const { onSubmit, isLoading = false, disabledVoiceInput = false } = props;
  const [textInputVisible, setTextInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [volumeHistory, setVolumeHistory] = useState<number[]>([]);
  const volumeRef = useRef(0);

  const isCompositingRef = useRef(false);
  const { t: originalT } = useTranslation();
  const isDebug = getQuery("debug") === "1";

  const {
    startTranscription,
    endTranscription,
    isRecording,
    volume,
    isTranscribing,
    isStartRecordingOutside,
    logs,
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
    setInputValue("");
  };

  const isRecordingOrTranscribing = isRecording || isTranscribing;

  return (
    <>
      <div
        className={classnames(styles.inputAreaContainer, styles.desktopVisible)}
      >
        {isDebug && (
          <div className={styles.debugContainer}>
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        )}
        <div className={styles.inputPanel}>
          {textInputVisible ? (
            <div className={classnames(styles.textInputContainer)}>
              <div className={styles.textInputLeft}>
                <Input.TextArea
                  className={styles.textInputArea}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                  }}
                  placeholder={t("reply_viona")}
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
          ) : (
            <div className={classnames(styles.audioInputContainer)}>
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
                          height: 4 + Math.min(40, volume * 100),
                        }}
                      />
                    );
                  })}
                </div>
                <div className={styles.voiceInputHint}>
                  {isRecording ? (
                    isStartRecordingOutside ? (
                      <>{t("click_again_to_stop_recording")}</>
                    ) : (
                      <>
                        {t("release_ctrl_to_stop_speaking")}{" "}
                        <span
                          className={classnames(styles.highlight, {
                            [styles.active]: isRecording,
                          })}
                        >
                          {t("ctrl_key")}
                        </span>{" "}
                        {t("to_stop_speaking")}
                      </>
                    )
                  ) : (
                    <>
                      {t("press_and_hold")}{" "}
                      <span
                        className={classnames(styles.highlight, {
                          [styles.active]: isRecording,
                        })}
                      >
                        {t("ctrl_key")}
                      </span>{" "}
                      {t("to_speak")}
                    </>
                  )}
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
          )}
        </div>
      </div>
      <div className={classnames(styles.mobileContainer, styles.mobileVisible)}>
        {textInputVisible ? (
          <div className={classnames(styles.textInputContainer)}>
            <div className={styles.textInputLeft}>
              <Input.TextArea
                className={styles.textInputArea}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                }}
                placeholder={t("reply_viona")}
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

            <div
              className={styles.button}
              onClick={() => setTextInputVisible(false)}
            >
              <AudioOutlined style={{ fontSize: 24 }} />
            </div>
          </div>
        ) : (
          <>
            <div className={styles.placeholder} style={{ height: 100 }} />
            <div
              className={classnames(styles.mobileVoiceContainer, {
                [styles.bg]: isRecordingOrTranscribing,
              })}
            >
              <div className={styles.desc}>
                {isRecording
                  ? t("recording")
                  : isTranscribing
                  ? t("transcribing")
                  : null}
              </div>
              {isRecordingOrTranscribing && (
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
                          height: 4 + Math.min(40, volume * 100),
                        }}
                      />
                    );
                  })}
                </div>
              )}
              <div className={styles.voiceInputButtonContainer}>
                <div
                  className={classnames(styles.voiceInputButton, {
                    [styles.recording]: isRecording,
                    [styles.transcribing]: isTranscribing,
                  })}
                  onClick={() => {
                    if (isRecording) {
                      endTranscription();
                    } else {
                      startTranscription();
                    }
                  }}
                >
                  {isRecording ? (
                    <img src={SendImg} alt="record" />
                  ) : isTranscribing ? (
                    <img src={SendImg} alt="record" />
                  ) : (
                    <img src={RecordImg} alt="record" />
                  )}
                </div>
                <div
                  className={styles.mobileKeyboardButton}
                  onClick={() => setTextInputVisible(true)}
                >
                  <Icon icon={<Keyboard />} style={{ fontSize: 24 }} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ChatInputArea;
