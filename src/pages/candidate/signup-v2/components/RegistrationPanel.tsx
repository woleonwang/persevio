import { useEffect, useRef, useState } from "react";
import { Button, Checkbox, message } from "antd";
import Google from "@/assets/google.png";
import Linkedin from "@/assets/linkedin.png";
import MarkdownContainer from "@/components/MarkdownContainer";
import { Post } from "@/utils/request";
import privacyAgreement from "@/utils/privacyAgreement";
import terms from "@/utils/terms";
import { tokenStorage } from "@/utils/storage";

import { SignupPrimaryButton } from "./FlowShell";
import { isValidEmail } from "../utils";
import styles from "../style.module.less";

const OTP_RESEND_SECONDS = 60;
const OTP_LENGTH = 6;
const EMPTY_OTP_DIGITS = Array.from({ length: OTP_LENGTH }, () => "");

const ChevronLeftGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M10 3L5 8l5 5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Step3LinkedinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <rect width="18" height="18" rx="3" fill="#fff" />
    <path
      fill="#0A66C2"
      d="M5.2 6.4H3.2V14h2zM4.2 3.1a1.16 1.16 0 100 2.32 1.16 1.16 0 000-2.32zM14.8 14h-2v-3.7c0-.93-.33-1.56-1.16-1.56-.63 0-1 .43-1.17.84-.06.15-.08.36-.08.57V14h-2V6.4h2v1.04c.27-.41.74-1 1.8-1 1.32 0 2.31.86 2.31 2.72z"
    />
  </svg>
);

const Step3EmailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="#fff" strokeWidth="1.5" />
    <path
      d="M3 6l7 5 7-5"
      stroke="#fff"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type TRegistrationStep = "providers" | "email" | "otp";

type TRegistrationPanelProps = {
  candidateEmail: string;
  onVerified: () => void;
  compact?: boolean;
  variant?: "card" | "step3";
};

