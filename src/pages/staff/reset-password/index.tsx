import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";

import { Post } from "@/utils/request";
import SignContainer from "@/components/SignContainer";

import styles from "./style.module.less";

const StaffResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const trimmedToken = token?.trim() ?? "";

  const handleSubmit = async (values: {
    password: string;
    confirmPassword: string;
  }) => {
    if (!trimmedToken) {
      message.error(t("staffPasswordReset.missingToken"));
      return;
    }
    if (loading) {
      return;
    }
    setLoading(true);
    try {
      const password = String(values.password ?? "");
      const { code } = await Post("/api/staff/reset_password", {
        token: trimmedToken,
        password,
      });
      if (code === 0) {
        message.success(t("staffPasswordReset.resetOk"));
        navigate("/signin", { replace: true });
      } else if (code === 10001) {
        message.error(t("staffPasswordReset.invalidParams"));
      } else if (code === 10002) {
        message.error(t("staffPasswordReset.invalidOrExpired"));
      } else if (code === 10003) {
        message.error(t("staffPasswordReset.resetFailedTryLater"));
      } else {
        message.error(t("staffPasswordReset.requestFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!trimmedToken) {
    return (
      <SignContainer title={t("staffPasswordReset.resetTitle")}>
        <div className={styles.missingTokenWrap}>
          <p className={styles.missingTokenText}>
            {t("staffPasswordReset.missingToken")}
          </p>
          <Link to="/staff/forgot-password" style={{ color: "#3682fe" }}>
            {t("staffPasswordReset.goForgot")}
          </Link>
        </div>
      </SignContainer>
    );
  }

  return (
    <SignContainer title={t("staffPasswordReset.resetTitle")}>
      <Form
        form={form}
        layout="vertical"
        className={styles.formRoot}
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Form.Item
          label={t("staffPasswordReset.newPassword")}
          name="password"
          rules={[
            { required: true, message: t("signin.please_enter_password") },
            { min: 6, message: t("staffPasswordReset.minPassword") },
          ]}
        >
          <Input.Password
            placeholder={t("signin.password_placeholder")}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label={t("staffPasswordReset.confirmPassword")}
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            { required: true, message: t("staffPasswordReset.pleaseConfirm") },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(t("staffPasswordReset.passwordMismatch"))
                );
              },
            }),
          ]}
        >
          <Input.Password
            placeholder={t("staffPasswordReset.pleaseConfirm")}
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
          >
            {t("staffPasswordReset.submitReset")}
          </Button>
        </Form.Item>

        <div className={styles.footerRow}>
          <Link to="/signin" style={{ color: "#3682fe" }}>
            {t("staffPasswordReset.backToSignin")}
          </Link>
        </div>
      </Form>
    </SignContainer>
  );
};

export default StaffResetPassword;
