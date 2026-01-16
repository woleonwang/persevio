import { ReactNode, useEffect, useReducer, useState } from "react";
import {
  Button,
  Collapse,
  DatePicker,
  Drawer,
  Form,
  FormListFieldData,
  Input,
  InputNumber,
  message,
  Popover,
  Radio,
  Select,
} from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { observer } from "mobx-react-lite";

import { Get, Post } from "@/utils/request";
import MarkdownContainer from "@/components/MarkdownContainer";

import BaseSalaryInput, { TSalaryValue } from "./components/BaseSalaryInput";
import CityAndAddressSelect, {
  TValue,
} from "./components/CityAndAddressSelect";
import TextAreaWithUploader from "./components/TextareaWithUploader";
import ManagerDetail, {
  TManangerDetailValue,
} from "./components/ManagerDetail";
import PercentageInput from "./components/PercentageInput";
import NumberRange from "./components/NumberRange";

import { TRoleOverviewType, TUserRole } from "../../type";
import styles from "./style.module.less";

type TQuestionGroup = {
  key: TRoleOverviewType;
  title: string;
  questions: (TQuestion | TGroup)[];
};

type TDependence = {
  questionKey: string;
  valueKey?: string | string[];
  exceptValueKey?: string | string[];
  exists?: boolean;
};

type TQuestion = {
  key: string;
  question: string;
  type:
    | "text"
    | "select"
    | "textarea"
    | "number"
    | "number_range"
    | "multiple_select"
    | "date"
    | "team"
    | "base_salary"
    | "city_and_address"
    | "manager_detail"
    | "percentage";
  hint?: string;
  dependencies?: TDependence[];
  options?: {
    value: string;
    label: React.ReactNode;
    text?: string;
  }[];
  required?: boolean;
  needPriority?: boolean;
  canNoApply?: boolean;
  outputNoData?: boolean;
  allowFile?: boolean;
};

type TGroup = {
  group: string;
  key: string;
  questions: TQuestion[];
  collapse?: boolean;
  dependencies?: TDependence[];
  needPriority?: boolean;
  canNoApply?: boolean;
  needIndent?: boolean;
  outputNoData?: boolean;
};

interface IProps {
  group?: TRoleOverviewType;
  userRole: TUserRole;
  onOk: (result: string) => void;
}

type TTeam = {
  id: number;
  name: string;
  detail: string;
};

