import { useEffect, useMemo, useState } from "react";
import { Checkbox, Input, message, Modal } from "antd";
import classnames from "classnames";
import { Link } from "react-router";
import privacyAgreement from "@/utils/privacyAgreement";
import terms from "@/utils/terms";
import Google from "@/assets/google.png";
import Linkedin from "@/assets/linkedin.png";
import Logo from "@/assets/logo.png";
import styles from "./style.module.less";
import MarkdownContainer from "@/components/MarkdownContainer";
import { tokenStorage } from "@/utils/storage";
import { Post } from "@/utils/request";

type TEmailStepErrorType = "empty" | "invalid" | "alreadyExists" | "";
type TOtpStepErrorType = "empty" | "incorrect" | "";
type TStep = "email" | "otp";

const OTP_RESEND_SECONDS = 60;

export interface BindingProps {
  onEmailOtpVerified: () => void;
}

const Binding = (props: BindingProps) => {
  const { onEmailOtpVerified } = props;

  const [termsType, setTermsType] = useState<"terms" | "privacy">();
  const [isTermsAgreed, setIsTermsAgreed] = useState(false);

  const [step, setStep] = useState<TStep>("email");
  const [isEmailInputVisible, setIsEmailInputVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [emailStepErrorType, setEmailStepErrorType] =
    useState<TEmailStepErrorType>("");
  const [otpStepErrorType, setOtpStepErrorType] =
    useState<TOtpStepErrorType>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  useEffect(() => {
    if (step !== "otp" || resendSecondsLeft <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setResendSecondsLeft((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [resendSecondsLeft, step]);

  const emailStepError = useMemo(() => {
    if (emailStepErrorType === "empty") {
      return <span>Please enter your email</span>;
    }
    if (emailStepErrorType === "invalid") {
      return <span>Please enter a valid email address</span>;
    }
    if (emailStepErrorType === "alreadyExists") {
      return (
        <span>
          This email is already registered. Please{" "}
          <Link to="/signin-candidate">sign in</Link> or use a different one
        </span>
      );
    }
    return null;
  }, [emailStepErrorType]);

  const otpStepError = useMemo(() => {
    if (otpStepErrorType === "empty") {
      return <span>Please enter the OTP</span>;
    }
    if (otpStepErrorType === "incorrect") {
      return <span>Incorrect OTP</span>;
    }
    return null;
  }, [otpStepErrorType]);

  const isEmailValid = (emailInput: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput);
  };

  const requireTerms = () => {
    if (!isTermsAgreed) {
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
    }&referrer=${window.location.origin + window.location.pathname}`;
  };

  const sendOtp = async (isResend = false) => {
    const normalizedEmail = email.trim().toLowerCase();
    setIsSubmitting(true);
    const { code } = await Post("/api/candidate/signup/email/send_otp", {
      email: normalizedEmail,
    });
    setIsSubmitting(false);

    if (code === 0) {
      setEmailStepErrorType("");
      setOtpStepErrorType("");
      setStep("otp");
      setResendSecondsLeft(OTP_RESEND_SECONDS);
      if (isResend) {
        message.success("A new OTP has been sent to your Email");
      }
      return;
    }

    if (code === 10011) {
      setEmailStepErrorType("alreadyExists");
      setStep("email");
      setIsEmailInputVisible(true);
      return;
    }
    if (code === 10001) {
      setEmailStepErrorType("invalid");
      setStep("email");
      setIsEmailInputVisible(true);
      return;
    }
    if (code === 10016) {
      setResendSecondsLeft(OTP_RESEND_SECONDS);
      return;
    }

    message.error("Failed to send OTP. Please try again.");
  };

  const handleEmailContinue = async () => {
    if (!requireTerms()) {
      return;
    }
    if (!isEmailInputVisible) {
      setIsEmailInputVisible(true);
      setEmailStepErrorType("");
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setEmailStepErrorType("empty");
      return;
    }
    if (!isEmailValid(normalizedEmail)) {
      setEmailStepErrorType("invalid");
      return;
    }
    setEmail(normalizedEmail);
    setEmailStepErrorType("");
    await sendOtp();
  };

  const handleVerifyOtp = async () => {
    const normalizedOtp = otp.trim();
    if (!normalizedOtp) {
      setOtpStepErrorType("empty");
      return;
    }
    setIsSubmitting(true);
    const { code } = await Post("/api/candidate/signup/email/verify_otp", {
      email: email.trim().toLowerCase(),
      otp: normalizedOtp,
    });
    setIsSubmitting(false);

    if (code === 0) {
      onEmailOtpVerified();
      return;
    }

    if (code === 10001) {
      setOtpStepErrorType("empty");
      return;
    }
    if (code === 10013) {
      setOtpStepErrorType("incorrect");
      return;
    }
    if (code === 10014 || code === 10015) {
      message.error("Verification failed. Please try again.");
      return;
    }
    message.error("Failed to verify OTP. Please try again.");
  };

  const handleMainAction = () => {
    if (isSubmitting) {
      return;
    }
    if (step === "email") {
      handleEmailContinue();
      return;
    }
    handleVerifyOtp();
  };

  return (
    <div className={styles.container}>
      <div className={styles.body}>
        <div className={styles.buttonWrapper}>
          <div
            className={classnames(styles.logoWrapper, styles.desktopVisible)}
          >
            <img src={Logo} />
          </div>

          {step === "email" ? (
            <>
              <div className={styles.listTitle}>
                In the meantime, log onto the Persevio platform to manage your
                entire application process in one place.
              </div>
              <div className={styles.listItem}>
                Track your application status 24/7.
              </div>
              <div className={styles.listItem}>
                Receive instant updates on interview schedules.
              </div>
              <div className={styles.listItem}>
                Get hyper-personalized job recommendations just like this one.
              </div>

              <div className={styles.buttonGroup}>
                <div
                  onClick={() => {
                    goToOAuth("google");
                  }}
                  className={classnames(styles.button, styles.google)}
                >
                  <img src={Google} className={styles.brand} />
                  Sign up with Google
                </div>

                <div
                  onClick={() => {
                    goToOAuth("linkedin");
                  }}
                  className={classnames(styles.button, styles.linkedin)}
                >
                  <img src={Linkedin} className={styles.brand} />
                  Sign up with LinkedIn
                </div>

                <div className={styles.emailLoginGroup}>
                  {isEmailInputVisible && (
                    <>
                      <Input
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailStepErrorType("");
                        }}
                        placeholder="Enter your Email"
                        className={classnames(styles.input, {
                          [styles.inputError]: !!emailStepError,
                        })}
                        onPressEnter={handleMainAction}
                        autoFocus
                      />
                      {emailStepError && (
                        <div className={styles.errorText}>{emailStepError}</div>
                      )}
                    </>
                  )}

                  <div
                    className={classnames(styles.button, styles.emailButton, {
                      [styles.buttonDisabled]: isSubmitting,
                    })}
                    onClick={handleMainAction}
                  >
                    Sign up with your Email
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.buttonGroup}>
              <div
                className={styles.changeEmail}
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setOtpStepErrorType("");
                  setIsEmailInputVisible(true);
                }}
              >
                {"< Change"}
              </div>

              <div className={styles.otpHint}>
                Enter the OTP sent to {email}
              </div>

              <div className={styles.emailLoginGroup}>
                <Input
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    setOtpStepErrorType("");
                  }}
                  placeholder="Enter the OTP"
                  className={classnames(styles.input, {
                    [styles.inputError]: !!otpStepError,
                  })}
                  onPressEnter={handleMainAction}
                />
                {otpStepError && (
                  <div className={styles.errorText}>{otpStepError}</div>
                )}

                <div
                  className={classnames(
                    styles.button,
                    styles.continuePrimary,
                    {
                      [styles.buttonDisabled]: isSubmitting,
                    },
                  )}
                  onClick={handleMainAction}
                >
                  Continue
                </div>

                <div
                  className={classnames(styles.resendOtp, {
                    [styles.resendOtpDisabled]:
                      resendSecondsLeft > 0 || isSubmitting,
                  })}
                  onClick={() => {
                    if (resendSecondsLeft > 0 || isSubmitting) {
                      return;
                    }
                    sendOtp(true);
                  }}
                >
                  Resend OTP
                  {resendSecondsLeft > 0 ? ` ${resendSecondsLeft}s` : ""}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className={styles.termsWrapper}>
          <Checkbox
            checked={isTermsAgreed}
            onChange={(e) => setIsTermsAgreed(e.target.checked)}
          >
            By signing up, you are agreeing to the{" "}
            <span
              className={styles.termsLink}
              onClick={(e) => {
                e.preventDefault();
                setTermsType("terms");
              }}
            >
              Terms of Service
            </span>{" "}
            and{" "}
            <span
              className={styles.termsLink}
              onClick={(e) => {
                e.preventDefault();
                setTermsType("privacy");
              }}
            >
              Privacy Policy
            </span>
          </Checkbox>
        </div>
      </div>
      <Modal
        open={!!termsType}
        onCancel={() => setTermsType(undefined)}
        onOk={() => setTermsType(undefined)}
        title={termsType === "terms" ? "Terms of Service" : "Privacy Policy"}
        centered
        width={"80%"}
        style={{ maxWidth: 1000, maxHeight: "90vh" }}
        cancelButtonProps={{
          style: {
            display: "none",
          },
        }}
      >
        <div style={{ maxHeight: "70vh", overflow: "auto" }}>
          <MarkdownContainer
            content={(termsType === "terms"
              ? terms
              : privacyAgreement
            ).replaceAll("\n", "\n\n")}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Binding;
