import React, { useState, useEffect, useRef } from "react";
import { Form, Input, Button, message } from "antd";
import logo from "@/assets/logo.png";
import { Post } from "@/utils/request";
import { Link, useNavigate } from "react-router";
import SignContainer from "@/components/SignContainer";
import { useTranslation } from "react-i18next";

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

const CompanyInfo: React.FC = () => {
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [step1Fields, setStep1Fields] = useState<Partial<SignupFormValues>>({});
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const [form] = Form.useForm();
  const { t } = useTranslation();

  const navigate = useNavigate();

  // 清理倒计时定时器
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [countdown]);

  // 发送验证码
  const sendVerificationCode = async () => {
    try {
      const email = form.getFieldValue("username");
      if (!email) {
        message.error(t("signup.please_enter_email"));
        return;
      }

      setIsSendingCode(true);
      const { code } = await Post("/api/create_verify_code", {
        verify_key: email,
      });

      if (code === 0) {
        message.success(t("signup.verification_code_sent"));
        setCountdown(60); // 开始60秒倒计时
      } else {
        message.error(t("signup.verification_code_failed"));
      }
    } catch (error) {
      message.error(t("signup.verification_code_failed"));
    } finally {
      setIsSendingCode(false);
    }
  };

  const checkEmail = async () => {
    form.validateFields().then(async (values: SignupFormValues) => {
      const { code } = await Post("/api/precheck_verify_code", {
        verify_key: values.username,
        verify_code: values.verify_code,
      });
      if (code === 0) {
        setStep1Fields(values);
        setStep(2);
      } else {
        message.error(t("signup.verification_code_incorrect"));
      }
    });
  };

  const handleSignup = async () => {
    // 这里添加登录逻辑
    form.validateFields().then(async (values: SignupFormValues) => {
      const { username, password, verify_code } = step1Fields;
      const { company_name, staff_name, position, phone, website } = values;
      const { code: signupCode } = await Post("/api/register", {
        username,
        password,
        verify_code,
        company_name,
        staff_name,
        position,
        phone,
        website,
      });

      if (signupCode === 0) {
        const { code, data } = await Post<SigninResponse>("/api/login", {
          username,
          password,
        });

        if (code === 0 && data) {
          message.success(t("signup.signup_succeed"));
          localStorage.setItem("token", data.token);
          navigate("/app/entry/create-job");
        }
      } else {
        const errMeesageMapping = {
          10002: t("signup.verification_code_incorrect"),
          10003: t("signup.email_exists"),
        };
        message.error(
          errMeesageMapping[signupCode as keyof typeof errMeesageMapping] ||
            t("signup.signup_failed")
        );
      }
    });
  };

  return (
    <SignContainer>
      <img src={logo} style={{ width: 188 }} />
      <h2 style={{ fontSize: 36 }}>{t("signup.title")}</h2>
      <Form form={form} name="login" autoComplete="off" layout="vertical">
        {step === 1 ? (
          <>
            <Form.Item
              label={t("signup.email")}
              name="username"
              rules={[
                { required: true, message: t("signup.please_enter_email") },
              ]}
              preserve
            >
              <Input placeholder={t("signup.email_placeholder")} size="large" />
            </Form.Item>

            <Form.Item
              label={t("signup.password")}
              name="password"
              rules={[
                {
                  validator(_, value, callback) {
                    if (process.env.NODE_ENV === "development") {
                      return callback();
                    }
                    // 校验密码格式，8位以上，必须包含大小写字母，数字，特殊字符
                    if (!value) {
                      return callback(t("signup.please_enter_password"));
                    }
                    if (value.length < 8) {
                      return callback(t("signup.password_length_error"));
                    }
                    if (!/[A-Z]/.test(value)) {
                      return callback(t("signup.password_uppercase_error"));
                    }
                    if (!/[a-z]/.test(value)) {
                      return callback(t("signup.password_lowercase_error"));
                    }
                    if (!/[0-9]/.test(value)) {
                      return callback(t("signup.password_number_error"));
                    }
                    if (
                      !/[`~!@#$%^&*()_\-+=<>?:"{}|,.\/;'\\[\]·！#￥（——）：；“”‘、，|《。》？、【】]/.test(
                        value
                      )
                    ) {
                      return callback(t("signup.password_special_error"));
                    }
                    return callback();
                  },
                },
              ]}
              preserve
            >
              <Input.Password
                placeholder={t("signup.password_placeholder")}
                size="large"
              />
            </Form.Item>

            <Form.Item
              label={t("signup.confirm_password")}
              name="confirm_password"
              rules={[
                {
                  required: true,
                  message: t("signup.please_confirm_password"),
                },
                {
                  validator(_, value, callback) {
                    if (!value || form.getFieldValue("password") === value) {
                      return callback();
                    }
                    callback(t("signup.confirm_password_error"));
                  },
                  message: t("signup.confirm_password_error"),
                },
              ]}
              preserve
            >
              <Input.Password
                placeholder={t("signup.confirm_password_placeholder")}
                size="large"
              />
            </Form.Item>

            <Form.Item
              label={t("signup.verification_code")}
              name="verify_code"
              rules={[
                {
                  required: true,
                  message: t("signup.please_enter_verification_code"),
                },
              ]}
              preserve
            >
              <Input
                placeholder={t("signup.verification_code_placeholder")}
                size="large"
                suffix={
                  <Button
                    type="primary"
                    disabled={countdown > 0 || isSendingCode}
                    onClick={sendVerificationCode}
                    style={{
                      color:
                        countdown > 0 || isSendingCode ? "#3682fe" : "white",
                    }}
                  >
                    {countdown > 0
                      ? `${countdown}${t("signup.countdown")}`
                      : isSendingCode
                      ? t("signup.sending")
                      : t("signup.send_code")}
                  </Button>
                }
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                onClick={checkEmail}
              >
                {t("signup.next_step")}
              </Button>
            </Form.Item>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                {t("signup.already_have_account")}
                <Link to="/signin" style={{ marginLeft: 8, color: "#3682fe" }}>
                  {t("signup.sign_in")}
                </Link>
              </div>
            </div>
          </>
        ) : (
          <>
            <Form.Item
              label={t("signup.your_name")}
              name="staff_name"
              rules={[
                { required: true, message: t("signup.please_enter_name") },
              ]}
            >
              <Input placeholder={t("signup.name_placeholder")} size="large" />
            </Form.Item>

            <Form.Item
              label={t("signup.position")}
              name="position"
              rules={[
                { required: true, message: t("signup.please_enter_position") },
              ]}
            >
              <Input
                placeholder={t("signup.position_placeholder")}
                size="large"
              />
            </Form.Item>

            <Form.Item
              label={t("signup.phone")}
              name="phone"
              rules={[
                { required: true, message: t("signup.please_enter_phone") },
                {
                  validator: (_, value, callback) => {
                    // 国际手机号正则，支持+86、+1等国家码，也支持本地手机号
                    const phoneRegex = /^(\+?\d{1,4}[-\s]?)?(\d{6,20})$/;
                    if (!phoneRegex.test(value)) {
                      callback(t("signup.phone_format_error"));
                    }
                    callback();
                  },
                },
              ]}
            >
              <Input placeholder={t("signup.phone_placeholder")} size="large" />
            </Form.Item>

            <Form.Item
              label={t("signup.company_name")}
              name="company_name"
              rules={[
                { required: true, message: t("signup.please_enter_company") },
              ]}
            >
              <Input
                placeholder={t("signup.company_placeholder")}
                size="large"
              />
            </Form.Item>

            <Form.Item
              label={t("signup.website")}
              name="website"
              rules={[
                { required: true, message: t("signup.please_enter_website") },
              ]}
            >
              <Input
                placeholder={t("signup.website_placeholder")}
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                onClick={handleSignup}
              >
                {t("signup.sign_up")}
              </Button>
            </Form.Item>
          </>
        )}
      </Form>
    </SignContainer>
  );
};

export default CompanyInfo;
