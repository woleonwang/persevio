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
  reason: string;
  deleted?: boolean;
};

type TIdealProfileGroup = {
  name: string;
  requirements: TRequirement[];
};

interface IProps {
  onClose: () => void;
  onOk: (groups: TIdealProfileGroup[]) => void;
  candidateRequirementsJson: string;
}
const IdealProfileForm = (props: IProps) => {
  const { candidateRequirementsJson, onClose, onOk } = props;
  const [form] = Form.useForm();
  const [profileGroups, setProfileGroups] = useState<TIdealProfileGroup[]>([]);
  const { t: originalT } = useTranslation();

  const t = (key: string) => {
    return originalT(`ideal_profile.${key}`);
  };

  useEffect(() => {
    try {
      const groups: TIdealProfileGroup[] =
        parseJSON(candidateRequirementsJson).groups ?? [];

      groups.forEach((group) => {
        group.requirements.forEach((requirement) => {
          // ${uuid}_content, ${uuid}_type
          const uuid = uuidV4();
          form.setFieldsValue({
            [`${uuid}_content`]: requirement.content,
            [`${uuid}_type`]: "plus",
          });
          requirement.uuid = uuid;
        });
      });

      setProfileGroups(groups);
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <Form form={form}>
      {profileGroups.map((group) => {
        return (
          <div key={group.name} className={styles.group}>
            <h2>{group.name}</h2>
            {(group.requirements ?? []).map((requirement) => {
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
                      <Radio.Button value="minimum">
                        {t("minimum")}
                      </Radio.Button>
                      <Radio.Button value="big_plus">
                        {t("big_plus")}
                      </Radio.Button>
                      <Radio.Button value="plus">{t("plus")}</Radio.Button>
                    </Radio.Group>
                  </Form.Item>

                  <Button
                    style={{ marginTop: 12 }}
                    icon={
                      requirement.deleted ? (
                        <UndoOutlined />
                      ) : (
                        <DeleteOutlined />
                      )
                    }
                    onClick={() => {
                      if (requirement.content) {
                        group.requirements.forEach((s) => {
                          if (s.uuid === requirement.uuid) {
                            s.deleted = !s.deleted;
                          }
                        });
                      } else {
                        group.requirements = (group.requirements ?? []).filter(
                          (s) => s.uuid !== requirement.uuid
                        );
                      }
                      setProfileGroups([...profileGroups]);
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
                    reason: "",
                  };

                  group.requirements ??= [];
                  group.requirements.push(newRequirement);

                  form.setFieldsValue({
                    [`${uuid}_content`]: "",
                    [`${uuid}_type`]: false,
                  });
                  setProfileGroups([...profileGroups]);
                }}
              >
                {t("add")}
              </Button>
            </div>
          </div>
        );
      })}
      <div className={styles.footer}>
        <Button onClick={() => onClose()}>{originalT("cancel")}</Button>
        <Button
          type="primary"
          onClick={() => {
            form.validateFields().then((values) => {
              const result: TIdealProfileGroup[] = profileGroups.map(
                (group) => {
                  return {
                    ...group,
                    requirements: group.requirements
                      .filter((requirement) => !requirement.deleted)
                      .map((requirement) => {
                        return {
                          content: values[`${requirement.uuid}_content`],
                          type: values[`${requirement.uuid}_type`],
                          reason: requirement.reason,
                        };
                      }),
                  };
                }
              );
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
