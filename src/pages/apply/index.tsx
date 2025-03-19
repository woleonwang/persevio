import React from "react";
import { Form, Input, Button, message } from "antd";
import logo from "../../assets/logo.png";
import { Post } from "../../utils/request";
import { Link } from "react-router";
import SignContainer from "../../components/SignContainer";

interface SignupFormValues {
  name: string;
  email: string;
  company_name: string;
}

const Apply: React.FC = () => {
  const [form] = Form.useForm();

  const submit = async () => {
    form.validateFields().then(async (values: SignupFormValues) => {
      const { name, email, company_name } = values;
      const { code } = await Post("/api/account_applies", {
        name,
        email,
        company_name,
      });

      if (code === 0) {
        message.success("Join the waitlist succeed!");
        form.resetFields();
      } else {
        message.error("Operation failed");
      }
    });
  };

  return (
    <SignContainer>
      <img src={logo} style={{ width: 188 }} />
      <h2 style={{ fontSize: 36 }}>Join the waitlist</h2>
      <Form
        form={form}
        name="login"
        onFinish={submit}
        autoComplete="off"
        layout="vertical"
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please enter your name" }]}
        >
          <Input placeholder="Please enter your name" size="large" />
        </Form.Item>
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: "Please enter your email" }]}
        >
          <Input placeholder="Please enter your email" size="large" />
        </Form.Item>

        <Form.Item
          label="Company Name"
          name="company_name"
          rules={[
            { required: true, message: "Please enter your company name" },
          ]}
        >
          <Input placeholder="Please enter your company name" size="large" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large">
            Join the waitlist
          </Button>
        </Form.Item>
        <div>
          Already have an account?
          <Link to="/signin" style={{ marginLeft: 8, color: "#1FAC6A" }}>
            Sign In
          </Link>
        </div>
      </Form>
    </SignContainer>
  );
};

export default Apply;
