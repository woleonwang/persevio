import React, { useEffect, useRef } from "react";
import { Form, Input, Button, message } from "antd";
import logo from "../../assets/logo.png";
import { Post } from "../../utils/request";
import { Link, useNavigate } from "react-router";
import SignContainer from "../../components/SignContainer";

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
  const loadingRef = useRef<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");
    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl);
      navigate("/app/entry/create-job", { replace: true });
    }
  }, []);

  const handleSignIn = async () => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
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
        navigate("/app/entry/create-job", { replace: true });
      } else {
        message.error("Username or password is incorrect");
      }

      loadingRef.current = false;
    });
  };

  return (
    <SignContainer>
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

        <div>
          Don't have an account yet?
          <Link to="/apply" style={{ marginLeft: 8, color: "#1FAC6A" }}>
            Join the waitlist
          </Link>
        </div>
      </Form>
    </SignContainer>
  );
};

export default SignIn;
