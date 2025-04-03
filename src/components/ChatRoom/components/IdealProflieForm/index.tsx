import { Form, Input, Button, Radio } from "antd";
import { useEffect, useState } from "react";
import { v4 as uuidV4 } from "uuid";
import { DeleteOutlined, PlusOutlined, UndoOutlined } from "@ant-design/icons";

import styles from "./style.module.less";

type TSkill = {
  uuid?: string;
  content: string;
  type: "minimum" | "big_plus" | "plus";
  reason: string;
  deleted?: boolean;
};

type TIdealProfileGroup = {
  name: string;
  skills: TSkill[];
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

  useEffect(() => {
    try {
      const startIndex = candidateRequirementsJson.indexOf("{");
      const lastIndex = candidateRequirementsJson.lastIndexOf("}");
      const groups: TIdealProfileGroup[] = JSON.parse(
        candidateRequirementsJson.slice(startIndex, lastIndex + 1)
      ).groups;

      groups.forEach((group) => {
        group.skills.forEach((skill) => {
          // ${uuid}_content, ${uuid}_type
          const uuid = uuidV4();
          form.setFieldsValue({
            [`${uuid}_content`]: skill.content,
            [`${uuid}_type`]: "plus",
          });
          skill.uuid = uuid;
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
            {(group.skills ?? []).map((skill) => {
              return (
                <div key={skill.uuid} className={styles.skillRow}>
                  <Form.Item
                    name={`${skill.uuid}_content`}
                    style={{ flex: "auto" }}
                    required
                  >
                    <Input disabled={skill.deleted} />
                  </Form.Item>

                  <Form.Item
                    name={`${skill.uuid}_type`}
                    style={{ flex: "none" }}
                  >
                    <Radio.Group disabled={skill.deleted} buttonStyle="solid">
                      <Radio.Button value="minimum">Minimum</Radio.Button>
                      <Radio.Button value="big_plus">Big Plus</Radio.Button>
                      <Radio.Button value="plus">Plus</Radio.Button>
                    </Radio.Group>
                  </Form.Item>

                  <Button
                    icon={skill.deleted ? <UndoOutlined /> : <DeleteOutlined />}
                    onClick={() => {
                      if (skill.content) {
                        group.skills.forEach((s) => {
                          if (s.uuid === skill.uuid) {
                            s.deleted = !s.deleted;
                          }
                        });
                      } else {
                        group.skills = (group.skills ?? []).filter(
                          (s) => s.uuid !== skill.uuid
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
                  const newSkill: TSkill = {
                    uuid,
                    content: "",
                    type: "plus",
                    reason: "",
                  };

                  group.skills ??= [];
                  group.skills.push(newSkill);

                  form.setFieldsValue({
                    [`${uuid}_content`]: "",
                    [`${uuid}_type`]: false,
                  });
                  setProfileGroups([...profileGroups]);
                }}
              >
                Add New
              </Button>
            </div>
          </div>
        );
      })}
      <div className={styles.footer}>
        <Button onClick={() => onClose()}>Cancel</Button>
        <Button
          type="primary"
          onClick={() => {
            form.validateFields().then((values) => {
              const result: TIdealProfileGroup[] = profileGroups.map(
                (group) => {
                  return {
                    ...group,
                    skills: group.skills
                      .filter((skill) => !skill.deleted)
                      .map((skill) => {
                        return {
                          content: values[`${skill.uuid}_content`],
                          type: values[`${skill.uuid}_type`],
                          reason: skill.reason,
                        };
                      }),
                  };
                }
              );
              onOk(result);
            });
          }}
        >
          Send
        </Button>
      </div>
    </Form>
  );
};

export default IdealProfileForm;
