import Logo from "@/assets/logo.png";
import Google from "@/assets/google.png";
import Linkedin from "@/assets/linkedin.png";
import styles from "./style.module.less";
import classnames from "classnames";
import { Input, message } from "antd";
import { useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { Post } from "@/utils/request";
import { tokenStorage } from "@/utils/storage";

type TEmailStepErrorType = "empty" | "invalid" | "notFound" | "";
type TOtpStepErrorType = "empty" | "incorrect" | "";
type TStep = "email" | "otp";

const OTP_RESEND_SECONDS = 60;

const OAuth = () => {
  const [step, setStep] = useState<TStep>("email");
  /** 首次点「Sign up with your Email」只展开输入框，再点一次才发 OTP */
  const [isEmailInputVisible, setIsEmailInputVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [emailStepErrorType, setEmailStepErrorType] =
    useState<TEmailStepErrorType>("");
  const [otpStepErrorType, setOtpStepErrorType] =
    useState<TOtpStepErrorType>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  const navigate = useNavigate();

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
    if (emailStepErrorType === "notFound") {
      return <span>Email does not exist. Please use a different one</span>;
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

  const sendOtp = async (isResend = false) => {
    const normalizedEmail = email.trim().toLowerCase();
    setIsSubmitting(true);
    const { code } = await Post("/api/candidate/signin/email/send_otp", {
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

    if (code === 10012) {
      setEmailStepErrorType("notFound");
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
    const { code, data } = await Post<{ token: string }>(
      "/api/candidate/signin/email/verify_otp",
      {
        email: email.trim().toLowerCase(),
        otp: normalizedOtp,
      },
    );
    setIsSubmitting(false);

    if (code === 0 && data?.token) {
      tokenStorage.setToken(data.token, "candidate");
      navigate("/candidate/jobs", { replace: true });
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
                Your next dream job is one conversation away.
              </div>

              <div className={styles.buttonGroup}>
                <div
                  onClick={() => {
                    window.location.href = `/api/auth/google/login?role=candidate`;
                  }}
                  className={classnames(styles.button, styles.google)}
                >
                  <img src={Google} className={styles.brand} />
                  Sign in with Google
                </div>

                <div
                  onClick={() => {
                    window.location.href = `/api/auth/linkedin/login?role=candidate`;
                  }}
                  className={classnames(styles.button, styles.linkedin)}
                >
                  <img src={Linkedin} className={styles.brand} />
                  Sign in with LinkedIn
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
                  className={classnames(styles.button, styles.emailButton, {
                    [styles.buttonDisabled]: isSubmitting,
                  })}
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
      </div>
    </div>
  );
};

export default OAuth;
