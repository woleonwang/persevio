import { Form, Input, Modal } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import type { ICreditConfig } from "../types";
import { isNameTaken } from "../utils";

type DuplicateModalProps = {
  open: boolean;
  source: ICreditConfig | null;
  configs: ICreditConfig[];
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (name: string) => void;
};

const DuplicateModal = ({
  open,
  source,
  configs,
  loading,
  onCancel,
  onSubmit,
}: DuplicateModalProps) => {
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`admin_credit_configs.${key}`);
  const [form] = Form.useForm<{ name: string }>();

  useEffect(() => {
    if (open && source) {
      form.setFieldsValue({ name: `${source.name} (Copy)` });
    } else {
      form.resetFields();
    }
  }, [open, source, form]);

  return (
    <Modal
      open={open}
      title={t("duplicateTitle")}
      okText={t("actions.create")}
      cancelText={t("actions.cancel")}
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={async () => {
        const values = await form.validateFields();
        onSubmit(values.name.trim());
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label={t("fields.name")}
          rules={[
            { required: true, message: t("validation.nameRequired") },
            {
              validator: async (_, value) => {
                if (!value?.trim()) {
                  return;
                }
                if (isNameTaken(value, configs)) {
                  throw new Error(t("validation.nameExists"));
                }
              },
            },
          ]}
        >
          <Input autoFocus placeholder={t("duplicatePlaceholder")} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DuplicateModal;
