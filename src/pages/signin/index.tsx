import React, { useEffect, useRef } from "react";
import { Form, Input, Button, message } from "antd";
import logo from "../../assets/logo.png";
import { Post } from "../../utils/request";
import { Link, useNavigate } from "react-router";
import SignContainer from "../../components/SignContainer";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get("token");
  const redirect = decodeURIComponent(urlParams.get("redirect") ?? "");

  useEffect(() => {
    if (tokenFromUrl) {
      signInSucceed(tokenFromUrl);
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
        message.success(t("signin.signin_succeed"));
        signInSucceed(data.token);
      } else {
        message.error(t("signin.username_or_password_incorrect"));
      }

      loadingRef.current = false;
    });
  };

  const signInSucceed = (token: string) => {
    localStorage.setItem("token", token);
    navigate(redirect || "/app/entry/create-job", { replace: true });
  };

  return (
    <SignContainer>
      <img src={logo} style={{ width: 188 }} />
      <h2 style={{ fontSize: 36 }}>{t("signin.title")}</h2>
      <Form
        form={form}
        name="login"
        onFinish={handleSignIn}
        autoComplete="off"
        layout="vertical"
      >
        <Form.Item
          label={t("signin.email")}
          name="username"
          rules={[{ required: true, message: t("signin.please_enter_email") }]}
        >
          <Input placeholder={t("signin.email_placeholder")} size="large" />
        </Form.Item>

        <Form.Item
          label={t("signin.password")}
          name="password"
          rules={[{ required: true, message: t("signin.please_enter_password") }]}
        >
          <Input.Password placeholder={t("signin.password_placeholder")} size="large" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large">
            {t("signin.sign_in")}
          </Button>
        </Form.Item>

        <div>
          {t("signin.dont_have_account")}
          <Link to="/signup" style={{ marginLeft: 8, color: "#3682fe" }}>
            {t("signin.sign_up")}
          </Link>
        </div>
      </Form>
    </SignContainer>
  );
};

export default SignIn;
