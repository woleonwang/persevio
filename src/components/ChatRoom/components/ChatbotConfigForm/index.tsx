import { Form, Modal, Switch } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface IProps {
  job: IJob;
  open: boolean;
  onClose: () => void;
  onOk: (options: TChatbotOptions) => void;
}

export type TChatbotOptions = {
  allow_salary: boolean;
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
    >
      <Form form={form}>
        <Form.Item label={t("allow_salary")} name="allow_salary">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChatbotConfigForm;
