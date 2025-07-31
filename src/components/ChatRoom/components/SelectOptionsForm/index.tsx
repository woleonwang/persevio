import { Form, Input, Button, Radio, Alert, Checkbox } from "antd";
import { useEffect, useReducer, useState } from "react";
import { v4 as uuidV4 } from "uuid";
import { PlusOutlined } from "@ant-design/icons";

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

  const t = (key: string) => {
    return originalT(`select_options.${key}`);
  };

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
    // 1. 选中的选项必须有值；
    // 2. 至少选中一个
    const checkGroup = (group: TSubGroup): boolean => {
      return group.options.every((option) => {
        return (
          (type === "icp" || type === "high_level_responsibility"
            ? !values[`${option.uuid}_type`]
            : !values[`${option.uuid}_checked`]) ||
          !!values[`${option.uuid}_content`]
        );
      });
    };

    const noEmptyOption = groups.every((group) => {
      if (!!group.options) {
        return checkGroup(group as TSubGroup);
      } else {
        return group.subGroups?.every((subGroup) => checkGroup(subGroup));
      }
    });

    const existsSelected = (group: TSubGroup): boolean => {
      return !!group.options.find((option) => {
        return type === "icp" || type === "high_level_responsibility"
          ? values[`${option.uuid}_type`]
          : values[`${option.uuid}_checked`];
      });
    };

    const selectAtLeastOne = groups.find((group) => {
      if (!!group.options) {
        return existsSelected(group as TSubGroup);
      } else {
        return group.subGroups?.every((subGroup) => existsSelected(subGroup));
      }
    });

    return noEmptyOption && selectAtLeastOne;
  };

  const renderOptions = (group: TSubGroup) => {
    const genRadioGroup = (option: TOption, radioOptions: string[]) => {
      return (
        <Radio.Group>
          {radioOptions.map((label) => (
            <Radio
              key={label}
              value={label}
              onClick={(e) => {
                // @ts-ignore
                if (e.target.checked) {
                  form.setFieldsValue({
                    [`${option.uuid}_type`]: "",
                  });
                  forceUpdate();
                }
              }}
            >
              {label}
            </Radio>
          ))}
        </Radio.Group>
      );
    };
    return (
      <div>
        <div>
          {group.options.map((option) => {
            return (
              <div key={option.uuid} className={styles.skillRow}>
                {type === "high_level_responsibility" ? (
                  <Form.Item name={`${option.uuid}_type`}>
                    {genRadioGroup(option, [
                      t("core_responsibility"),
                      t("secondary_responsibility"),
                    ])}
                  </Form.Item>
                ) : type === "day_to_day_tasks" ? (
                  <Form.Item
                    name={`${option.uuid}_checked`}
                    valuePropName="checked"
                  >
                    <Checkbox style={{ marginRight: 12 }} />
                  </Form.Item>
                ) : (
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Form.Item name={`${option.uuid}_type`}>
                      {genRadioGroup(option, [
                        t("core_requirements"),
                        t("plus_points"),
                      ])}
                    </Form.Item>
                  </div>
                )}

                <Form.Item
                  name={`${option.uuid}_content`}
                  style={{ flex: "auto" }}
                >
                  <Input.TextArea autoSize={{ minRows: 1, maxRows: 4 }} />
                </Form.Item>
              </div>
            );
          })}
        </div>
        <div>
          <Button
            color="primary"
            variant="outlined"
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
        style={{ padding: "20px 150px" }}
        // style={{ flex: 1, overflow: "auto" }}
      >
        {type !== "icp" && (
          <Alert
            message={
              type === "high_level_responsibility"
                ? t("high_level_responsibility_alert")
                : t("day_to_day_alert")
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
                    color: "#1FAC6A",
                    paddingLeft: 6,
                    borderLeft: "3px solid #1FAC6A",
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
                    return values[`${option.uuid}_type`]
                      ? `- ${values[`${option.uuid}_content`]} - **${
                          values[`${option.uuid}_type`]
                        }**`
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
                            ? `- ${values[`${option.uuid}_content`]}`
                            : "";
                        })
                        .filter(Boolean)
                        .join("\n\n")}`
                  )
                  .join("\n\n");
                onOk(result);
              } else {
                const hasValue = (option: TOption) => {
                  return values[`${option.uuid}_type`];
                };

                const genResult = (option: TOption): string => {
                  return hasValue(option)
                    ? `- ${values[`${option.uuid}_content`]} - **${
                        values[`${option.uuid}_type`]
                      }**`
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