const RegistrationPanel: React.FC<TRegistrationPanelProps> = ({
  candidateEmail,
  onVerified,
  compact,
  variant = "card",
}) => {
  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const [termsType, setTermsType] = useState<"terms" | "privacy">();
  const [step, setStep] = useState<TRegistrationStep>("providers");
  const [email, setEmail] = useState(candidateEmail);
  const [emailError, setEmailError] = useState("");
  const [otpDigits, setOtpDigits] = useState(EMPTY_OTP_DIGITS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const [termsPulse, setTermsPulse] = useState(false);
  const digitInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const isStep3 = variant === "step3";
  const otp = otpDigits.join("");

  useEffect(() => {
    setEmail(candidateEmail);
  }, [candidateEmail]);

  useEffect(() => {
    if (resendSecondsLeft <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setResendSecondsLeft((seconds) => (seconds <= 1 ? 0 : seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSecondsLeft]);

  useEffect(() => {
    if (step !== "otp") {
      return;
    }
    window.setTimeout(() => {
      digitInputRefs.current[0]?.focus();
    }, 0);
  }, [step]);

  useEffect(() => {
    if (step !== "email") {
      return;
    }
    window.setTimeout(() => {
      emailInputRef.current?.focus();
    }, 0);
  }, [step]);

  const resetOtp = () => {
    setOtpDigits(EMPTY_OTP_DIGITS);
  };

  const goBackToProviders = () => {
    setStep("providers");
    setEmailError("");
    resetOtp();
  };

  const goBackToEmail = () => {
    setStep("email");
    setEmailError("");
    resetOtp();
  };

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = digit;
    setOtpDigits(nextDigits);

    if (digit && index < OTP_LENGTH - 1) {
      digitInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  const handleDigitPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) {
      return;
    }
    const nextDigits = Array.from(
      { length: OTP_LENGTH },
      (_, index) => pasted[index] || "",
    );
    setOtpDigits(nextDigits);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    digitInputRefs.current[focusIndex]?.focus();
  };

  const requireTerms = () => {
    if (!isTermsAgreed) {
      setTermsPulse(true);
      message.warning("Please read and agree to the agreement");
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

  const sendOtp = async (normalizedEmail: string, isResend = false) => {
    setIsSubmitting(true);
    const { code } = await Post("/api/candidate/signup/email/send_otp", {
      email: normalizedEmail,
    });
    setIsSubmitting(false);

    if (code === 0) {
      setStep("otp");
      resetOtp();
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
    if (code === 10016) {
      setStep("otp");
      resetOtp();
      setResendSecondsLeft(OTP_RESEND_SECONDS);
      return;
    }
    message.error("Failed to send code. Please try again.");
  };

  const handleEmailContinue = () => {
    if (!requireTerms()) {
      return;
    }
    if (resendSecondsLeft > 0) {
      setStep("otp");
      return;
    }
    setStep("email");
    setEmailError("");
  };

  const handleSendOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setEmailError("Please enter your email");
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setEmailError("Please enter a valid email");
      return;
    }

    setEmail(normalizedEmail);
    setEmailError("");

    if (resendSecondsLeft > 0) {
      setStep("otp");
      return;
    }

    await sendOtp(normalizedEmail);
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      message.warning("Please enter the code");
      return;
    }
    setIsSubmitting(true);
    const { code } = await Post("/api/candidate/signup/email/verify_otp", {
      email: email.trim().toLowerCase(),
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

  const isOtpComplete = otp.length === OTP_LENGTH;
  const providerDisabled = isSubmitting;
  const showInlineHeading = isStep3 && !compact && step === "providers";
  const showSheetHeading = isStep3 && compact && step === "providers";

  const providerButtons = (
    <div
      className={
        isStep3
          ? styles.step3ProviderGrid
          : undefined
      }
      style={
        isStep3
          ? undefined
          : {
              display: "grid",
              gridTemplateColumns: compact ? "1fr" : "repeat(3, 1fr)",
              gap: 10,
              marginTop: 18,
            }
      }
    >
      <Button
        className={
          isStep3 ? styles.step3ProviderLinkedin : styles.providerButton
        }
        disabled={providerDisabled}
        block={!isStep3 && compact}
        onClick={() => goToOAuth("linkedin")}
      >
        {isStep3 ? (
          <span className={styles.step3ProviderIcon}>
            <Step3LinkedinIcon />
          </span>
        ) : (
          <img src={Linkedin} alt="" style={{ width: 18, height: 18, marginRight: 8 }} />
        )}
        Continue with LinkedIn
      </Button>
      <Button
        className={isStep3 ? styles.step3ProviderGoogle : styles.providerButton}
        disabled={providerDisabled}
        block={!isStep3 && compact}
        onClick={() => goToOAuth("google")}
      >
        <span className={isStep3 ? styles.step3ProviderIcon : undefined}>
          <img src={Google} alt="" style={{ width: 18, height: 18, marginRight: isStep3 ? 0 : 8 }} />
        </span>
        Continue with Google
      </Button>
      <Button
        type={isStep3 ? "default" : "primary"}
        className={isStep3 ? styles.step3ProviderEmail : styles.providerButton}
        disabled={providerDisabled}
        block={!isStep3 && compact}
        style={isStep3 ? undefined : { background: "#221C12", borderColor: "#221C12" }}
        onClick={handleEmailContinue}
      >
        {isStep3 && (
          <span className={styles.step3ProviderIcon}>
            <Step3EmailIcon />
          </span>
        )}
        Continue with email
      </Button>
    </div>
  );

  const termsRow = (
    <div
      className={`${isStep3 ? styles.step3TermsRow : ""} ${
        termsPulse ? styles.step3TermsNudge : ""
      }`}
      style={isStep3 ? undefined : { marginTop: 14 }}
    >
      <Checkbox
        checked={isTermsAgreed}
        onChange={(e) => {
          setIsTermsAgreed(e.target.checked);
          if (e.target.checked) {
            setTermsPulse(false);
          }
        }}
      >
        I agree to Persevio's{" "}
        <a onClick={(e) => { e.preventDefault(); setTermsType("terms"); }}>Terms of Service</a>{" "}
        and{" "}
        <a onClick={(e) => { e.preventDefault(); setTermsType("privacy"); }}>Privacy Policy</a>.
      </Checkbox>
    </div>
  );

  const emailStep = (
    <div className={styles.otpBlock} style={{ marginTop: isStep3 ? 0 : 18 }}>
      <Button type="link" className={styles.otpBackButton} onClick={goBackToProviders}>
        <ChevronLeftGlyph />
        Back
      </Button>

      <div className={styles.otpHeader}>
        <div className={styles.otpTitle}>Continue with email</div>
        <div className={styles.otpSubtitle}>
          We&apos;ll send a 6-digit code to verify it&apos;s you.
        </div>
      </div>

      <div className={styles.otpFormStack}>
        <div className={styles.emailFieldWrap}>
          <input
            ref={emailInputRef}
            className={`${styles.fieldInput} ${styles.otpFieldInput} ${
              emailError ? styles.fieldInputError : ""
            }`}
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) {
                setEmailError("");
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleSendOtp();
              }
            }}
          />
          {emailError && <div className={styles.emailFieldError}>{emailError}</div>}
        </div>

        <SignupPrimaryButton
          className={styles.otpVerifyButton}
          loading={isSubmitting}
          onClick={() => void handleSendOtp()}
        >
          Send code
        </SignupPrimaryButton>
      </div>
    </div>
  );

  const otpStep = (
    <div className={styles.otpBlock} style={{ marginTop: isStep3 ? 0 : 18 }}>
      <Button type="link" className={styles.otpBackButton} onClick={goBackToEmail}>
        <ChevronLeftGlyph />
        Back
      </Button>

      <div className={styles.otpHeader}>
        <div className={styles.otpTitle}>Enter your code</div>
        <div className={styles.otpSubtitle}>
          We sent a 6-digit code to
          <br />
          <span className={styles.otpEmail}>{email}</span>
        </div>
      </div>

      <div className={styles.otpDigits}>
        {otpDigits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              digitInputRefs.current[index] = element;
            }}
            className={styles.otpDigitInput}
            value={digit}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            aria-label={`Digit ${index + 1}`}
            onChange={(event) => handleDigitChange(index, event.target.value)}
            onKeyDown={(event) => handleDigitKeyDown(index, event)}
            onPaste={handleDigitPaste}
            onFocus={(event) => event.target.select()}
          />
        ))}
      </div>

      <div className={styles.otpFormStack}>
        <SignupPrimaryButton
          className={styles.otpVerifyButton}
          disabled={!isOtpComplete}
          loading={isSubmitting}
          onClick={handleVerifyOtp}
        >
          Verify & continue
        </SignupPrimaryButton>
      </div>

      <div className={styles.otpResend}>
        Didn&apos;t get it?{" "}
        <Button
          type="link"
          className={styles.otpResendLink}
          disabled={resendSecondsLeft > 0 || isSubmitting}
          onClick={() => void sendOtp(email.trim().toLowerCase(), true)}
        >
          {resendSecondsLeft > 0
            ? `Resend code (${resendSecondsLeft}s)`
            : "Resend code"}
        </Button>
      </div>
    </div>
  );

  const content = (
    <>
      {showSheetHeading && (
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div className={styles.step3SignupTitle} style={{ fontSize: 21 }}>
            Continue your application
          </div>
          <p className={styles.step3SignupSub} style={{ marginTop: 4, fontSize: 13 }}>
            One quick step to save your progress, no password needed.
          </p>
        </div>
      )}

      {showInlineHeading && (
        <div className={styles.step3SignupHeading}>
          <div className={styles.step3SignupTitle}>Continue your application</div>
          <div className={styles.step3SignupSub}>Create your account, no password needed</div>
        </div>
      )}

      {!isStep3 && step === "providers" && (
        <>
          <h3 className={styles.serifTitle} style={{ fontSize: 22 }}>
            Continue your application
          </h3>
          <p className={styles.bodyText} style={{ marginTop: 8 }}>
            One quick step to save your progress, no password needed.
          </p>
        </>
      )}

      {step === "providers" ? (
        <>
          {providerButtons}
          {termsRow}
        </>
      ) : step === "email" ? (
        emailStep
      ) : (
        otpStep
      )}
    </>
  );

  return (
    <div
      className={
        isStep3
          ? compact
            ? undefined
            : styles.step3SignupCard
          : styles.card
      }
      style={isStep3 && compact ? undefined : { padding: isStep3 ? undefined : compact ? 20 : 24 }}
    >
      {content}

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
