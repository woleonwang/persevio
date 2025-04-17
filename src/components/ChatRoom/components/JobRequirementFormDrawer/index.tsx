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
import { DeleteOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { ReactNode, useEffect, useReducer, useState } from "react";
import { TRoleOverviewType } from "../../type";
import { Get, Post } from "../../../../utils/request";
import MarkdownContainer from "../../../MarkdownContainer";
import dayjs from "dayjs";

import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import BaseSalaryInput from "./components/BaseSalaryInput";

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
    | "multiple_select"
    | "date"
    | "team"
    | "base_salary";
  hint?: string;
  dependencies?: TDependence[];
  options?: {
    value: string;
    label: string;
  }[];
  required?: boolean;
  needPriority?: boolean;
  canNoApply?: boolean;
};

type TGroup = {
  group: string;
  key: string;
  questions: TQuestion[];
  collapse?: boolean;
  dependencies?: TDependence[];
  isArray?: boolean;
  needPriority?: boolean;
  canNoApply?: boolean;
  needIndent?: boolean;
};

interface IProps {
  open: boolean;
  group?: TRoleOverviewType;
  isCoworker: boolean;
  onClose: () => void;
  onOk: (result: string) => void;
}

type TTeam = {
  id: number;
  name: string;
  detail: string;
};

