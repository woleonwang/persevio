import { Switch, Form, Input, Button } from "antd";
import { useEffect, useState } from "react";
import { v4 as uuidV4 } from "uuid";
import { DeleteOutlined } from "@ant-design/icons";

import styles from "./style.module.less";

type TSkill = {
  uuid?: string;
  content: string;
  type: "required" | "optional";
  reason: string;
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
    const groups: TIdealProfileGroup[] = JSON.parse(
      candidateRequirementsJson
    ).groups;

    groups.forEach((group) => {
      group.skills.forEach((skill) => {
        // ${uuid}_content, ${uuid}_type
        const uuid = uuidV4();
        form.setFieldsValue({
          [`${uuid}_content`]: skill.content,
          [`${uuid}_required`]: skill.type === "required",
        });
        skill.uuid = uuid;
      });
    });

    setProfileGroups(groups);
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
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name={`${skill.uuid}_required`}
                    style={{ flex: "none" }}
                  >
                    <Switch
                      checkedChildren="Required"
                      unCheckedChildren="Optional"
                    />
                  </Form.Item>

                  <Button
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      group.skills = (group.skills ?? []).filter(
                        (s) => s.uuid !== skill.uuid
                      );
                      setProfileGroups([...profileGroups]);
                    }}
                  />
                </div>
              );
            })}
            <div>
              <Button
                type="primary"
                onClick={() => {
                  const uuid = uuidV4();
                  const newSkill: TSkill = {
                    uuid,
                    content: "",
                    type: "optional",
                    reason: "",
                  };

                  group.skills ??= [];
                  group.skills.push(newSkill);

                  form.setFieldsValue({
                    [`${uuid}_content`]: "",
                    [`${uuid}_required`]: false,
                  });
                  setProfileGroups([...profileGroups]);
                }}
              >
                Add Skill
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
                    skills: group.skills.map((skill) => {
                      return {
                        content: values[`${skill.uuid}_content`],
                        type: values[`${skill.uuid}_required`]
                          ? "required"
                          : "optional",
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