const JobRequirementForm = (props: IProps) => {
  const { group: formType = "basic_info", userRole, onOk } = props;
  const [form] = Form.useForm();
  const [createTeamForm] = Form.useForm();
  const [_, forceUpdate] = useReducer(() => ({}), {});
  const [createTeamModelOpen, setCreateTeamModelOpen] = useState(false);
  const [teams, setTeams] = useState<TTeam[]>([]);

  const { t: originalT } = useTranslation();

  useEffect(() => {
    form.resetFields();
    forceUpdate();
  }, [formType, open]);

  const t = (key: string, params?: Record<string, string>): string => {
    return originalT(`job_requirement_form.${key}`, params);
  };

  const formatUrl = (url: string) => {
    if (userRole === "coworker") {
      return url.replace("/api", "/api/coworker");
    }

    if (userRole === "trial_user") {
      return url.replace("/api", "/api/trial_user");
    }
    return url;
  };

  const TeamQuestions: TQuestion[] = [
    {
      key: "name",
      question: t("team_name"),
      type: "text",
      required: true,
    },
    {
      key: "objectives",
      question: t("team_intro"),
      type: "textarea",
    },
    {
      key: "members_count",
      question: t("members_count"),
      type: "number",
    },
    {
      key: "team_language",
      question: t("team_language"),
      type: "text",
    },
    {
      key: "members_detail",
      question: t("menbers_detail"),
      type: "textarea",
    },
  ];

  const getOptions = (key: string, text: string) => {
    return {
      value: key,
      label: (
        <>
          <b>{text.split("**")[1]}</b>
          {text.split("**")[2]}
        </>
      ),
      text,
    };
  };

  const RoleOverviewFormQuestionsGroups: TQuestionGroup[] = [
    {
      key: "basic_info",
      title: t("basic_information"),
      questions: [
        {
          key: "headcount_number",
          type: "number",
          question: t("headcount_number_question"),
          required: true,
        },
        {
          key: "primary_driver",
          type: "select",
          question: t("primary_driver_question"),
          options: [
            "backfill",
            "team_growth",
            "new_initiative",
            "capability_gap",
            "specialized_expertise",
            "leadership",
          ].map((item) =>
            getOptions(item, t(`primary_driver_options.${item}`))
          ),
          required: true,
        },
        {
          key: "manager_detail",
          type: "manager_detail",
          question: t("manager_question"),
          required: true,
        },
        {
          key: "employee_type",
          type: "multiple_select",
          question: t("employee_type_question"),
          options: [
            "internship",
            "no_experience",
            "junior",
            "mid_level",
            "senior",
          ].map((item) => getOptions(item, t(`employee_level.${item}`))),
          required: true,
        },
        {
          key: "experience_years",
          type: "number_range",
          question: t("experience_years_question"),
          required: true,
        },
        {
          key: "archetypes",
          type: "select",
          question: t("archetypes_question"),
          options: [
            "individual_contributor",
            "people_manager",
            "ic_and_pm",
            "business_function_owner",
          ].map((item) => getOptions(item, t(`archetypes_options.${item}`))),
          required: true,
        },
        {
          key: "language",
          type: "text",
          question: t("language_question"),
          required: true,
        },
        {
          key: "remote",
          type: "select",
          question: t("remote_question"),
          options: [
            {
              value: "onsite",
              label: t("on_site"),
            },
            {
              value: "hybrid",
              label: t("hybrid"),
            },
            {
              value: "remote",
              label: t("remote"),
            },
          ],
          required: true,
        },
        {
          key: "city",
          type: "city_and_address",
          question: t("city_question"),
          dependencies: [
            {
              questionKey: "remote",
              valueKey: ["onsite", "hybrid"],
            },
          ],
          required: true,
        },
        {
          key: "visa_type_singapore",
          type: "textarea",
          question: t("visa_type"),
        },
      ],
    },

    {
      key: "reference",
      title: t("reference"),
      questions: [
        {
          key: "materials",
          question: t("materials"),
          type: "textarea",
          allowFile: true,
        },
      ],
    },

    {
      key: "salary_structure",
      title: t("salary_structure"),
      questions: [
        {
          key: "base_salary_group",
          group: t("base_salary"),
          outputNoData: true,
          questions: [
            {
              key: "base_salary",
              type: "base_salary",
              question: t("salary_number"),
            },
            {
              key: "base_salary_other",
              type: "text",
              question: t("bonus_note"),
            },
          ],
        },
        {
          key: "salary_by_result",
          type: "textarea",
          question: t("salary_by_result"),
          outputNoData: true,
        },
        {
          key: "bonus",
          group: t("bonus"),
          outputNoData: true,
          questions: [
            {
              key: "bonus_frequency",
              type: "select",
              question: t("bonus_frequency"),
              options: [
                {
                  value: "yearly",
                  label: t("yearly"),
                },
                {
                  value: "semi_annually",
                  label: t("semi_annually"),
                },
                {
                  value: "quarterly",
                  label: t("quarterly"),
                },
                {
                  value: "monthly",
                  label: t("monthly"),
                },
                {
                  value: "bonus_other",
                  label: t("bonus_other"),
                },
              ],
            },
            {
              key: "bonus_other",
              type: "textarea",
              question: t("bonus_other"),
              dependencies: [
                {
                  questionKey: "bonus_frequency",
                  valueKey: "bonus_other",
                },
              ],
            },
            {
              key: "bonus_number",
              type: "text",
              question: t("bonus_number"),
            },
            {
              key: "bonus_type",
              type: "textarea",
              question: t("bonus_type"),
            },
            {
              key: "bonus_note",
              type: "textarea",
              question: t("bonus_note"),
            },
          ],
        },
        {
          key: "commission",
          type: "textarea",
          question: t("commission"),
          outputNoData: true,
        },
        {
          key: "equity",
          type: "textarea",
          question: t("equity"),
          outputNoData: true,
        },
        {
          key: "allowances",
          type: "textarea",
          question: t("allowances"),
          outputNoData: true,
        },
        {
          key: "social_security_contributions",
          type: "textarea",
          question: t("social_security_contributions"),
          outputNoData: true,
        },
        {
          key: "benefits_perks",
          group: t("benefits_perks"),
          questions: [
            {
              key: "insurance",
              type: "textarea",
              question: t("insurance"),
              outputNoData: true,
            },
            {
              key: "paid_time_off",
              type: "textarea",
              question: t("paid_time_off"),
              outputNoData: true,
            },
            {
              key: "benefits_perks_other",
              type: "textarea",
              question: t("benefits_perks_other"),
              outputNoData: true,
            },
          ],
        },
        {
          key: "salary_other",
          type: "textarea",
          question: t("salary_other"),
        },
      ],
    },
  ];

  const questionGroup = RoleOverviewFormQuestionsGroups.find(
    (item) => item.key === formType
  ) as unknown as TQuestionGroup;

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async (options?: { selectedTeamId?: number }) => {
    const res = await Get<{ teams: TTeam[] }>(formatUrl(`/api/teams`));
    if (res.code === 0) {
      setTeams(res.data.teams);
      if (options?.selectedTeamId) {
        const team = res.data.teams.find(
          (item) => item.id === options.selectedTeamId
        );
        if (team) {
          form.setFieldsValue({
            team: team.id,
            ...JSON.parse(team.detail),
          });
        }
      }
    }
  };

  const onCloseCreateTeamModal = () => setCreateTeamModelOpen(false);

  const createTeam = async () => {
    createTeamForm.validateFields().then(async (questions) => {
      const { code, data } = await Post<{ team: TTeam }>(
        formatUrl(`/api/teams`),
        {
          name: questions.name,
          detail: JSON.stringify(questions),
        }
      );

      if (code === 0) {
        message.success(t("create_team_succeed"));
        fetchTeams({ selectedTeamId: data?.team?.id });

        onCloseCreateTeamModal();
      }
    });
  };

  const canSubmit = () => {
    const values = form.getFieldsValue();
    return Object.values(values).some((value) =>
      Array.isArray(value) ? value.length > 0 : !!value
    );
  };

  const onSubmit = () => {
    try {
      form.validateFields().then((values) => {
        let resultStr = "";
        const getAnswer = (
          question: TQuestion,
          value: any,
          options?: {
            isSubQuestion?: boolean;
          }
        ): string => {
          const { isSubQuestion = false } = options ?? {};
          const outputNoData = question.outputNoData ?? false;

          const noDataText = `${
            isSubQuestion ? "####" : "###"
          } ${question.question
            .replaceAll("</b>", "")
            .replaceAll("<b>", "")}\n\n${t("no_data")}`;

          if (!value) {
            return outputNoData ? noDataText : "";
          }

          let formattedValue = value;
          if (question.type === "base_salary") {
            const typedValue = value as TSalaryValue;
            if (
              !(
                typedValue.salaryMin &&
                typedValue.salaryMax &&
                typedValue.months
              )
            ) {
              return "";
            }

            formattedValue = `(${typedValue.salaryMin} / ${t("month")} ~ ${
              typedValue.salaryMax
            } / ${t("month")}) * ${typedValue.months} ${t("month")} = ${
              typedValue.salaryMin * typedValue.months
            } ~ ${typedValue.salaryMax * typedValue.months} / ${t("year")}`;
          }

          if (question.type === "city_and_address") {
            formattedValue = "";
            const typedValue = value as TValue[];
            typedValue.forEach((item) => {
              if (!item.cityName && !item.addressId) return;

              if (item.cityName) {
                formattedValue += `${item.cityName} `;
              }
              if (item.addressName) {
                formattedValue += `${item.addressName}. `;
              }

              formattedValue += "\n\n";
            });
          }

          if (question.type === "manager_detail") {
            const typedValue = value as TManangerDetailValue;
            formattedValue = [typedValue.jobTitle, typedValue.name]
              .filter(Boolean)
              .join(", ");
          }

          if (question.type === "percentage") {
            const typedValue = value as Record<string, number>;
            formattedValue = Object.keys(typedValue)
              .filter((key) => !!typedValue[key])
              .map((key) => `${key} - ${typedValue[key]}%`)
              .join("\n\n");
          }

          // if (question.type === "internal_employee_level") {
          //   const typedValue = value as TInternalEmployeeLevelValue;
          //   formattedValue = `${typedValue.name}`;
          // }

          if (question.type === "select") {
            const option = (question.options ?? []).find(
              (item) => item.value === value
            );
            formattedValue = option?.text ?? option?.label ?? "";
          }

          if (question.type === "multiple_select") {
            formattedValue = value
              .map(
                (optionValue: string) =>
                  question.options?.find((item) => item.value === optionValue)
                    ?.label ?? ""
              )
              .join(",");
          }

          if (question.type === "number_range") {
            formattedValue = `${value.min} - ${value.max} ${originalT("year")}`;
          }

          if (question.type === "date") {
            formattedValue = dayjs(value).format("YYYY-MM-DD");
          }

          if (formattedValue === "") {
            return outputNoData ? noDataText : "";
          }

          return `${isSubQuestion ? "####" : "###"} ${question.question
            .replaceAll("</b>", "")
            .replaceAll("<b>", "")}${
            question.needPriority
              ? ` - ${originalT(
                  "ideal_profile." + values[`${question.key}_priority`]
                )}`
              : ""
          }\n\n${formattedValue}`;
        };

        const questions: string[] = [];
        (questionGroup?.questions ?? []).forEach((question) => {
          if (question.key === "team") return;

          if (!!(question as TGroup).group) {
            const group = question as TGroup;

            // 单个对象
            const answers = group.questions
              .map((question) =>
                getAnswer(question, values[question.key], {
                  isSubQuestion: true,
                })
              )
              .filter(Boolean);

            if (answers.length > 0) {
              questions.push(`### ${group.group}`);

              answers.forEach((answer, index) => {
                if (index === 0) {
                  questions.push(answer);
                } else {
                  questions.push(group.needIndent ? `- ${answer}` : answer);
                }
              });

              if (group.needPriority) {
                questions.push(
                  `- ${originalT(
                    "ideal_profile." + values[`${group.key}_priority`]
                  )}`
                );
              }
            } else if (group.outputNoData) {
              questions.push(`### ${group.group}\n\n${t("no_data")}`);
            }
          } else {
            const answer = getAnswer(
              question as TQuestion,
              values[question.key]
            );

            if (answer) {
              questions.push(`${answer}`);
            }
          }
        });

        if (questions.length > 0) {
          resultStr += `## ${questionGroup.title}\n\n${questions.join(
            "\n\n"
          )}\n\n`;
        }

        onOk(resultStr);
      });
    } catch (e) {
      console.log("e:", e);
    }
  };

  const checkVisible = (
    dependencies?: TDependence[],
    field?: FormListFieldData
  ) => {
    return (dependencies ?? []).every((dep) => {
      let currentValue = "";
      if (field && dep.questionKey.includes(".")) {
        const [parent, currentField] = dep.questionKey.split(".");
        currentValue =
          form.getFieldsValue()[parent][field.name]?.[currentField];
      } else {
        currentValue = form.getFieldsValue()[dep.questionKey];
      }

      if (!currentValue) return false;

      if (dep.exists) return !!currentValue;

      if (Array.isArray(dep.valueKey))
        return Array.isArray(currentValue)
          ? dep.valueKey.some((value) => currentValue.includes(value))
          : dep.valueKey.includes(currentValue);

      if (Array.isArray(dep.exceptValueKey))
        return Array.isArray(currentValue)
          ? dep.exceptValueKey.every((value) => !currentValue.includes(value))
          : !dep.exceptValueKey.includes(currentValue);

      if (!!dep.valueKey)
        return Array.isArray(currentValue)
          ? currentValue.includes(dep.valueKey)
          : dep.valueKey === currentValue;

      if (!!dep.exceptValueKey)
        return Array.isArray(currentValue)
          ? !currentValue.includes(dep.exceptValueKey)
          : dep.exceptValueKey !== currentValue;

      return true;
    });
  };

  const genFormItem = (
    question: TQuestion,
    field?: FormListFieldData,
    options?: { isSubQuestion?: boolean; deleted?: boolean }
  ): ReactNode => {
    const visible = checkVisible(question.dependencies, field);

    if (!visible) return null;

    const { isSubQuestion = false, deleted = false } = options ?? {};

    return (
      <Form.Item
        label={
          <div
            className={
              formType === "salary_structure" && !isSubQuestion
                ? styles.groupTitle
                : ""
            }
          >
            <span dangerouslySetInnerHTML={{ __html: question.question }} />
            {question.hint && (
              <Popover
                content={<MarkdownContainer content={question.hint} />}
                placement="right"
                style={{ width: 600 }}
              >
                <QuestionCircleOutlined
                  style={{ marginLeft: 5, cursor: "pointer" }}
                />
              </Popover>
            )}
            {question.needPriority && (
              <span className={styles.inlineFormItem}>
                {genPriority(question.key, question.key, {
                  canNoApply: question.canNoApply ?? false,
                })}
              </span>
            )}
          </div>
        }
        key={
          field?.key !== undefined
            ? `${field.key}-${question.key}`
            : question.key
        }
        name={
          field?.name !== undefined ? [field.name, question.key] : question.key
        }
        className={styles.formItem}
        required={question.required}
        rules={
          question.type === "percentage"
            ? [
                {
                  validator(
                    _: any,
                    value: Record<string, number>,
                    callback: any
                  ) {
                    const sum = Object.values(value).reduce(
                      (sum, val) => sum + val,
                      0
                    );
                    if (sum !== 100) {
                      callback(new Error());
                    }
                    callback();
                  },
                  message: t("percentage_message"),
                },
              ]
            : question.type === "manager_detail"
            ? [
                {
                  validator(
                    _: any,
                    value: Record<string, number>,
                    callback: any
                  ) {
                    const typedValue = value as TManangerDetailValue;
                    if (!typedValue.jobTitle) {
                      callback(new Error());
                    }
                    callback();
                  },
                  message: t("manager_message"),
                },
              ]
            : question.type === "city_and_address"
            ? [
                {
                  validator(_: any, value, callback: any) {
                    const typedValue = value as TValue[];
                    if (typedValue.find((item) => item.cityId)) {
                      callback();
                    } else {
                      callback(new Error());
                    }
                  },
                  message: t("city_and_address_message"),
                },
              ]
            : question.type === "number_range"
            ? [
                {
                  validator(
                    _: any,
                    value: Record<string, number>,
                    callback: any
                  ) {
                    const typedValue = value as { min?: number; max?: number };
                    if (
                      (!typedValue.min && typedValue.min !== 0) ||
                      (!typedValue.max && typedValue.max !== 0)
                    ) {
                      callback(new Error());
                    }
                    callback();
                  },
                  message: t("required_error_message"),
                },
              ]
            : question.required
            ? [
                {
                  required: true,
                  message: t("required_error_message"),
                },
              ]
            : []
        }
      >
        {question.type === "text" && <Input disabled={deleted} />}
        {question.type === "textarea" && (
          <TextAreaWithUploader
            rows={3}
            autoSize={{ minRows: 3, maxRows: 8 }}
            disabled={deleted}
            allowFile={question.allowFile}
          />
        )}
        {question.type === "number" && (
          <InputNumber style={{ width: "100%" }} disabled={deleted} min={0} />
        )}
        {question.type === "select" && (
          <Select options={question.options} disabled={deleted} />
        )}
        {question.type === "multiple_select" && (
          <Select
            options={question.options}
            mode="multiple"
            disabled={deleted}
          />
        )}
        {question.type === "number_range" && (
          <NumberRange suffix={originalT("year")} />
        )}
        {question.type === "date" && <DatePicker disabled={deleted} />}
        {question.type === "base_salary" && <BaseSalaryInput />}
        {question.type === "city_and_address" && <CityAndAddressSelect />}
        {/* {question.type === "internal_employee_level" && (
            <InternalEmployeeLevel />
          )} */}
        {question.type === "manager_detail" && <ManagerDetail onlyJobTitle />}
        {question.type === "percentage" && (
          <PercentageInput options={question.options ?? []} />
        )}
        {question.type === "team" && (
          <Select
            options={teams.map((team) => ({
              value: team.id,
              label: team.name,
            }))}
            dropdownRender={(node) => {
              return (
                <div>
                  {node}
                  <div
                    style={{
                      padding: "12px 10px",
                      marginTop: 12,
                      borderTop: "1px solid #e8e8e8",
                    }}
                  >
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => {
                        setCreateTeamModelOpen(true);
                      }}
                    >
                      {t("create_team")}
                    </Button>
                  </div>
                </div>
              );
            }}
            onChange={(value) => {
              const selectedTeam = teams.find((team) => team.id === value);

              if (selectedTeam) {
                const detailObj = JSON.parse(selectedTeam.detail);
                const newValues: Record<string, string | number> = {};
                TeamQuestions.forEach((question) => {
                  newValues[question.key] = detailObj[question.key];
                });
                form.setFieldsValue(newValues);
              }
            }}
          />
        )}
      </Form.Item>
    );
  };

  const genPriority = (
    name: string | number,
    key: string | number,
    options?: { canNoApply: boolean; deleted?: boolean }
  ) => {
    const { canNoApply = false, deleted = false } = options ?? {};

    return (
      <Form.Item
        key={`${key}-priority`}
        name={Number.isInteger(name) ? [name, "priority"] : `${name}_priority`}
        style={{ flex: "none" }}
        initialValue={"plus"}
      >
        <Radio.Group buttonStyle="solid" disabled={deleted}>
          <Radio.Button value="minimum">
            {originalT("ideal_profile.minimum")}
          </Radio.Button>
          <Radio.Button value="big_plus">
            {originalT("ideal_profile.big_plus")}
          </Radio.Button>
          <Radio.Button value="plus">
            {originalT("ideal_profile.plus")}
          </Radio.Button>
          {canNoApply && (
            <Radio.Button value="no_apply">
              {originalT("ideal_profile.no_apply")}
            </Radio.Button>
          )}
        </Radio.Group>
      </Form.Item>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>{questionGroup.title}</div>
      {["reference", "team_context"].includes(formType) && (
        <div
          style={{ color: "#999" }}
          dangerouslySetInnerHTML={{ __html: t("tips") }}
        />
      )}
      <div style={{ marginBottom: 20 }}></div>
      {questionGroup && (
        <>
          <Form
            form={form}
            layout="vertical"
            onFieldsChange={() => forceUpdate()}
          >
            {questionGroup.questions.map((item) => {
              if (!!(item as TGroup).group) {
                const itemGroup = item as TGroup;
                const isVisible = checkVisible(item.dependencies);
                if (!isVisible) return null;

                return itemGroup.collapse ? (
                  <Collapse
                    items={[
                      {
                        key: itemGroup.key,
                        label: (
                          <div style={{ fontWeight: "bold" }}>
                            {itemGroup.group}
                          </div>
                        ),
                        children: itemGroup.questions.map((question) =>
                          genFormItem(question)
                        ),
                        forceRender: true,
                      },
                    ]}
                    style={{ marginBottom: 20 }}
                    key={itemGroup.key}
                    defaultActiveKey={itemGroup.key}
                  />
                ) : (
                  <div key={itemGroup.key} style={{ marginBottom: 24 }}>
                    <div className={styles.groupTitle}>{itemGroup.group}</div>
                    <div className={styles.group}>
                      {itemGroup.needPriority &&
                        genPriority(itemGroup.key, itemGroup.key, {
                          canNoApply: itemGroup.canNoApply ?? false,
                        })}
                      {itemGroup.questions.map((question) =>
                        genFormItem(question, undefined, {
                          isSubQuestion: true,
                        })
                      )}
                    </div>
                  </div>
                );
              } else {
                return genFormItem(item as TQuestion);
              }
            })}
          </Form>
          <div className={styles.footer}>
            {formType === "reference" && (
              <Button
                key="nothing"
                type="primary"
                disabled={canSubmit()}
                onClick={() => {
                  onOk(t("no_materials"));
                }}
              >
                {t("no_materials")}
              </Button>
            )}
            <Button
              key="submit"
              type="primary"
              disabled={!canSubmit()}
              onClick={() => onSubmit()}
            >
              {originalT("submit")}
            </Button>
          </div>
        </>
      )}
      <Drawer
        open={createTeamModelOpen}
        onClose={() => onCloseCreateTeamModal()}
        closable={true}
        title={t("create_team")}
        width={800}
        footer={
          <div className={styles.drawerFooter}>
            <Button key="back" onClick={() => onCloseCreateTeamModal()}>
              {originalT("cancel")}
            </Button>

            <Button key="submit" type="primary" onClick={() => createTeam()}>
              {originalT("submit")}
            </Button>
          </div>
        }
      >
        <div style={{ flex: "auto", overflow: "auto" }}>
          <Form form={createTeamForm} layout="vertical">
            {TeamQuestions.map((item) => genFormItem(item))}
          </Form>
        </div>
      </Drawer>
    </div>
  );
};

export default observer(JobRequirementForm);
