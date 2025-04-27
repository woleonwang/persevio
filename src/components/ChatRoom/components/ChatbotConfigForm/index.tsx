import { Form, Input, Modal, Select, Switch } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface IProps {
  job: IJob;
  open: boolean;
  onClose: () => void;
  onOk: (options: TChatbotOptions) => void;
}

export type TChatbotOptions = {
  allow_salary:
    | "not_permitted"
    | "structure_only"
    | "structore_and_range"
    | "specific_details";
  others: string;
};
const ChatbotConfigForm = (props: IProps) => {
  const { open, onClose, onOk, job } = props;
  const [form] = Form.useForm();

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`chatbot_config.${key}`);

  useEffect(() => {
    form.setFieldsValue({
      allow_salary: job.chatbot_options?.allow_salary ?? false,
    });
  }, []);

  const submit = () => {
    form.validateFields().then((values) => {
      onOk(values);
    });
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={t("modal_title")}
      onOk={submit}
      okText={originalT("submit")}
      cancelText={originalT("cancel")}
    >
      <Form form={form} layout="vertical" style={{ margin: "20px 0" }}>
        <Form.Item label={t("allow_salary")} name="allow_salary">
          <Select
            options={[
              "not_permitted",
              "structure_only",
              "structore_and_range",
              "specific_details",
            ].map((key) => ({
              label: t(key),
              value: key,
              title: t(`${key}_hint`),
            }))}
          />
        </Form.Item>
        <Form.Item label={t("others")} name="others">
          <Input.TextArea rows={2} autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChatbotConfigForm;
