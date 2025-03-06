import React from "react";
import { Form, Input, Button, message } from "antd";
import logo from "../../assets/logo.png";
import banner from "../../assets/login/banner.png";
import styles from "./style.module.less";
import { Post } from "../../utils/request";
import { useNavigate } from "react-router";

interface SigninFormValues {
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

const SignIn: React.FC = () => {
  const [form] = Form.useForm();

  const navigate = useNavigate();

  const handleSignIn = async () => {
    // 这里添加登录逻辑
    form.validateFields().then(async (values: SigninFormValues) => {
      const { username, password } = values;

      const { code, data } = await Post<SigninResponse>("/api/login", {
        username,
        password,
      });

      if (code === 0 && data) {
        message.success("Sign in succeed");
        localStorage.setItem("token", data.token);
        navigate("/agent");
      } else {
        message.error("Username or password is incorrect");
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
          <h2 style={{ fontSize: 36 }}>Sign in</h2>
          <Form
            form={form}
            name="login"
            onFinish={handleSignIn}
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

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large">
                Sign In
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
