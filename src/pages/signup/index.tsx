import React from "react";
import { Form, Input, Button, message } from "antd";
import logo from "../../assets/logo.png";
import banner from "../../assets/login/banner.png";
import styles from "./style.module.less";
import { Post } from "../../utils/request";
import { useNavigate } from "react-router";

interface SignupFormValues {
  username: string;
  password: string;
  company_name: string;
  staff_name: string;
}

interface SigninResponse {
  token: string;
  staff: {
    staff_id: string;
    staff_name: string;
  };
}

const Signup: React.FC = () => {
  const [form] = Form.useForm();

  const navigate = useNavigate();

  const handleSignup = async () => {
    // 这里添加登录逻辑
    form.validateFields().then(async (values: SignupFormValues) => {
      const { username, password, company_name, staff_name } = values;
      const { code: signupCode } = await Post("/api/register", {
        company_name,
        username,
        password,
        staff_name,
      });

      if (signupCode === 0) {
        const { code, data } = await Post<SigninResponse>("/api/login", {
          username,
          password,
        });

        if (code === 0 && data) {
          message.success("Sign up succeed");
          localStorage.setItem("token", data.token);
          navigate("/agent");
        }
      } else {
        message.error("Sign up failed");
      }
    });
  };

  return (
    <div className={styles.loginContainer}>
      <div style={{ flex: "none" }}>
        <img src={banner} style={{ height: "100vh" }} />
      </div>
      <div
        style={{
          flex: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: 474 }}>
          <img src={logo} style={{ width: 188 }} />
          <h2 style={{ fontSize: 36 }}>Sign up for an account</h2>
          <Form
            form={form}
            name="login"
            onFinish={handleSignup}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              label="Email"
              name="username"
              rules={[{ required: true, message: "Please enter email" }]}
            >
              <Input placeholder="Email" size="large" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please enter password" }]}
            >
              <Input.Password placeholder="Password" size="large" />
            </Form.Item>

            <Form.Item
              label="Company Name"
              name="company_name"
              rules={[{ required: true, message: "Please enter company name" }]}
            >
              <Input placeholder="Copmany Name" size="large" />
            </Form.Item>

            <Form.Item
              label="Your Name"
              name="staff_name"
              rules={[{ required: true, message: "Please enter your name" }]}
            >
              <Input placeholder="Your Name" size="large" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large">
                Sign Up
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
