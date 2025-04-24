import { Form, Modal, Switch } from "antd";
import { useEffect } from "react";

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
      title={"Chatbot Config"}
      onOk={submit}
    >
      <Form form={form}>
        <Form.Item label="Talk about salary" name="allow_salary">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChatbotConfigForm;
