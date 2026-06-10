import { useEffect, useState } from "react";
import { Button, Checkbox, Input, message } from "antd";
import Google from "@/assets/google.png";
import Linkedin from "@/assets/linkedin.png";
import MarkdownContainer from "@/components/MarkdownContainer";
import { Post } from "@/utils/request";
import privacyAgreement from "@/utils/privacyAgreement";
import terms from "@/utils/terms";
import { tokenStorage } from "@/utils/storage";

import { SignupPrimaryButton } from "./FlowShell";
import styles from "../style.module.less";

const OTP_RESEND_SECONDS = 60;

type TRegistrationPanelProps = {
  candidateEmail: string;
  onVerified: () => void;
  compact?: boolean;
};

const RegistrationPanel: React.FC<TRegistrationPanelProps> = ({
  candidateEmail,
  onVerified,
  compact,
}) => {
  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const [termsType, setTermsType] = useState<"terms" | "privacy">();
  const [step, setStep] = useState<"providers" | "otp">("providers");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const [termsPulse, setTermsPulse] = useState(false);

  useEffect(() => {
    if (step !== "otp" || resendSecondsLeft <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setResendSecondsLeft((seconds) => (seconds <= 1 ? 0 : seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSecondsLeft, step]);

  const requireTerms = () => {
    if (!isTermsAgreed) {
      setTermsPulse(true);
      message.warning("Please agree to the terms first");
      return false;
    }
    return true;
  };

  const goToOAuth = (type: "google" | "linkedin") => {
    if (!requireTerms()) {
      return;
    }
    window.location.href = `/api/auth/${type}/login?role=candidate&candidate_token=${
      tokenStorage.getToken("candidate") || ""
    }&referrer=${encodeURIComponent(window.location.href)}`;
  };

  const sendOtp = async (isResend = false) => {
    const normalizedEmail = candidateEmail.trim().toLowerCase();
    setIsSubmitting(true);
    const { code } = await Post("/api/candidate/signup/email/send_otp", {
      email: normalizedEmail,
    });
    setIsSubmitting(false);

    if (code === 0) {
      setStep("otp");
      setResendSecondsLeft(OTP_RESEND_SECONDS);
      if (isResend) {
        message.success("A new code has been sent");
      }
      return;
    }
    if (code === 10011) {
      message.error("This email is already registered");
      return;
    }
    message.error("Failed to send code. Please try again.");
  };

  const handleEmailContinue = async () => {
    if (!requireTerms()) {
      return;
    }
    await sendOtp();
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      message.warning("Please enter the code");
      return;
    }
    setIsSubmitting(true);
    const { code } = await Post("/api/candidate/signup/email/verify_otp", {
      email: candidateEmail.trim().toLowerCase(),
      otp: otp.trim(),
    });
    setIsSubmitting(false);
    if (code === 0) {
      onVerified();
      return;
    }
    if (code === 10013) {
      message.error("Incorrect code");
      return;
    }
    message.error("Verification failed. Please try again.");
  };

  const providerDisabled = !isTermsAgreed || isSubmitting;

  return (
    <div className={styles.card} style={{ padding: compact ? 20 : 24 }}>
      <h3 className={styles.serifTitle} style={{ fontSize: 22 }}>
        Continue your application
      </h3>
      <p className={styles.bodyText} style={{ marginTop: 8 }}>
        One quick step to save your progress, no password needed.
      </p>

      {step === "providers" ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: compact ? "1fr" : "repeat(3, 1fr)",
              gap: 10,
              marginTop: 18,
            }}
          >
            <Button
              className={styles.providerButton}
              disabled={providerDisabled}
              block={compact}
              onClick={() => goToOAuth("linkedin")}
            >
              <img src={Linkedin} alt="" style={{ width: 18, height: 18, marginRight: 8 }} />
              Continue with LinkedIn
            </Button>
            <Button
              className={styles.providerButton}
              disabled={providerDisabled}
              block={compact}
              onClick={() => goToOAuth("google")}
            >
              <img src={Google} alt="" style={{ width: 18, height: 18, marginRight: 8 }} />
              Continue with Google
            </Button>
            <Button
              type="primary"
              className={styles.providerButton}
              disabled={providerDisabled}
              block={compact}
              style={{ background: "#221C12", borderColor: "#221C12" }}
              onClick={handleEmailContinue}
            >
              Continue with email
            </Button>
          </div>

          <div
            style={{
              marginTop: 14,
              padding: termsPulse ? "8px" : 0,
              borderRadius: 10,
              boxShadow: termsPulse ? "0 0 0 3px rgba(57,143,251,0.25)" : "none",
            }}
          >
            <Checkbox checked={isTermsAgreed} onChange={(e) => setIsTermsAgreed(e.target.checked)}>
              I agree to Persevio's{" "}
              <a onClick={(e) => { e.preventDefault(); setTermsType("terms"); }}>Terms of Service</a>{" "}
              and{" "}
              <a onClick={(e) => { e.preventDefault(); setTermsType("privacy"); }}>Privacy Policy</a>.
            </Checkbox>
          </div>
        </>
      ) : (
        <div style={{ marginTop: 18 }}>
          <div className={styles.eyebrow}>Enter your code</div>
          <p className={styles.bodyText} style={{ marginTop: 8 }}>
            We sent a 6-digit code to <strong>{candidateEmail}</strong>
          </p>
          <Input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="6-digit code"
            maxLength={6}
            style={{ marginTop: 12, height: 48 }}
          />
          <SignupPrimaryButton
            style={{ marginTop: 16, background: "#221C12", borderColor: "#221C12" }}
            loading={isSubmitting}
            onClick={handleVerifyOtp}
          >
            Verify & continue
          </SignupPrimaryButton>
          <Button
            type="link"
            className={styles.inlineLink}
            style={{ marginTop: 12 }}
            disabled={resendSecondsLeft > 0 || isSubmitting}
            onClick={() => sendOtp(true)}
          >
            {resendSecondsLeft > 0
              ? `Resend code (${resendSecondsLeft}s)`
              : "Didn't get it? Resend code"}
          </Button>
        </div>
      )}

      {termsType && (
        <>
          <div className={styles.sheetBackdrop} onClick={() => setTermsType(undefined)} />
          <div className={styles.modalPanel}>
            <MarkdownContainer
              content={termsType === "terms" ? terms : privacyAgreement}
            />
            <SignupPrimaryButton
              style={{ marginTop: 16 }}
              onClick={() => setTermsType(undefined)}
            >
              Close
            </SignupPrimaryButton>
          </div>
        </>
      )}
    </div>
  );
};

export default RegistrationPanel;
