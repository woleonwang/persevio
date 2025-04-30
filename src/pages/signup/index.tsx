import React, { useEffect, useState } from "react";
import { Form, Input, Button, message } from "antd";
import { GoogleOutlined } from "@ant-design/icons";
import logo from "../../assets/logo.png";
import { Get, Post } from "../../utils/request";
import { Link, useNavigate } from "react-router";
import SignContainer from "../../components/SignContainer";
import { TTrialUser } from "../job-requirement";

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
  const [trialUser, setTrialUser] = useState<TTrialUser>();

  const [form] = Form.useForm();

  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get("from");
    if (from === "trial") {
      fetchTrialUser();
    }
  }, []);

  const fetchTrialUser = async () => {
    const { code, data } = await Get("/api/trial_user/info");

    if (code === 0 && data) {
      const trialUser: TTrialUser = data.trial_user;
      setTrialUser(trialUser);
      form.setFieldsValue({
        username: trialUser.email,
      });
    }
  };

  const handleSignup = async () => {
    // 这里添加登录逻辑
    form.validateFields().then(async (values: SignupFormValues) => {
      const { username, password, company_name, staff_name } = values;
      const { code: signupCode } = await Post(
        trialUser ? "/api/register/from_trial_user" : "/api/register",
        trialUser
          ? {
              username,
              password,
              uuid: trialUser.uuid,
            }
          : {
              company_name,
              username,
              password,
              staff_name,
            }
      );

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

        {!trialUser && (
          <>
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
          </>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large">
            Sign Up
          </Button>
        </Form.Item>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            Already have an account?
            <Link to="/signin" style={{ marginLeft: 8, color: "#1FAC6A" }}>
              Sign In
            </Link>
          </div>
          <Button
            icon={<GoogleOutlined />}
            shape="circle"
            size="small"
            onClick={() => {
              window.location.href = `/api/auth/google/login?trial_user_id=${
                trialUser?.id ?? "abc"
              }`;
            }}
          />
        </div>
      </Form>
    </SignContainer>
  );
};

export default Signup;
