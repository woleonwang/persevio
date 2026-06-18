import { useEffect, useState } from "react";
import { message } from "antd";

import PhoneWithCountryCode from "@/components/PhoneWithCountryCode";
import { Post } from "@/utils/request";

import { isValidPhone } from "@/utils/phone";
import styles from "../style.module.less";

type TAssessmentChatSheetPhase =
  | "channel"
  | "whatsappConfirm"
  | "whatsappHandoff";

type TAssessmentChatSheetProps = {
  open: boolean;
  countryCode: string;
  phone: string;
  jobApplyId?: number;
  onClose: () => void;
  onChatHere: () => void;
  onWhatsappReady: () => void;
};

const WHATSAPP_HANDOFF_DEEP_LINK = "whatsapp://send?phone=6588667253";

const formatPhoneDisplay = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) {
    return digits;
  }
  return `${digits.slice(0, 4)} ${digits.slice(4)}`;
};

const WhatsappIcon: React.FC<{ color?: string; size?: number }> = ({
  color = "#1FA855",
  size = 18,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M8 1.6a6.4 6.4 0 00-5.5 9.65L1.7 14.4l3.25-.84A6.4 6.4 0 108 1.6z"
      fill={color}
    />
    <path
      d="M5.6 4.9c-.13-.3-.27-.3-.4-.31h-.34a.66.66 0 00-.48.22 2 2 0 00-.63 1.49c0 .88.64 1.73.73 1.85.09.12 1.24 1.99 3.08 2.71 1.53.6 1.84.48 2.17.45.33-.03 1.07-.44 1.22-.86.15-.42.15-.78.1-.86-.04-.07-.16-.11-.34-.2-.18-.09-1.07-.53-1.23-.59-.17-.06-.29-.09-.4.09-.12.18-.47.58-.57.7-.1.12-.21.13-.39.04a4.9 4.9 0 01-1.45-.9 5.4 5.4 0 01-1-1.24c-.1-.18-.01-.28.08-.37l.27-.31c.09-.11.12-.18.18-.3.06-.12.03-.23-.01-.32-.05-.09-.4-.99-.55-1.34z"
      fill="#fff"
    />
  </svg>
);

const ArrowIcon: React.FC<{ color?: string; size?: number }> = ({
  color = "currentColor",
  size = 16,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 17 17"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M3 8.5h10M9 4.5l4 4-4 4"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CloseIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={styles.assessChatSheetCloseIcon}
  >
    <path d="M12.1956 2.86201C12.4559 2.60166 12.8779 2.60166 13.1383 2.86201C13.3986 3.12236 13.3986 3.54437 13.1383 3.80472L8.94298 8.00003L13.1383 12.1953C13.3986 12.4557 13.3986 12.8777 13.1383 13.1381C12.8779 13.3984 12.4559 13.3984 12.1956 13.1381L8.00028 8.94274L3.80496 13.1381C3.54461 13.3984 3.1226 13.3984 2.86225 13.1381C2.6019 12.8777 2.6019 12.4557 2.86225 12.1953L7.05757 8.00003L2.86225 3.80472C2.6019 3.54437 2.6019 3.12236 2.86225 2.86201C3.1226 2.60166 3.54461 2.60166 3.80496 2.86201L8.00028 7.05732L12.1956 2.86201Z" />
  </svg>
);

const AssessmentChatSheet: React.FC<TAssessmentChatSheetProps> = ({
  open,
  countryCode,
  phone,
  jobApplyId,
  onClose,
  onChatHere,
  onWhatsappReady,
}) => {
  const [phase, setPhase] = useState<TAssessmentChatSheetPhase>("channel");
  const [submitting, setSubmitting] = useState(false);
  const [whatsappCountryCode, setWhatsappCountryCode] = useState(countryCode);
  const [whatsappPhone, setWhatsappPhone] = useState(phone);

  useEffect(() => {
    if (open) {
      setWhatsappCountryCode(countryCode);
      setWhatsappPhone(phone);
      return;
    }

    setPhase("channel");
    setSubmitting(false);
  }, [open, countryCode, phone]);

  if (!open) {
    return null;
  }

  const whatsappPhoneDisplay = formatPhoneDisplay(whatsappPhone);
  const fullPhoneDisplay =
    `${whatsappCountryCode} ${whatsappPhoneDisplay}`.trim();

  const handleSelectAi = async () => {
    if (!jobApplyId) {
      message.error("Application not found");
      return;
    }

    setSubmitting(true);
    const { code } = await Post(
      `/api/candidate/job_applies/${jobApplyId}/interview_mode`,
      {
        mode: "ai",
        from: "web",
      },
    );
    setSubmitting(false);

    if (code === 0) {
      onClose();
      onChatHere();
      return;
    }

    message.error("Failed to start chat here");
  };

  const handleStartChatting = async () => {
    if (!isValidPhone(whatsappCountryCode, whatsappPhone)) {
      message.error("Please enter a valid WhatsApp number");
      return;
    }

    setSubmitting(true);
    const { code } = await Post(`/api/candidate/whatsapp_contact_number`, {
      whatsapp_country_code: whatsappCountryCode,
      whatsapp_phone_number: whatsappPhone,
    });
    setSubmitting(false);

    if (code === 0) {
      setPhase("whatsappHandoff");
      return;
    }

    message.error("Failed to start WhatsApp chat");
  };

  return (
    <>
      <div className={styles.assessChatSheetBackdrop} onClick={onClose} />
      <div className={styles.assessChatSheetPanel}>
        {phase === "channel" && (
          <>
            <div className={styles.assessChatSheetHeader}>
              <h3 className={styles.assessChatSheetTitle}>
                Let's continue on WhatsApp
              </h3>
              <button
                type="button"
                className={styles.assessChatSheetClose}
                onClick={onClose}
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            <button
              type="button"
              className={styles.assessChannelButtonWhatsapp}
              onClick={() => setPhase("whatsappConfirm")}
              disabled={submitting}
            >
              <span className={styles.assessChannelButtonIconWhatsapp}>
                <WhatsappIcon color="#fff" size={18} />
              </span>
              <span className={styles.assessChannelButtonCopy}>
                <span className={styles.assessChannelButtonTitle}>
                  Chat on WhatsApp
                </span>
                <span className={styles.assessChannelButtonSubtitle}>
                  Continue on your phone, reply anytime
                </span>
              </span>
              <ArrowIcon color="#fff" size={16} />
            </button>

            <div className={styles.assessChatSheetAltAction}>
              <button
                type="button"
                className={styles.assessChatSheetAltLink}
                onClick={handleSelectAi}
                disabled={submitting}
              >
                I don't have WhatsApp
              </button>
            </div>
          </>
        )}

        {phase === "whatsappConfirm" && (
          <>
            <div className={styles.assessWhatsappConfirmHead}>
              <span className={styles.assessWhatsappConfirmIcon}>
                <WhatsappIcon color="#1FA855" size={19} />
              </span>
              <h3 className={styles.assessWhatsappConfirmTitle}>
                Confirm your WhatsApp number
              </h3>
            </div>
            <p className={styles.assessWhatsappConfirmBody}>
              I'll message you here to pick up our conversation. Is this the
              right number to reach you on WhatsApp?
            </p>

            <div className={styles.assessWhatsappFieldLabel}>
              Your WhatsApp number
            </div>
            <div className={styles.phoneFieldWrap}>
              <PhoneWithCountryCode
                value={{
                  countryCode: whatsappCountryCode,
                  phoneNumber: whatsappPhone,
                }}
                onChange={(value) => {
                  setWhatsappCountryCode(value.countryCode ?? "");
                  setWhatsappPhone(value.phoneNumber ?? "");
                }}
              />
            </div>

            <button
              type="button"
              className={styles.assessWhatsappStartButton}
              onClick={handleStartChatting}
              disabled={submitting}
            >
              <WhatsappIcon color="#fff" size={18} />
              {submitting ? "Starting…" : "Start Chatting"}
            </button>
          </>
        )}

        {phase === "whatsappHandoff" && (
          <div className={styles.assessWhatsappHandoff}>
            <span className={styles.assessWhatsappHandoffIcon}>
              <WhatsappIcon color="#1FA855" size={28} />
            </span>
            <h3 className={styles.assessWhatsappHandoffTitle}>
              We've moved to WhatsApp
            </h3>
            <p className={styles.assessWhatsappHandoffBody}>
              Check your messages. I've just sent you a note to pick up where my
              read leaves off.
            </p>
            <a
              href={WHATSAPP_HANDOFF_DEEP_LINK}
              className={styles.assessWhatsappHandoffFallback}
            >
              <span className={styles.assessWhatsappHandoffFallbackLabel}>
                Didn&apos;t open?
              </span>
              <span className={styles.assessWhatsappHandoffFallbackNumber}>
                {fullPhoneDisplay}
              </span>
            </a>
            <button
              type="button"
              className={styles.assessWhatsappHandoffContinue}
              onClick={() => {
                onClose();
                onWhatsappReady();
              }}
            >
              Got it
            </button>
            <button
              type="button"
              className={styles.assessWhatsappHandoffAlt}
              onClick={handleSelectAi}
              disabled={submitting}
            >
              Or chat here instead
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default AssessmentChatSheet;
