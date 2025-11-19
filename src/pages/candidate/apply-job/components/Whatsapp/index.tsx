import { Button, Form, Input } from "antd";
import { useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";
import styles from "./style.module.less";

interface IProps {
  whatsappContactNumber: string;
  onFinish: ({
    whatsappContactNumber,
  }: {
    whatsappContactNumber: string;
  }) => void;
  onBack: () => void;
}

const Whatsapp: React.FC<IProps> = (props: IProps) => {
  const { whatsappContactNumber, onFinish, onBack } = props;
  const [_, forceUpdate] = useReducer(() => ({}), {});
  const [form] = Form.useForm<{ whatsappContactNumber: string }>();
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`apply_job.${key}`);

  useEffect(() => {
    form.setFieldsValue({ whatsappContactNumber });
  }, [whatsappContactNumber]);

  const onSubmit = () => {
    form.validateFields().then(async (values) => {
      onFinish({ whatsappContactNumber: values.whatsappContactNumber });
    });
  };

  const canSubmit = () => {
    const { whatsappContactNumber } = form.getFieldsValue();
    return !!whatsappContactNumber;
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>{t("title")}</div>
      <div className={styles.hint}>{t("hint")}</div>
      <ul className={styles.list}>
        <li className={styles.listItem}>{t("list_confidentiality")}</li>
        <li className={styles.listItem}>{t("list_add_contact")}</li>
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
              required: true,
              message: t("required_message"),
            },
            {
              pattern: /^[0-9]+$/,
              message: t("pattern_message"),
            },
          ]}
        >
          <Input placeholder={t("placeholder")} size="large" />
        </Form.Item>
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
    </div>
  );
};

export default Whatsapp;
