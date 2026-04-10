import React, { useEffect, useRef, useState } from "react";
import { Form, Input, Button, message } from "antd";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { Post } from "@/utils/request";
import SignContainer from "@/components/SignContainer";

import styles from "./style.module.less";

const FORGOT_PASSWORD_COOLDOWN_SEC = 60;

const StaffForgotPassword: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);
  const cooldownTimerRef = useRef<number | null>(null);
  const { t } = useTranslation();

  const isCooldown = cooldownSec > 0;

  const clearCooldownTimer = () => {
    if (cooldownTimerRef.current != null) {
      window.clearInterval(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
  };

  const startCooldown = () => {
    clearCooldownTimer();
    setCooldownSec(FORGOT_PASSWORD_COOLDOWN_SEC);
    cooldownTimerRef.current = window.setInterval(() => {
      setCooldownSec((prev) => {
        if (prev <= 1) {
          clearCooldownTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearCooldownTimer(), []);

  const handleSubmit = async (values: { email: string }) => {
    if (loading || isCooldown) {
      return;
    }
    setLoading(true);
    try {
      const email = String(values.email ?? "").trim();
      const { code } = await Post("/api/staff/forgot_password", {
        email,
      });
      if (code === 0) {
        message.success(t("staffPasswordReset.forgotSubmitOk"));
        startCooldown();
      } else if (code === 10001) {
        message.error(t("staffPasswordReset.invalidParams"));
      } else if (code === 10002) {
        message.error(t("staffPasswordReset.tooFrequent"));
      } else if (code === 10003) {
        message.error(t("staffPasswordReset.tryLater"));
      } else {
        message.error(t("staffPasswordReset.requestFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignContainer title={t("staffPasswordReset.forgotTitle")}>
      <Form
        form={form}
        layout="vertical"
        className={styles.formRoot}
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Form.Item
          label={t("signin.email")}
          name="email"
          rules={[
            { required: true, message: t("signin.please_enter_email") },
            { type: "email", message: t("staffPasswordReset.invalidEmail") },
          ]}
        >
          <Input
            placeholder={t("signin.email_placeholder")}
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
            disabled={isCooldown}
          >
            {isCooldown
              ? t("staffPasswordReset.resendAfter", {
                  seconds: cooldownSec,
                })
              : t("staffPasswordReset.submitForgot")}
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

export default StaffForgotPassword;
