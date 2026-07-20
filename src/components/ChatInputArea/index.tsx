import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dropdown, Input, Menu, Tooltip, message } from "antd";
import type { MenuProps } from "antd";
import { AudioOutlined, LoadingOutlined } from "@ant-design/icons";
import classnames from "classnames";

import Icon from "../Icon";
import Send from "@/assets/icons/send";
import At from "@/assets/icons/at";
import Close from "@/assets/icons/close";
import useAssemblyOffline from "@/hooks/useAssemblyOffline";
import Pause from "@/assets/icons/pause";
import Edit from "@/assets/icons/edit";
import RecordImg from "@/assets/record.png";
import SendImg from "@/assets/send.png";
import VionaAvatar from "@/assets/viona-avatar.png";

import styles from "./style.module.less";
import Keyboard from "@/assets/icons/keyboard";
import {
  TMentionOption,
  getAvatarColor,
  getNameInitials,
  mentionsIncludeViona,
} from "../StaffChat/intakeCollabUtils";

interface IProps {
  onSubmit: (
    rawMessage: string,
    options?: {
      voice_payload_id?: number;
      metadata?: {
        before_text?: string;
        after_text?: string;
      };
      mentions?: number[];
    },
  ) => void;
  isLoading?: boolean;
  disabledVoiceInput?: boolean;
  isCollapsed?: boolean;
  /** 对话里最近一条 AI 回复，用于语音转写上下文 */
  lastMessage?: string;
  assistantPerson?: TAssistantPerson;
  /** Job Intake 群聊 @ 能力 */
  enableMentions?: boolean;
  mentionOptions?: TMentionOption[];
  /** 1v1：loading 时仍可打字但发送灰掉；group：loading 时可发，@Viona 则拦截 */
  mentionChatMode?: "one_to_one" | "group";
}

