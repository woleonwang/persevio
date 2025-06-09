import { Form, Input, Button, Radio } from "antd";
import { useEffect, useState } from "react";
import { v4 as uuidV4 } from "uuid";
import { DeleteOutlined, PlusOutlined, UndoOutlined } from "@ant-design/icons";

import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { parseJSON } from "../../../../utils";

type TRequirement = {
  uuid?: string;
  content: string;
  type?: "minimum" | "big_plus" | "plus";
  deleted?: boolean;
};

interface IProps {
  onClose: () => void;
  onOk: (requirements: TRequirement[]) => void;
  candidateRequirementsJson: string;
}
const IdealProfileForm = (props: IProps) => {
  const { candidateRequirementsJson, onClose, onOk } = props;
  const [form] = Form.useForm();
  const [requirements, setRequirements] = useState<TRequirement[]>([]);
  const { t: originalT } = useTranslation();

  const t = (key: string) => {
    return originalT(`ideal_profile.${key}`);
  };

  useEffect(() => {
    try {
      const requirements: TRequirement[] =
        parseJSON(candidateRequirementsJson).requirements ?? [];

      requirements.forEach((requirement) => {
        // ${uuid}_content, ${uuid}_type
        const uuid = uuidV4();
        form.setFieldsValue({
          [`${uuid}_content`]: requirement.content,
          [`${uuid}_type`]: "plus",
        });
        requirement.uuid = uuid;
      });

      setRequirements(requirements);
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <Form form={form}>
      {(requirements ?? []).map((requirement) => {
        return (
          <div key={requirement.uuid} className={styles.skillRow}>
            <Form.Item
              name={`${requirement.uuid}_content`}
              style={{ flex: "auto" }}
              required
            >
              <Input.TextArea rows={2} disabled={requirement.deleted} />
            </Form.Item>

            <Form.Item
              name={`${requirement.uuid}_type`}
              style={{ flex: "none" }}
            >
              <Radio.Group
                disabled={requirement.deleted}
                buttonStyle="solid"
                size="small"
              >
                <Radio.Button value="minimum">{t("minimum")}</Radio.Button>
                <Radio.Button value="big_plus">{t("big_plus")}</Radio.Button>
                <Radio.Button value="plus">{t("plus")}</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Button
              style={{ marginTop: 12 }}
              icon={requirement.deleted ? <UndoOutlined /> : <DeleteOutlined />}
              onClick={() => {
                let newRequirements = [...requirements];
                if (requirement.content) {
                  newRequirements.forEach((s) => {
                    if (s.uuid === requirement.uuid) {
                      s.deleted = !s.deleted;
                    }
                  });
                } else {
                  newRequirements = newRequirements.filter(
                    (s) => s.uuid !== requirement.uuid
                  );
                }
                setRequirements(newRequirements);
              }}
            />
          </div>
        );
      })}
      <div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            const uuid = uuidV4();
            const newRequirement: TRequirement = {
              uuid,
              content: "",
              type: "plus",
            };

            form.setFieldsValue({
              [`${uuid}_content`]: "",
              [`${uuid}_type`]: false,
            });
            setRequirements([...requirements, newRequirement]);
          }}
        >
          {t("add")}
        </Button>
      </div>

      <div className={styles.footer}>
        <Button onClick={() => onClose()}>{originalT("cancel")}</Button>
        <Button
          type="primary"
          onClick={() => {
            form.validateFields().then((values) => {
              const result: TRequirement[] = requirements
                .filter((requirement) => !requirement.deleted)
                .map((requirement) => {
                  return {
                    content: values[`${requirement.uuid}_content`],
                    type: values[`${requirement.uuid}_type`],
                  };
                });

              onOk(result);
            });
          }}
        >
          {originalT("submit")}
        </Button>
      </div>
    </Form>
  );
};

export default IdealProfileForm;
