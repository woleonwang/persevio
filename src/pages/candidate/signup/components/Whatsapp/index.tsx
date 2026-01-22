import { Button, Checkbox, Form } from "antd";
import { useEffect, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./style.module.less";
import PhoneWithCountryCode from "@/components/PhoneWithCountryCode";

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
}

const Whatsapp: React.FC<IProps> = (props: IProps) => {
  const { whatsappContactNumber, onFinish, onSkip, isSubmitting } = props;
  const [_, forceUpdate] = useReducer(() => ({}), {});
  const [isAgreed, setIsAgreed] = useState(true);
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

  const onSubmit = () => {
    form.validateFields().then(async (values) => {
      onFinish({
        whatsappCountryCode: values.whatsappContactNumber.countryCode,
        whatsappPhoneNumber: values.whatsappContactNumber.phoneNumber,
      });
    });
  };

  const canSubmit = () => {
    const { whatsappContactNumber } = form.getFieldsValue();
    return (
      !isSubmitting &&
      !!whatsappContactNumber?.countryCode &&
      !!whatsappContactNumber?.phoneNumber &&
      isAgreed
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>{t("title")}</div>
      <div
        className={styles.hint}
        dangerouslySetInnerHTML={{ __html: t("hint") }}
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
          I agree to be contacted on Whatsapp regarding my job application
        </Checkbox>
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
          disabled={!canSubmit()}
          onClick={() => {
            if (!canSubmit()) return;
            onSubmit();
          }}
        >
          {t("next")}
        </Button>
      </div>
      <div className={styles.webInterview}>
        <div onClick={() => onSkip()} className={styles.webInterviewLink}>
          I don't have Whatsapp
        </div>
      </div>
    </div>
  );
};

export default Whatsapp;