const ChatInputArea = (props: IProps) => {
  const {
    onSubmit,
    isLoading = false,
    disabledVoiceInput = false,
    isCollapsed = false,
    lastMessage,
    assistantPerson = "viona",
    enableMentions = false,
    mentionOptions = [],
    mentionChatMode = "one_to_one",
  } = props;
  const [textInputVisible, setTextInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [mentionPills, setMentionPills] = useState<TMentionOption[]>([]);
  const [mentionPanelOpen, setMentionPanelOpen] = useState(false);
  const [mentionHighlightIndex, setMentionHighlightIndex] = useState(0);

  const isCompositingRef = useRef(false);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const inputValueBeforeAtRef = useRef<string>();
  const { t: originalT } = useTranslation();

  const {
    startTranscription,
    endTranscription,
    isRecording,
    volumeHistory,
    isTranscribing,
    isStartRecordingOutside,
  } = useAssemblyOffline({
    onFinish: (result, payloadId) => {
      onSubmit(result, {
        voice_payload_id: payloadId,
        mentions: mentionPills.map((p) => p.id),
      });
      setMentionPills([]);
    },
    disabled: disabledVoiceInput,
    lastMessage,
  });
  const t = (key: string) => originalT(`chat.${key}`);

  useEffect(() => {
    if (isRecording) {
      setTextInputVisible(false);
    }
  }, [isRecording]);

  const availableMentionOptions = mentionOptions.filter(
    (opt) => !mentionPills.some((p) => p.id === opt.id),
  );

  const openMentionPanel = () => {
    if (!enableMentions) return;
    setMentionPanelOpen(true);
    setMentionHighlightIndex(0);
  };

  const selectMention = (opt: TMentionOption) => {
    setMentionPills((prev) =>
      prev.some((p) => p.id === opt.id) ? prev : [...prev, opt],
    );
    setMentionPanelOpen(false);
    if (inputValueBeforeAtRef.current !== undefined) {
      setInputValue(inputValueBeforeAtRef.current);
      inputValueBeforeAtRef.current = undefined;
    }
    textAreaRef.current?.focus();
  };

  const removeMentionPill = (id: number) => {
    setMentionPills((prev) => prev.filter((p) => p.id !== id));
  };

  const canSubmit = () => {
    if (!inputValue?.trim() && mentionPills.length === 0) return false;
    if (mentionChatMode === "one_to_one" && isLoading) return false;
    return true;
  };

  const submit = () => {
    if (!canSubmit()) return;
    const mentions = mentionPills.map((p) => p.id);
    if (
      mentionChatMode === "group" &&
      isLoading &&
      mentionsIncludeViona(mentions)
    ) {
      message.warning(t("cannot_mention_viona_while_thinking"));
      return;
    }
    const text = inputValue.trim().replaceAll("\n", "\n\n");
    if (!text) return;
    onSubmit(text, { mentions });
    setInputValue("");
    setMentionPills([]);
  };

  const handleTextChange = (value: string) => {
    if (!enableMentions) {
      setInputValue(value);
      return;
    }

    const hasOnlyOneExtraAt = (a: string, b: string) => {
      if (b.length !== a.length + 1) return false;

      for (let i = 0; i < b.length; i++) {
        if (a[i] === b[i]) {
          continue;
        }

        if (b[i] !== "@") {
          return false;
        }

        return a === b.slice(0, i) + b.slice(i + 1);
      }

      return false;
    };

    if (hasOnlyOneExtraAt(inputValue, value)) {
      inputValueBeforeAtRef.current = inputValue;
      openMentionPanel();
    } else {
      inputValueBeforeAtRef.current = undefined;
      setMentionPanelOpen(false);
    }
    setInputValue(value);
  };

  const handleMentionKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (!mentionPanelOpen || availableMentionOptions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionHighlightIndex((i) => (i + 1) % availableMentionOptions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionHighlightIndex(
        (i) =>
          (i - 1 + availableMentionOptions.length) %
          availableMentionOptions.length,
      );
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      selectMention(availableMentionOptions[mentionHighlightIndex]);
    } else if (e.key === "Escape") {
      setMentionPanelOpen(false);
    }
  };

  const isRecordingOrTranscribing = isRecording || isTranscribing;

  const mentionMenuItems: MenuProps["items"] = useMemo(
    () =>
      availableMentionOptions.map((opt) => ({
        key: String(opt.id),
        label: (
          <div className={styles.mentionOption}>
            {opt.memberType === "ai" ? (
              <img className={styles.mentionAvatar} src={VionaAvatar} alt="" />
            ) : (
              <span
                className={styles.mentionAvatar}
                style={{
                  background: getAvatarColor(opt.name),
                }}
              >
                {getNameInitials(opt.name)}
              </span>
            )}
            <div className={styles.mentionIdentity}>
              <span className={styles.mentionOptionName}>{opt.name}</span>
              {opt.roleLabel && (
                <span
                  className={classnames(styles.mentionRole, {
                    [styles.roleYou]: opt.roleKey === "you",
                    [styles.roleOwner]: opt.roleKey === "owner",
                    [styles.roleAi]: opt.roleKey === "ai",
                    [styles.roleHiringManager]:
                      opt.roleKey === "hiring_manager",
                    [styles.roleRecruiter]: opt.roleKey === "recruiter",
                    [styles.roleGuest]: opt.roleKey === "guest",
                  })}
                >
                  {opt.roleLabel}
                </span>
              )}
            </div>
            {opt.email && (
              <span className={styles.mentionEmail}>{opt.email}</span>
            )}
          </div>
        ),
      })),
    [availableMentionOptions],
  );

  const renderMentionPills = () => {
    if (!enableMentions || mentionPills.length === 0) return null;
    return (
      <div className={styles.mentionPills}>
        {mentionPills.map((p) => (
          <span key={p.id} className={styles.mentionPill}>
            @{p.name}
            <button
              type="button"
              className={styles.mentionPillClose}
              onClick={() => removeMentionPill(p.id)}
            >
              <Icon icon={<Close />} style={{ fontSize: 14 }} />
            </button>
          </span>
        ))}
      </div>
    );
  };

  const renderMentionTrigger = () => {
    if (!enableMentions) return null;
    const highlightedKey =
      availableMentionOptions[mentionHighlightIndex] != null
        ? String(availableMentionOptions[mentionHighlightIndex].id)
        : undefined;

    return (
      <Dropdown
        open={mentionPanelOpen}
        onOpenChange={setMentionPanelOpen}
        trigger={["click"]}
        placement="topLeft"
        overlayClassName={styles.mentionDropdown}
        dropdownRender={() => (
          <div className={styles.mentionPanel}>
            <div className={styles.mentionPanelTitle}>{t("mention_title")}</div>
            {availableMentionOptions.length === 0 ? (
              <div className={styles.mentionEmpty}>{t("mention_empty")}</div>
            ) : (
              <Menu
                className={styles.mentionMenu}
                selectable={false}
                selectedKeys={highlightedKey ? [highlightedKey] : []}
                items={mentionMenuItems}
                onClick={({ key }) => {
                  const opt = availableMentionOptions.find(
                    (item) => String(item.id) === key,
                  );
                  if (opt) selectMention(opt);
                }}
              />
            )}
          </div>
        )}
      >
        <button
          type="button"
          className={styles.mentionTriggerBtn}
          aria-label="@"
          aria-expanded={mentionPanelOpen}
        >
          <Icon icon={<At />} style={{ fontSize: 20 }} />
        </button>
      </Dropdown>
    );
  };

  const renderTextInput = (isMobile?: boolean) => (
    <div
      className={classnames(styles.textInputContainer, {
        [styles.hasMentionTokens]: enableMentions && mentionPills.length > 0,
      })}
    >
      {renderMentionPills()}
      <div className={styles.textInputRow}>
        {!isMobile && renderMentionTrigger()}
        <div className={styles.textInputLeft}>
          <Input.TextArea
            className={styles.textInputArea}
            variant="borderless"
            value={inputValue}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={
              enableMentions && mentionChatMode === "group"
                ? t("reply_group")
                : assistantPerson === "viona"
                  ? t("reply_viona")
                  : t("reply_percy")
            }
            onCompositionStartCapture={() => (isCompositingRef.current = true)}
            onCompositionEndCapture={() => (isCompositingRef.current = false)}
            onKeyDown={handleMentionKeyDown}
            onPressEnter={(e) => {
              if (mentionPanelOpen) return;
              if (!e.shiftKey && !isCompositingRef.current && canSubmit()) {
                e.preventDefault();
                submit();
              }
            }}
            autoSize={{
              minRows: 1,
              maxRows: 6,
            }}
            ref={(node) => {
              textAreaRef.current = node?.resizableTextArea?.textArea ?? null;
            }}
          />
        </div>
        {!isMobile && (
          <Tooltip title={t("voice_input")}>
            <div
              className={styles.iconBtn}
              onClick={() => setTextInputVisible(false)}
            >
              <AudioOutlined style={{ fontSize: 22 }} />
            </div>
          </Tooltip>
        )}
        {isMobile && (
          <div
            className={styles.iconBtn}
            onClick={() => setTextInputVisible(false)}
          >
            <AudioOutlined style={{ fontSize: 22 }} />
          </div>
        )}
        <div
          className={classnames(styles.sendButton, {
            [styles.disabled]: !canSubmit(),
          })}
          onClick={() => submit()}
        >
          <Icon icon={<Send />} style={{ fontSize: 20 }} />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={classnames(
          styles.inputAreaContainer,
          styles.desktopVisible,
          {
            [styles.hasMentionTokens]:
              enableMentions && mentionPills.length > 0,
            [styles.intakeMode]: enableMentions,
          },
        )}
      >
        <div className={styles.inputPanel}>
          {textInputVisible ? (
            renderTextInput(false)
          ) : (
            <div
              className={classnames(styles.audioInputContainer, {
                [styles.hasMentionTokens]:
                  enableMentions && mentionPills.length > 0,
              })}
            >
              {renderMentionPills()}
              <div className={styles.audioInputRow}>
                {renderMentionTrigger()}
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
                  <div
                    className={styles.voiceInputHint}
                    style={isCollapsed ? { display: "none" } : {}}
                  >
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
                  <div
                    className={styles.iconBtn}
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
                        style={{ fontSize: 22, color: "#3682fe" }}
                      />
                    ) : isTranscribing ? (
                      <LoadingOutlined
                        style={{ fontSize: 22, color: "#3682fe" }}
                      />
                    ) : (
                      <Tooltip title={t("voice_input")}>
                        <AudioOutlined style={{ fontSize: 22 }} />
                      </Tooltip>
                    )}
                  </div>
                  <div
                    className={classnames(
                      styles.sendButton,
                      styles.textModeBtn,
                    )}
                    onClick={() => setTextInputVisible(true)}
                  >
                    <Tooltip title={t("text_edit")}>
                      <Icon icon={<Edit />} style={{ fontSize: 20 }} />
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className={classnames(styles.mobileContainer, styles.mobileVisible)}>
        {textInputVisible ? (
          renderTextInput(true)
        ) : (
          <>
            <div style={{ height: 50 }} />
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
