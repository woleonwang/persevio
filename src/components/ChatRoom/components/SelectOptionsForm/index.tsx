import { Form, Input, Button, Radio, Alert, Checkbox } from "antd";
import { useEffect, useReducer, useState } from "react";
import { v4 as uuidV4 } from "uuid";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";

import styles from "./style.module.less";
import { parseJSON } from "../../../../utils";
import { useTranslation } from "react-i18next";

interface IProps {
  type: "high_level_responsibility" | "day_to_day_tasks" | "icp";
  job: IJob;
  onClose: () => void;
  onOk: (result: string) => void;
}

type TSubGroup = {
  title: string;
  options: TOption[];
};

type TGroup = {
  title: string;
  options?: TOption[];
  subGroups?: TSubGroup[];
};

type TOption = {
  uuid: string;
};
const SelectOptionsForm = (props: IProps) => {
  const { type, job, onOk } = props;
  const [form] = Form.useForm();
  const [groups, setGroups] = useState<TGroup[]>([]);
  const [_, forceUpdate] = useReducer(() => ({}), {});

  const { t: originalT } = useTranslation();

  useEffect(() => {
    try {
      let groups: TGroup[] = [];
      if (type === "high_level_responsibility") {
        const options: string[] =
          parseJSON(job.high_level_responsibility_json).responsibilities ?? [];

        const groupOptions: TOption[] = [];

        options.forEach((option) => {
          const uuid = uuidV4();
          form.setFieldsValue({
            [`${uuid}_content`]: option,
          });
          groupOptions.push({
            uuid,
          });
        });
        groups.push({
          title: "",
          options: groupOptions,
        });
      } else if (type === "day_to_day_tasks") {
        const taskGroups: { title: string; tasks: string[] }[] =
          parseJSON(job.day_to_day_tasks_json).hlrs ?? [];

        taskGroups.forEach((taskGroup) => {
          const groupOptions: TOption[] = [];
          taskGroup.tasks.forEach((task) => {
            const uuid = uuidV4();
            form.setFieldsValue({
              [`${uuid}_content`]: task,
            });
            groupOptions.push({
              uuid,
            });
          });
          groups.push({
            title: taskGroup.title,
            options: groupOptions,
          });
        });
      } else if (type === "icp") {
        const icpGroups: (
          | { title: string; skills: string[] }
          | { title: string; groups: { title: string; skills: string[] }[] }
        )[] = parseJSON(job.icp_json).icps ?? [];

        icpGroups.forEach((icpGroup) => {
          if (hasSkills(icpGroup)) {
            const groupOptions: TOption[] = [];
            icpGroup.skills.forEach((skill) => {
              const uuid = uuidV4();
              form.setFieldsValue({
                [`${uuid}_content`]: skill,
              });
              groupOptions.push({
                uuid,
              });
            });
            groups.push({
              title: icpGroup.title,
              options: groupOptions,
            });
          } else {
            const subGroups: TSubGroup[] = [];
            icpGroup.groups.forEach((subGroup) => {
              const groupOptions: TOption[] = [];
              subGroup.skills.forEach((task) => {
                const uuid = uuidV4();
                form.setFieldsValue({
                  [`${uuid}_content`]: task,
                });
                groupOptions.push({
                  uuid,
                });
              });
              subGroups.push({
                title: subGroup.title,
                options: groupOptions,
              });
            });

            groups.push({
              title: icpGroup.title,
              subGroups: subGroups,
            });
          }
        });
      }

      setGroups(groups);
    } catch (e) {
      console.error(e);
    }
  }, []);

  function hasSkills(obj: any): obj is { skills: string[] } {
    return obj && Array.isArray(obj.skills) && obj.skills.length > 0;
  }

  const canSubmit = () => {
    const values = form.getFieldsValue();
    const checkGroup = (group: TSubGroup): boolean => {
      return group.options.every((option) => {
        return (
          (type === "icp"
            ? !values[`${option.uuid}_resume_type`] &&
              !values[`${option.uuid}_interview_type`]
            : !values[`${option.uuid}_checked`]) ||
          !!values[`${option.uuid}_content`]
        );
      });
    };

    return groups.every((group) => {
      if (!!group.options) {
        return checkGroup(group as TSubGroup);
      } else {
        return group.subGroups?.every((subGroup) => checkGroup(subGroup));
      }
    });
  };

  const renderOptions = (group: TSubGroup) => {
    return (
      <div>
        <div>
          {group.options.map((option) => {
            return (
              <div key={option.uuid} className={styles.skillRow}>
                <Form.Item
                  name={`${option.uuid}_content`}
                  style={{ flex: "auto" }}
                >
                  <Input.TextArea rows={2} />
                </Form.Item>

                {type !== "icp" ? (
                  <Form.Item
                    name={`${option.uuid}_checked`}
                    style={{ width: 40 }}
                    valuePropName="checked"
                  >
                    <Checkbox style={{ marginTop: 12, marginLeft: 12 }} />
                  </Form.Item>
                ) : (
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Form.Item name={`${option.uuid}_resume_type`}>
                      <Radio.Group options={["简历基本要求", "简历加分项"]} />
                    </Form.Item>

                    <Form.Item
                      name={`${option.uuid}_interview_type`}
                      style={{
                        borderLeft: "1px solid #eee",
                        marginLeft: 12,
                        paddingLeft: 12,
                      }}
                    >
                      <Radio.Group options={["面试重点考察项", "面试考察项"]} />
                    </Form.Item>
                    <ReloadOutlined
                      style={{
                        marginBottom: 24,
                        marginLeft: 12,
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        form.setFieldsValue({
                          [`${option.uuid}_resume_type`]: "",
                          [`${option.uuid}_interview_type`]: "",
                        });
                        forceUpdate();
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              const uuid = uuidV4();
              const newOption: TOption = {
                uuid,
              };

              group.options.push(newOption);
              setGroups([...groups]);
            }}
            style={{ width: "100%" }}
            size="large"
          >
            {originalT("add")}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Form
        form={form}
        onFieldsChange={() => forceUpdate()}
        // style={{ flex: 1, overflow: "auto" }}
      >
        {type !== "icp" && (
          <Alert
            message={
              type === "high_level_responsibility"
                ? "请选择或者调整职责内容，以满足您的预期"
                : "请选择或者调整当前职责中最重要、最具代表性的任务，以满足您的预期。"
            }
            type="success"
            style={{ marginBottom: 20 }}
          />
        )}
        {(groups ?? []).map((group) => {
          return (
            <div>
              {!!group.title && (
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    marginBottom: 10,
                    marginTop: 30,
                  }}
                >
                  {group.title}
                </div>
              )}
              {group.options ? (
                <div>{renderOptions(group as TSubGroup)}</div>
              ) : (
                <div>
                  {(group.subGroups ?? []).map((subGroup) => {
                    return (
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: "bold",
                            marginBottom: 10,
                            marginTop: 10,
                          }}
                        >
                          {subGroup.title}
                        </div>
                        {renderOptions(subGroup)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </Form>
      <div className={styles.footer}>
        <Button
          type="primary"
          onClick={() => {
            form.validateFields().then((values) => {
              if (type === "high_level_responsibility") {
                const result = (groups[0]?.options ?? [])
                  .map((option) => {
                    return values[`${option.uuid}_checked`]
                      ? `- **${values[`${option.uuid}_content`]}**`
                      : "";
                  })
                  .filter(Boolean)
                  .join("\n\n");
                onOk(result);
              } else if (type === "day_to_day_tasks") {
                const result = groups
                  .filter(
                    (group) =>
                      !!(group.options ?? []).find(
                        (option) => values[`${option.uuid}_checked`]
                      )
                  )
                  .map(
                    (group) =>
                      `### ${group.title}\n\n ${(group.options ?? [])
                        .map((option) => {
                          return values[`${option.uuid}_checked`]
                            ? `- **${values[`${option.uuid}_content`]}**`
                            : "";
                        })
                        .filter(Boolean)
                        .join("\n\n")}`
                  )
                  .join("\n\n");
                onOk(result);
              } else {
                const hasValue = (option: TOption) => {
                  return (
                    values[`${option.uuid}_resume_type`] ||
                    values[`${option.uuid}_interview_type`]
                  );
                };

                const genResult = (option: TOption): string => {
                  return hasValue(option)
                    ? `- **${values[`${option.uuid}_content`]} - ${[
                        values[`${option.uuid}_resume_type`],
                        values[`${option.uuid}_interview_type`],
                      ]
                        .filter(Boolean)
                        .join("、")}**`
                    : "";
                };

                const result = groups
                  .filter((group) => {
                    if (!!group.options) {
                      return !!(group.options ?? []).find((option) =>
                        hasValue(option)
                      );
                    } else {
                      return !!(group.subGroups ?? []).find((subGroup) =>
                        subGroup.options.find((option) => hasValue(option))
                      );
                    }
                  })
                  .map((group) => {
                    return `### ${group.title}\n\n ${
                      group.options
                        ? (group.options ?? [])
                            .map((option) => {
                              return genResult(option);
                            })
                            .filter(Boolean)
                            .join("\n\n")
                        : (group.subGroups ?? [])
                            .filter((subGroup) =>
                              subGroup.options.find((option) =>
                                hasValue(option)
                              )
                            )
                            .map(
                              (subGroup) =>
                                `#### ${subGroup.title}\n\n ${(
                                  subGroup.options ?? []
                                )
                                  .map((option) => {
                                    return genResult(option);
                                  })
                                  .filter(Boolean)
                                  .join("\n\n")}`
                            )
                            .join("\n\n")
                    }`;
                  })
                  .join("\n\n");
                onOk(result);
              }
            });
          }}
          disabled={!canSubmit()}
        >
          {originalT("submit")}
        </Button>
      </div>
    </>
  );
};

export default SelectOptionsForm;
