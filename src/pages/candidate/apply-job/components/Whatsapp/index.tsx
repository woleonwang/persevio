import { Button, Checkbox, Form } from "antd";
import { useEffect, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./style.module.less";
import { getQuery } from "@/utils";
import WhatsappContactNumber from "@/components/WhatsappContactNumber";

interface IProps {
  whatsappContactNumber: {
    whatsappCountryCode: string;
    whatsappPhoneNumber: string;
  };
  onFinish: (whatsappContactNumber: {
    whatsappCountryCode: string;
    whatsappPhoneNumber: string;
  }) => void;
  onBack: () => void;
  onChooseInterviewMode: (interviewMode: "ai" | "human") => void;
}

const Whatsapp: React.FC<IProps> = (props: IProps) => {
  const { whatsappContactNumber, onFinish, onBack, onChooseInterviewMode } =
    props;
  const [_, forceUpdate] = useReducer(() => ({}), {});
  const [isAgreed, setIsAgreed] = useState(true);
  const [form] = Form.useForm<{
    whatsappContactNumber: {
      whatsappCountryCode: string;
      whatsappPhoneNumber: string;
    };
  }>();
  const { t: originalT } = useTranslation();
  const isDebug = getQuery("debug") === "1";

  const t = (key: string) => originalT(`apply_job.${key}`);

  useEffect(() => {
    form.setFieldsValue({
      whatsappContactNumber,
    });
  }, [whatsappContactNumber]);

  const onSubmit = () => {
    form.validateFields().then(async (values) => {
      onFinish(values.whatsappContactNumber);
    });
  };

  const canSubmit = () => {
    const { whatsappContactNumber } = form.getFieldsValue();
    return (
      !!whatsappContactNumber?.whatsappCountryCode &&
      !!whatsappContactNumber?.whatsappPhoneNumber &&
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
                if (
                  !value?.whatsappCountryCode ||
                  !value?.whatsappPhoneNumber
                ) {
                  callback(t("required_message"));
                  return;
                }
                const reg = /^[0-9]+$/;
                if (!(value.whatsappPhoneNumber as string).match(reg)) {
                  callback(t("pattern_message"));
                  return;
                }
                callback();
              },
            },
          ]}
        >
          <WhatsappContactNumber />
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
          type="default"
          onClick={() => {
            onBack();
          }}
        >
          {t("previous_step")}
        </Button>
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
      {isDebug && (
        <div>
          <div onClick={() => onChooseInterviewMode("human")}>人工面试</div>
          <div onClick={() => onChooseInterviewMode("ai")}>Web 面试</div>
        </div>
      )}
    </div>
  );
};

export default Whatsapp;