const JobRequirementFormDrawer = (props: IProps) => {
  const { open, group = "basic_info", isCoworker, onClose, onOk } = props;
  const [form] = Form.useForm();
  const [createTeamForm] = Form.useForm();
  const [_, forceUpdate] = useReducer(() => ({}), {});
  const [createTeamModelOpen, setCreateTeamModelOpen] = useState(false);
  const [teams, setTeams] = useState<TTeam[]>([]);

  const { t: originalT } = useTranslation();

  useEffect(() => {
    form.resetFields();
    if (open) {
      if (group === "other_requirement") {
        form.setFieldsValue({
          visa_requirements: [{}],
          language_group: [{}],
          other_group: [{}],
        });
      }
    }
  }, [group, open]);

  const t = (key: string, params?: Record<string, string>): string => {
    return originalT(`job_requirement_form.${key}`, params);
  };

  const formatUrl = (url: string) => {
    return isCoworker ? url.replace("/api", "/api/coworker") : url;
  };

  const formatOptions = (options: string[]) => {
    return options.map((item) => {
      return {
        value: item,
        label: t(item),
      };
    });
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
      required: true,
    },
    {
      key: "members_count",
      question: t("members_count"),
      type: "number",
      required: true,
    },
    {
      key: "members_detail",
      question: t("menbers_detail"),
      type: "textarea",
    },
    {
      key: "lead",
      question: t("team_lead"),
      type: "text",
    },
    {
      key: "lead_detail",
      question: t("team_lead_detail"),
      type: "textarea",
    },
    {
      key: "team_language",
      question: t("team_language"),
      type: "text",
    },
  ];

  const RoleOverviewFormQuestionsGroups: TQuestionGroup[] = [
    {
      key: "basic_info",
      title: t("basic_information"),
      questions: [
        {
          key: "time",
          type: "select",
          question: t("time"),
          options: [
            {
              value: "full-time",
              label: t("full_time"),
            },
            {
              value: "part-time",
              label: t("part_time"),
            },
          ],
          required: true,
        },
        {
          key: "role",
          type: "select",
          question: t("role"),
          options: [
            {
              value: "perm",
              label: t("perm"),
            },
            {
              value: "contract",
              label: t("contract"),
            },
          ],
          required: true,
        },
        {
          key: "contract_duration",
          type: "number",
          question: t("duration"),
          dependencies: [
            {
              questionKey: "role",
              valueKey: "contract",
            },
          ],
          required: true,
        },
        {
          key: "remote",
          type: "select",
          question: t("remote_type"),
          options: [
            {
              value: "onsite",
              label: t("on_site"),
            },
            {
              value: "remote",
              label: t("remote"),
            },
            {
              value: "hybrid",
              label: t("hybrid"),
            },
          ],
          required: true,
        },
        {
          key: "city",
          type: "text",
          question: t("city"),
          dependencies: [
            {
              questionKey: "remote",
              valueKey: ["onsite", "hybrid"],
            },
          ],
          required: true,
        },
        {
          key: "address",
          type: "textarea",
          question: t("address"),
          dependencies: [
            {
              questionKey: "remote",
              valueKey: ["onsite", "hybrid"],
            },
          ],
          required: true,
        },
        {
          key: "seniority",
          type: "select",
          question: t("seniority"),
          hint: t("seniority_hint"),
          options: [
            {
              value: "intership",
              label: t("intership"),
            },
            {
              value: "junior",
              label: t("junior"),
            },
            {
              value: "senior",
              label: t("senior"),
            },
            {
              value: "manager",
              label: t("manager"),
            },
            {
              value: "director",
              label: t("director"),
            },
            {
              value: "executive",
              label: t("executive"),
            },
          ],
          required: true,
        },
        {
          key: "internal_employee",
          type: "textarea",
          question: t("internal_employee"),
          required: true,
        },
        {
          key: "headcount",
          type: "number",
          question: t("head_count"),
          required: true,
        },
        {
          key: "when_start",
          type: "select",
          question: t("when_start"),
          options: [
            {
              value: "soon",
              label: t("soon"),
            },
            {
              value: "one_month",
              label: t("one_month"),
            },
            {
              value: "two_month",
              label: t("two_month"),
            },
            {
              value: "three_month",
              label: t("three_month"),
            },
            {
              value: "not_hurry",
              label: t("not_hurry"),
            },
          ],
          required: true,
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
        },
        {
          key: "usage",
          type: "textarea",
          question: t("usage"),
          dependencies: [
            {
              questionKey: "materials",
              exists: true,
            },
          ],
          required: true,
        },
      ],
    },

    {
      key: "team_context",
      title: t("team_context"),
      questions: [
        {
          key: "team",
          type: "team",
          question: t("team"),
        },
        {
          group: t("team_details"),
          key: "team_details",
          dependencies: [{ questionKey: "team", exists: true }],
          collapse: true,
          questions: TeamQuestions.map((item) => ({
            ...item,
            dependencies: [{ questionKey: "team", exists: true }],
          })),
        },
        {
          key: "report_to",
          type: "textarea",
          question: t("report_to"),
        },
        {
          key: "manager_detail",
          type: "textarea",
          question: t("manager_detail"),
        },
        {
          key: "collaborators",
          type: "textarea",
          question: t("collaborators"),
        },
        {
          key: "team_others",
          type: "textarea",
          question: t("team_others"),
        },
      ],
    },

    {
      key: "other_requirement",
      title: t("other_requirements"),
      questions: [
        {
          group: t("visa"),
          key: "visa_requirements",
          questions: [
            {
              key: "visa_country",
              type: "select",
              question: t("country"),
              options: [
                {
                  value: "china",
                  label: t("china"),
                },
                {
                  value: "singapore",
                  label: t("singapore"),
                },
              ],
              required: true,
            },
            {
              key: "visa_type_singapore",
              type: "multiple_select",
              question: t("visa_type"),
              options: formatOptions([
                "singapore_citizen",
                "singapore_pr",
                "ep",
                "sp",
                "wp",
                "dp",
                "other_singapore_visa",
              ]),
              dependencies: [
                {
                  questionKey: "visa_requirements.visa_country",
                  valueKey: "singapore",
                },
              ],
            },
            {
              key: "visa_type_singapore_other",
              type: "text",
              question: t("visa_type_singapore_other"),
              dependencies: [
                {
                  questionKey: "visa_requirements.visa_type_singapore",
                  valueKey: "other_singapore_visa",
                },
              ],
            },
            {
              key: "visa_type_others",
              type: "multiple_select",
              question: t("visa_type"),
              options: formatOptions([
                "chinese_citizen",
                "china_pr",
                "no_need_visa",
                "need_visa",
                "other_visa",
              ]),
              dependencies: [
                {
                  questionKey: "visa_requirements.visa_country",
                  exceptValueKey: "singapore",
                },
              ],
            },
            {
              key: "visa_type_others_other",
              type: "text",
              question: t("other_visa"),
              dependencies: [
                {
                  questionKey: "visa_requirements.visa_type_others",
                  valueKey: "other_visa",
                },
              ],
            },
          ],
          isArray: true,
          needPriority: true,
          needIndent: true,
        },

        {
          group: t("language_group"),
          key: "language_group",
          questions: [
            {
              key: "language",
              type: "select",
              question: t("language"),
              options: formatOptions(["chinese", "english"]),
              required: true,
            },
            {
              key: "proficiency",
              type: "select",
              question: t("proficiency"),
              options: formatOptions([
                "native_speaker",
                "professional",
                "daily_conversation",
                "proficiency_other",
              ]),
            },
            {
              key: "proficiency_other",
              type: "text",
              question: t("proficiency_other_name"),
              dependencies: [
                {
                  questionKey: "language_group.proficiency",
                  valueKey: "proficiency_other",
                },
              ],
            },
          ],
          isArray: true,
          needPriority: true,
          needIndent: true,
        },

        {
          group: t("travel_group"),
          key: "travel_group",
          questions: [
            {
              key: "travel_type",
              type: "select",
              question: t("need_travel"),
              options: formatOptions([
                "no_travel",
                "hoc_travel",
                "some_travel",
                "regular_travel",
              ]),
            },
            {
              key: "destinations",
              type: "text",
              question: t("destination"),
              dependencies: [
                {
                  questionKey: "travel_type",
                  exceptValueKey: "no_travel",
                },
              ],
            },
            {
              key: "nature_of_travel",
              type: "text",
              question: t("nature"),
              dependencies: [
                {
                  questionKey: "travel_type",
                  exceptValueKey: "no_travel",
                },
              ],
            },
            {
              key: "regularity",
              type: "text",
              question: t("regularity"),
              dependencies: [
                {
                  questionKey: "travel_type",
                  exceptValueKey: "no_travel",
                },
              ],
            },
          ],
          needPriority: true,
          canNoApply: true,
          needIndent: true,
        },

        {
          key: "onboarding_date",
          type: "date",
          question: t("onboarding"),
          needPriority: true,
        },
        {
          key: "certifications",
          type: "text",
          question: t("certification"),
          needPriority: true,
        },
        {
          group: t("other_requirements"),
          key: "other_group",
          questions: [
            {
              key: "other_requirement",
              type: "text",
              question: t("requirement"),
            },
          ],
          isArray: true,
          needPriority: true,
          canNoApply: true,
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
          key: "bonus",
          group: t("bonus"),
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
              type: "select",
              question: t("bonus_type"),
              options: [
                {
                  value: "guaranteed",
                  label: t("guaranteed"),
                },
                {
                  value: "personal",
                  label: t("personal"),
                },
                {
                  value: "personal_and_company",
                  label: t("personal_and_company"),
                },
              ],
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
        },
        {
          key: "equity",
          type: "textarea",
          question: t("equity"),
        },
        {
          key: "allowances",
          type: "textarea",
          question: t("allowances"),
        },
        {
          key: "social_security_contributions",
          type: "textarea",
          question: t("social_security_contributions"),
        },
        {
          key: "benefits_perks",
          group: t("benefits_perks"),
          questions: [
            {
              key: "insurance",
              type: "textarea",
              question: t("insurance"),
            },
            {
              key: "paid_time_off",
              type: "textarea",
              question: t("paid_time_off"),
            },
            {
              key: "benefits_perks_other",
              type: "textarea",
              question: t("benefits_perks_other"),
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
    (item) => item.key === group
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
          options?: { isSingleLine?: boolean; isSubQuestion?: boolean }
        ): string => {
          if (!value) return "";

          const { isSingleLine = false, isSubQuestion = false } = options ?? {};

          let formattedValue = value;
          if (question.type === "base_salary") {
            if (!(value.salary && value.months)) {
              return "";
            }
            formattedValue = `${value.salary}/${t("month")} * ${
              value.months
            } ${t("month")} = ${value.salary * value.months}`;
          }

          if (question.type === "select") {
            formattedValue =
              (question.options ?? []).find((item) => item.value === value)
                ?.label ?? "";
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

          if (question.type === "date") {
            formattedValue = dayjs(value).format("YYYY-MM-DD");
          }

          return isSingleLine
            ? `${question.question
                .replaceAll("</b>", "")
                .replaceAll("<b>", "")}: ${formattedValue}`
            : `${isSubQuestion ? "####" : "###"} ${question.question
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

            if (group.isArray) {
              // 允许添加多条记录
              const arrayValues = values[group.key] ?? [];

              if (arrayValues.length) {
                questions.push(`### ${group.group}`);
              }

              arrayValues.forEach((groupValue: Record<string, any>) => {
                const groupAnswers = group.questions
                  .map((question) =>
                    getAnswer(question, groupValue[question.key], {
                      isSingleLine: true,
                    })
                  )
                  .filter(Boolean);

                groupAnswers.forEach((answer, index) => {
                  if (index === 0) {
                    questions.push(`#### ${answer}`);
                  } else {
                    questions.push(`- ${answer}`);
                  }
                });

                if (group.needPriority) {
                  questions.push(
                    `- ${originalT("ideal_profile." + groupValue["priority"])}`
                  );
                }
              });
            } else {
              // 单个对象
              const answers = group.questions
                .map((question) =>
                  getAnswer(question, values[question.key], {
                    isSubQuestion: true,
                  })
                )
                .filter(Boolean);

              if (answers.length) {
                questions.push(`### ${group.group}`);
              }

              answers.forEach((answer, index) => {
                if (index === 0) {
                  questions.push(answer);
                } else {
                  questions.push(group.needIndent ? `- ${answer}` : answer);
                }
              });

              if (answers.length && group.needPriority) {
                questions.push(
                  `- ${originalT(
                    "ideal_profile." + values[`${group.key}_priority`]
                  )}`
                );
              }
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
    options?: { isSubQuestion?: boolean }
  ): ReactNode => {
    const visible = checkVisible(question.dependencies, field);

    if (!visible) return null;

    const { isSubQuestion = false } = options ?? {};
    return (
      <>
        <Form.Item
          label={
            <div
              className={
                (group === "salary_structure" ||
                  group === "other_requirement") &&
                !isSubQuestion
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
              <span className={styles.inlineFormItem}>
                {question.needPriority &&
                  genPriority(question.key, question.key, {
                    canNoApply: question.canNoApply ?? false,
                  })}
              </span>
            </div>
          }
          key={
            field?.key !== undefined
              ? `${field.key}-${question.key}`
              : question.key
          }
          name={
            field?.name !== undefined
              ? [field.name, question.key]
              : question.key
          }
          className={styles.formItem}
          rules={[
            {
              required: question.required,
              message: t("required_error_message"),
            },
          ]}
        >
          {question.type === "text" && <Input />}
          {question.type === "textarea" && (
            <Input.TextArea rows={2} autoSize={{ minRows: 2, maxRows: 8 }} />
          )}
          {question.type === "number" && <InputNumber />}
          {question.type === "select" && <Select options={question.options} />}
          {question.type === "multiple_select" && (
            <Select options={question.options} mode="multiple" />
          )}
          {question.type === "date" && <DatePicker />}
          {question.type === "base_salary" && <BaseSalaryInput />}
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

                if (selectedTeam)
                  form.setFieldsValue(JSON.parse(selectedTeam.detail));
              }}
            />
          )}
        </Form.Item>
      </>
    );
  };

  const genPriority = (
    name: string | number,
    key: string | number,
    options?: { canNoApply: boolean }
  ) => {
    const canNoApply = options?.canNoApply ?? false;

    return (
      <Form.Item
        key={`${key}-priority`}
        name={Number.isInteger(name) ? [name, "priority"] : `${name}_priority`}
        style={{ flex: "none" }}
        initialValue={"plus"}
      >
        <Radio.Group buttonStyle="solid">
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
    <Drawer
      open={open}
      onClose={onClose}
      title={questionGroup.title}
      width={"50vw"}
      destroyOnClose
      mask={false}
      footer={
        <div className={styles.drawerFooter}>
          <Button key="back" onClick={onClose}>
            {originalT("cancel")}
          </Button>
          {group === "reference" && (
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
      }
    >
      {open && (
        <div style={{ flex: "auto", overflow: "auto" }}>
          {["reference", "team_context"].includes(group) && (
            <div style={{ color: "#999" }}>{t("tips")}</div>
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
                      <div key={itemGroup.key}>
                        {itemGroup.isArray ? (
                          <Form.List name={itemGroup.key}>
                            {(fields, { add, remove }) => {
                              return (
                                <div style={{ marginBottom: 24 }}>
                                  <div className={styles.groupTitle}>
                                    {itemGroup.group}
                                  </div>
                                  {fields.map((field) => (
                                    <div
                                      key={field.key}
                                      className={styles.group}
                                    >
                                      {itemGroup.needPriority &&
                                        genPriority(field.name, field.key, {
                                          canNoApply:
                                            itemGroup.canNoApply ?? false,
                                        })}
                                      {itemGroup.questions.map((question) =>
                                        genFormItem(question, field, {
                                          isSubQuestion: true,
                                        })
                                      )}
                                      <Button
                                        onClick={() => remove(field.name)}
                                        danger
                                        className={styles.deleteBtn}
                                        icon={<DeleteOutlined />}
                                        size="small"
                                        type="text"
                                      />
                                    </div>
                                  ))}
                                  <Button type="primary" onClick={() => add()}>
                                    {t("add", { name: itemGroup.group })}
                                  </Button>
                                </div>
                              );
                            }}
                          </Form.List>
                        ) : (
                          <div style={{ marginBottom: 24 }}>
                            <div className={styles.groupTitle}>
                              {itemGroup.group}
                            </div>
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
                        )}
                      </div>
                    );
                  } else {
                    return genFormItem(item as TQuestion);
                  }
                })}
              </Form>
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

                <Button
                  key="submit"
                  type="primary"
                  onClick={() => createTeam()}
                >
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
      )}
    </Drawer>
  );
};

export default JobRequirementFormDrawer;
