import React, { useState, useEffect, useRef } from "react";
import { Form, Input, Button, message } from "antd";
import logo from "../../assets/logo.png";
import { Post } from "../../utils/request";
import { Link, useNavigate } from "react-router";
import SignContainer from "../../components/SignContainer";

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

const Signup: React.FC = () => {
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [step1Fields, setStep1Fields] = useState<Partial<SignupFormValues>>({});
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const [form] = Form.useForm();

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
        message.error("请先输入邮箱地址");
        return;
      }

      setIsSendingCode(true);
      const { code } = await Post("/api/create_verify_code", {
        verify_key: email,
      });

      if (code === 0) {
        message.success("验证码已发送");
        setCountdown(60); // 开始60秒倒计时
      } else {
        message.error("验证码发送失败");
      }
    } catch (error) {
      message.error("验证码发送失败");
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
        message.error("Verification code is incorrect");
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
          message.success("Sign up succeed");
          localStorage.setItem("token", data.token);
          navigate("/app/entry/create-job");
        }
      } else {
        message.error("Sign up failed");
      }
    });
  };

  return (
    <SignContainer>
      <img src={logo} style={{ width: 188 }} />
      <h2 style={{ fontSize: 36 }}>Sign up for an account</h2>
      <Form form={form} name="login" autoComplete="off" layout="vertical">
        {step === 1 ? (
          <>
            <Form.Item
              label="Email"
              name="username"
              rules={[{ required: true, message: "Please enter email" }]}
              preserve
            >
              <Input placeholder="Email" size="large" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please enter password" },
                {
                  validator(_, value, callback) {
                    if (process.env.NODE_ENV === "development") {
                      return callback();
                    }
                    // 校验密码格式，8位以上，必须包含大小写字母，数字，特殊字符
                    if (!value) {
                      return callback("请输入密码");
                    }
                    if (value.length < 8) {
                      return callback("密码长度需不少于8位");
                    }
                    if (!/[A-Z]/.test(value)) {
                      return callback("密码需包含大写字母");
                    }
                    if (!/[a-z]/.test(value)) {
                      return callback("密码需包含小写字母");
                    }
                    if (!/[0-9]/.test(value)) {
                      return callback("密码需包含数字");
                    }
                    if (
                      !/[`~!@#$%^&*()_\-+=<>?:"{}|,.\/;'\\[\]·！#￥（——）：；“”‘、，|《。》？、【】]/.test(
                        value
                      )
                    ) {
                      return callback("密码需包含特殊字符");
                    }
                    return callback();
                  },
                },
              ]}
              preserve
            >
              <Input.Password placeholder="Password" size="large" />
            </Form.Item>

            <Form.Item
              label="Confirm Password"
              name="confirm_password"
              rules={[
                { required: true, message: "Please confirm password" },
                {
                  validator(_, value, callback) {
                    if (!value || form.getFieldValue("password") === value) {
                      return callback();
                    }
                    callback("Confirm password is incorrect");
                  },
                  message: "Confirm password is incorrect",
                },
              ]}
              preserve
            >
              <Input.Password placeholder="Confirm Password" size="large" />
            </Form.Item>

            <Form.Item
              label="Verification Code"
              name="verify_code"
              rules={[
                { required: true, message: "Please enter verification code" },
              ]}
              preserve
            >
              <Input
                placeholder="Verification Code"
                size="large"
                suffix={
                  <Button
                    type="primary"
                    disabled={countdown > 0 || isSendingCode}
                    onClick={sendVerificationCode}
                    style={{
                      color:
                        countdown > 0 || isSendingCode ? "#1FAC6A" : "white",
                    }}
                  >
                    {countdown > 0
                      ? `${countdown}s`
                      : isSendingCode
                      ? "发送中..."
                      : "发送验证码"}
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
                Next Step
              </Button>
            </Form.Item>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                Already have an account?
                <Link to="/signin" style={{ marginLeft: 8, color: "#1FAC6A" }}>
                  Sign In
                </Link>
              </div>
            </div>
          </>
        ) : (
          <>
            <Form.Item
              label="Your Name"
              name="staff_name"
              rules={[{ required: true, message: "Please enter your name" }]}
            >
              <Input placeholder="Your Name" size="large" />
            </Form.Item>

            <Form.Item
              label="Position"
              name="position"
              rules={[
                { required: true, message: "Please enter your position" },
              ]}
            >
              <Input placeholder="Position" size="large" />
            </Form.Item>

            <Form.Item
              label="Phone"
              name="phone"
              rules={[
                { required: true, message: "Please enter your phone number" },
                {
                  validator: (_, value, callback) => {
                    // 国际手机号正则，支持+86、+1等国家码，也支持本地手机号
                    const phoneRegex = /^(\+?\d{1,4}[-\s]?)?(\d{6,20})$/;
                    if (!phoneRegex.test(value)) {
                      callback("请输入有效的手机号（支持国际号码）");
                    }
                    callback();
                  },
                },
              ]}
            >
              <Input placeholder="Phone Number" size="large" />
            </Form.Item>

            <Form.Item
              label="Company Name"
              name="company_name"
              rules={[
                { required: true, message: "Please enter your company name" },
              ]}
            >
              <Input placeholder="Company Name" size="large" />
            </Form.Item>

            <Form.Item
              label="Website"
              name="website"
              rules={[{ required: true, message: "Please enter your website" }]}
            >
              <Input placeholder="Website" size="large" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                onClick={handleSignup}
              >
                Sign Up
              </Button>
            </Form.Item>
          </>
        )}
      </Form>
    </SignContainer>
  );
};

export default Signup;
