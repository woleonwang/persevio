import React, { useState, useEffect, useRef } from "react";
import { Form, Input, Button, message, Checkbox, Modal } from "antd";
import { Post } from "@/utils/request";
import { useTranslation } from "react-i18next";
import styles from "./style.module.less";
import { Link } from "react-router";
import MarkdownContainer from "@/components/MarkdownContainer";
import privacyAgreement from "@/utils/privacyAgreement";
import terms from "@/utils/terms";
import { tokenStorage } from "@/utils/storage";

interface SignupFormValues {
  username: string;
  password: string;
  confirm_password: string;
  verify_code: string;

  company_name: string;
  staff_name: string;
  position: string;
  phone: string;
  website: string;
}

interface SigninResponse {
  token: string;
  staff: {
    staff_id: string;
    staff_name: string;
  };
}

interface IProps {
  onPrev: () => void;
  onNext: () => void;
}
const Register: React.FC<IProps> = (props) => {
  const { onNext } = props;
  const [countdown, setCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const [termsType, setTermsType] = useState<"terms" | "privacy">();
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const [form] = Form.useForm();
  const { t: originalT } = useTranslation();
  const t = (key: string) => {
    return originalT(`signup.${key}`);
  };

  // 清理倒计时定时器
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, []);

  // 倒计时逻辑 - 优化：只在开始时创建一次 interval
  useEffect(() => {
    if (countdown > 0 && !countdownRef.current) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (countdown === 0 && countdownRef.current) {
      // 当 countdown 变为 0 时，清理 interval
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [countdown]);

  // 发送验证码
  const sendVerificationCode = async () => {
    try {
      const email = form.getFieldValue("username");
      if (!email) {
        message.error(t("please_enter_email"));
        return;
      }

      setIsSendingCode(true);
      const { code } = await Post("/api/create_verify_code", {
        verify_key: email,
      });

      if (code === 0) {
        message.success(t("verification_code_sent"));
        setCountdown(60); // 开始60秒倒计时
      } else if (code === 100021) {
        message.error("Email exists");
      } else if (code === 100022) {
        message.error("Personal email not support");
      } else {
        message.error(t("verification_code_failed"));
      }
    } catch (error) {
      message.error(t("verification_code_failed"));
    } finally {
      setIsSendingCode(false);
    }
  };

  const checkEmail = async () => {
    if (!isTermsAgreed) {
      message.warning(t("agree_terms_warning"));
      return;
    }

    form.validateFields().then(async (values: SignupFormValues) => {
      const { username, password, verify_code } = values;
      const { code } = await Post("/api/precheck_verify_code", {
        verify_key: values.username,
        verify_code: values.verify_code,
      });

      if (code !== 0) {
        message.error(t("verification_code_incorrect"));
        return;
      }

      const { code: signupCode } = await Post("/api/register", {
        username,
        password,
        verify_code,
      });

      if (signupCode === 0) {
        const { code, data } = await Post<SigninResponse>("/api/login", {
          username,
          password,
        });

        if (code === 0 && data) {
          message.success(t("signup_succeed"));
          tokenStorage.setToken(data.token, "staff");
          onNext();
        }
      } else {
        const errMeesageMapping = {
          10002: t("verification_code_incorrect"),
          10003: t("email_exists"),
        };
        message.error(
          errMeesageMapping[signupCode as keyof typeof errMeesageMapping] ||
            t("signup_failed")
        );
      }
    });
  };

  return (
    <div className={styles.container}>
      {/* <Button
        type="default"
        icon={<ArrowLeftOutlined />}
        onClick={() => onPrev()}
        size="large"
        style={{ marginBottom: 16 }}
      /> */}
      <Form form={form} name="login" autoComplete="off" layout="vertical">
        <Form.Item
          label={t("email")}
          name="username"
          rules={[{ required: true, message: t("please_enter_email") }]}
          preserve
        >
          <Input placeholder={t("email_placeholder")} size="large" />
        </Form.Item>

        <Form.Item
          label={t("password")}
          name="password"
          rules={[
            {
              required: true,
            },
            {
              validator(_, value, callback) {
                if (process.env.NODE_ENV === "development") {
                  return callback();
                }
                // 校验密码格式，8位以上，必须包含大小写字母，数字，特殊字符
                if (!value) {
                  return callback(t("please_enter_password"));
                }
                if (value.length < 8) {
                  return callback(t("password_length_error"));
                }
                if (!/[A-Z]/.test(value)) {
                  return callback(t("password_uppercase_error"));
                }
                if (!/[a-z]/.test(value)) {
                  return callback(t("password_lowercase_error"));
                }
                if (!/[0-9]/.test(value)) {
                  return callback(t("password_number_error"));
                }
                if (
                  !/[`~!@#$%^&*()_\-+=<>?:"{}|,.\/;'\\[\]·！#￥（——）：；“”‘、，|《。》？、【】]/.test(
                    value
                  )
                ) {
                  return callback(t("password_special_error"));
                }
                return callback();
              },
            },
          ]}
          preserve
        >
          <Input.Password
            placeholder={t("password_placeholder")}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label={t("confirm_password")}
          name="confirm_password"
          rules={[
            {
              required: true,
              message: t("please_confirm_password"),
            },
            {
              validator(_, value, callback) {
                if (!value || form.getFieldValue("password") === value) {
                  return callback();
                }
                callback(t("confirm_password_error"));
              },
              message: t("confirm_password_error"),
            },
          ]}
          preserve
        >
          <Input.Password
            placeholder={t("confirm_password_placeholder")}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label={t("verification_code")}
          name="verify_code"
          rules={[
            {
              required: true,
              message: t("please_enter_verification_code"),
            },
          ]}
          preserve
        >
          <Input
            placeholder={t("verification_code_placeholder")}
            size="large"
            suffix={
              <Button
                type="primary"
                disabled={countdown > 0 || isSendingCode}
                onClick={sendVerificationCode}
                style={{
                  color: countdown > 0 || isSendingCode ? "#3682fe" : "white",
                }}
              >
                {countdown > 0
                  ? `${countdown}${t("countdown")}`
                  : isSendingCode
                  ? t("sending")
                  : t("send_code")}
              </Button>
            }
          />
        </Form.Item>
        <div className={styles.signin}>
          Already have an account? <Link to="/signin">{t("sign_in")}</Link>
        </div>

        <Button
          type="primary"
          block
          size="large"
          onClick={checkEmail}
          style={{ marginTop: 40 }}
        >
          {t("next_step")}
        </Button>
        <div style={{ marginTop: 16 }}>
          <Checkbox
            checked={isTermsAgreed}
            onChange={(e) => setIsTermsAgreed(e.target.checked)}
          >
            By signing in, you are agreeing to the{" "}
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
      </Form>
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

export default Register;
