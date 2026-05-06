import { Button, Checkbox, Form, Modal, message } from "antd";
import { useEffect, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./style.module.less";
import PhoneWithCountryCode from "@/components/PhoneWithCountryCode";
import MarkdownContainer from "@/components/MarkdownContainer";
import privacyAgreement from "@/utils/privacyAgreement";
import terms from "@/utils/terms";

interface IProps {
  whatsappContactNumber: {
    whatsappCountryCode: string;
    whatsappPhoneNumber: string;
  };
  onFinish: (whatsappContactNumber: {
    whatsappCountryCode: string;
    whatsappPhoneNumber: string;
  }) => void;
  onSkip: () => void;
  isSubmitting: boolean;
  isWithJob: boolean;
  requirePlatformTerms?: boolean;
}

const Whatsapp: React.FC<IProps> = (props: IProps) => {
  const {
    whatsappContactNumber,
    onFinish,
    onSkip,
    isSubmitting,
    isWithJob,
    requirePlatformTerms = false,
  } = props;
  const [, forceUpdate] = useReducer(() => ({}), {});
  const [isAgreed, setIsAgreed] = useState(true);
  const [isPlatformTermsAgreed, setIsPlatformTermsAgreed] = useState(false);
  const [termsType, setTermsType] = useState<"terms" | "privacy">();
  const [form] = Form.useForm<{
    whatsappContactNumber: {
      countryCode: string;
      phoneNumber: string;
    };
  }>();
  const { t: originalT } = useTranslation();

  const t = (key: string) => originalT(`apply_job.${key}`);

  useEffect(() => {
    form.setFieldsValue({
      whatsappContactNumber: {
        countryCode: whatsappContactNumber.whatsappCountryCode,
        phoneNumber: whatsappContactNumber.whatsappPhoneNumber,
      },
    });
    forceUpdate();
  }, [whatsappContactNumber]);

  const policiesAccepted = !requirePlatformTerms || isPlatformTermsAgreed;

  const warnAgreement = () => {
    message.warning(t("agreement_required_toast"));
  };

  const hasMinimumForSubmit = () => {
    const { whatsappContactNumber: wa } = form.getFieldsValue();
    return !isSubmitting && !!wa?.countryCode && !!wa?.phoneNumber && isAgreed;
  };

  const handlePrimaryClick = () => {
    if (!hasMinimumForSubmit()) {
      return;
    }
    if (!policiesAccepted) {
      warnAgreement();
      return;
    }
    form.validateFields().then((values) => {
      onFinish({
        whatsappCountryCode: values.whatsappContactNumber.countryCode,
        whatsappPhoneNumber: values.whatsappContactNumber.phoneNumber,
      });
    });
  };

  const handleSkip = () => {
    if (!policiesAccepted) {
      warnAgreement();
      return;
    }
    onSkip();
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        {t(isWithJob ? "title" : "title_without_job")}
      </div>
      <div
        className={styles.hint}
        dangerouslySetInnerHTML={{
          __html: t(isWithJob ? "hint" : "hint_without_job"),
        }}
      />
      <ul className={styles.list}>
        <li
          className={styles.listItem}
          dangerouslySetInnerHTML={{ __html: t("list_confidentiality") }}
        />
        <li
          className={styles.listItem}
          dangerouslySetInnerHTML={{ __html: t("list_add_contact") }}
        />
      </ul>

      <Form
        form={form}
        layout="vertical"
        onFieldsChange={() => forceUpdate()}
        className={styles.form}
      >
        <Form.Item
          label={t("whatsapp_label")}
          name="whatsappContactNumber"
          rules={[
            {
              validator: (_, value, callback) => {
                if (!value?.countryCode || !value?.phoneNumber) {
                  callback(t("required_message"));
                  return;
                }
                const reg = /^[0-9]+$/;
                if (!(value.phoneNumber as string).match(reg)) {
                  callback(t("pattern_message"));
                  return;
                }
                callback();
              },
            },
          ]}
        >
          <PhoneWithCountryCode />
        </Form.Item>
        <Checkbox
          checked={isAgreed}
          onChange={(e) => setIsAgreed(e.target.checked)}
        >
          {t("agree_whatsapp_contact")}
        </Checkbox>
        {requirePlatformTerms && (
          <Checkbox
            className={styles.platformTermsCheckbox}
            checked={isPlatformTermsAgreed}
            onChange={(e) => setIsPlatformTermsAgreed(e.target.checked)}
          >
            {t("agree_platform_terms_lead")}
            <span
              className={styles.termsLink}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTermsType("terms");
              }}
            >
              {t("terms_of_service")}
            </span>
            {t("agree_platform_terms_conj")}
            <span
              className={styles.termsLink}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTermsType("privacy");
              }}
            >
              {t("privacy_policy")}
            </span>
          </Checkbox>
        )}
      </Form>
      <div
        style={{
          marginTop: 52,
          textAlign: "center",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Button
          size="large"
          style={{ flex: 1, height: 44, borderRadius: 12 }}
          type="primary"
          disabled={!hasMinimumForSubmit()}
          onClick={() => handlePrimaryClick()}
        >
          {t("next")}
        </Button>
      </div>
      <div className={styles.webInterview}>
        <div onClick={() => handleSkip()} className={styles.webInterviewLink}>
          {t("skip_no_whatsapp")}
        </div>
      </div>

      <Modal
        open={!!termsType}
        onCancel={() => setTermsType(undefined)}
        onOk={() => setTermsType(undefined)}
        title={
          termsType === "terms"
            ? t("modal_terms_of_service")
            : t("modal_privacy_policy")
        }
        centered
        width={"80%"}
        style={{ maxWidth: 1000, maxHeight: "90vh" }}
        cancelButtonProps={{
          style: {
            display: "none",
          },
        }}
      >
        <div style={{ maxHeight: "70vh", overflow: "auto" }}>
          <MarkdownContainer
            content={(termsType === "terms"
              ? terms
              : privacyAgreement
            ).replaceAll("\n", "\n\n")}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Whatsapp;
