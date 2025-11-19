import { Button, Form, Input } from "antd";
import { useEffect, useReducer } from "react";
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
      <div className={styles.title}>
        Let's Chat and Prepare Your Application
      </div>
      <div className={styles.hint}>
        在我们提交您的申请之前，我们的顾问【账号名-Viona-Ai
        Recruiter】将通过Whatsapp与您进行一次简短的交谈，以便更深入地了解您的经历、技能和职业偏好，并确保我们能以最有利的方式向雇主介绍您
      </div>
      <ul className={styles.list}>
        <li className={styles.listItem}>
          本次沟通旨在为您提供更好的服务，不会涉及敏感隐私信息，以及绝不会泄露给第三方或用于营销目的。
        </li>
        <li className={styles.listItem}>
          为了在WhatsApp上为您提供专属服务，您可以将招聘顾问添加您的WhatsApps。
        </li>
      </ul>

      <Form
        form={form}
        layout="vertical"
        onFieldsChange={() => forceUpdate()}
        className={styles.form}
      >
        <Form.Item
          label="您的 Whatsapp 账号"
          name="whatsappContactNumber"
          rules={[
            {
              required: true,
              message: "请输入您的 Whatsapp 账号",
            },
            {
              pattern: /^[0-9]+$/,
              message: "请输入有效的Whatsapp账号（仅数字）",
            },
          ]}
        >
          <Input placeholder="Please fill in" size="large" />
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
          Previous Step
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
          Next
        </Button>
      </div>
    </div>
  );
};

export default Whatsapp;
