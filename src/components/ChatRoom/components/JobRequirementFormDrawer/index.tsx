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
import { ReactNode, useEffect, useReducer, useState } from "react";
import { TRoleOverviewType, TUserRole } from "../../type";
import { Get, Post } from "../../../../utils/request";
import MarkdownContainer from "../../../MarkdownContainer";
import dayjs from "dayjs";

import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import BaseSalaryInput, { TSalaryValue } from "./components/BaseSalaryInput";
import CityAndAddressSelect, {
  TValue,
} from "./components/CityAndAddressSelect";
import TextAreaWithUploader from "./components/TextareaWithUploader";
import ManagerDetail, {
  TManangerDetailValue,
} from "./components/ManagerDetail";
import PercentageInput from "./components/PercentageInput";

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
    | "base_salary"
    | "city_and_address"
    | "manager_detail"
    | "percentage";
  hint?: string;
  dependencies?: TDependence[];
  options?: {
    value: string;
    label: string;
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
  open: boolean;
  group?: TRoleOverviewType;
  userRole: TUserRole;
  onClose: () => void;
  onOk: (result: string) => void;
}

type TTeam = {
  id: number;
  name: string;
  detail: string;
};

const JobRequirementFormDrawer = (props: IProps) => {
  const {
    open,
    group: formType = "basic_info",
    userRole,
    onClose,
    onOk,
  } = props;
  const [form] = Form.useForm();
  const [createTeamForm] = Form.useForm();
  const [_, forceUpdate] = useReducer(() => ({}), {});
  const [createTeamModelOpen, setCreateTeamModelOpen] = useState(false);
  const [teams, setTeams] = useState<TTeam[]>([]);

  const { t: originalT, i18n } = useTranslation();

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

  const RoleOverviewFormQuestionsGroups: TQuestionGroup[] = [
    {
      key: "basic_info",
      title: t("basic_information"),
      questions:
        i18n.language === "en-US"
          ? [
              {
                key: "reason",
                type: "select",
                question: t("reason"),
                options: [
                  {
                    value: "back_fill",
                    label: t("back_fill"),
                  },
                  {
                    value: "new_role",
                    label: t("new_role"),
                  },
                ],
              },
              {
                key: "employment_type",
                type: "multiple_select",
                question: t("employment_type"),
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
              },
              {
                key: "contract_duration",
                type: "number",
                question: t("duration"),
                dependencies: [
                  {
                    questionKey: "employment_type",
                    valueKey: "contract",
                  },
                ],
              },
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
              },
              {
                key: "working_hours",
                type: "number",
                question: t("working_hours"),
                dependencies: [
                  {
                    questionKey: "time",
                    valueKey: "part-time",
                  },
                ],
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
                    value: "hybrid",
                    label: t("hybrid"),
                  },
                  {
                    value: "remote",
                    label: t("remote"),
                  },
                ],
              },
              {
                key: "city",
                type: "city_and_address",
                question: t("city"),
                dependencies: [
                  {
                    questionKey: "remote",
                    valueKey: ["onsite", "hybrid"],
                  },
                ],
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
              },
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
                key: "manager_detail",
                type: "manager_detail",
                question: t("manager_detail"),
              },
              {
                key: "internal_employee",
                type: "text",
                question: t("internal_employee"),
              },
              {
                key: "headcount",
                type: "number",
                question: t("head_count"),
              },
              {
                key: "urgency",
                type: "select",
                question: t("urgency"),
                options: [
                  {
                    value: "p0",
                    label: "P0",
                  },
                  {
                    value: "p1",
                    label: "P1",
                  },
                  {
                    value: "p2",
                    label: "P2",
                  },
                ],
              },
            ]
          : [
              {
                key: "team",
                type: "team",
                question: "这个职位将加入哪个团队？",
                required: true,
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
                key: "manager_detail",
                type: "manager_detail",
                question: "这个职位汇报给谁?",
                required: true,
              },
              {
                key: "employee_type",
                type: "select",
                question: "这个职位的级别是什么？",
                options: [
                  "实习生",
                  "应届毕业生/无经验",
                  "初级/少量经验",
                  "中级/有一定经验",
                  "高级/经验非常丰富,",
                ].map((item) => ({
                  value: item,
                  label: item,
                })),
                required: true,
              },
              {
                key: "percentage",
                type: "percentage",
                question:
                  "这个职位的贡献类型是什么？（请为以下各项提供百分比，总和需为 100%）",
                options: [
                  "执行上级安排的具体任务",
                  "负责具体项目/具体目标的推动和完成",
                  "管团队/管人",
                  "设计高层战略/计划",
                ].map((item) => ({
                  value: item,
                  label: item,
                })),
                required: true,
              },
              {
                key: "influence",
                type: "select",
                question: "这个职位将产生什么级别的影响？",
                options: [
                  "仅影响分配给他们的任务。",
                  "直接影响他们负责的具体项目/具体目标的结果。",
                  "直接影响一个团队的工作成绩。",
                  "直接影响多个团队/部门的工作成绩。",
                  "直接影响整条产品线/业务线的结果。",
                  "直接影响整个公司的工作成绩。",
                ].map((item) => ({
                  value: item,
                  label: item,
                })),
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
            const typedValue = value as TValue;
            formattedValue = `${typedValue.cityName}. ${typedValue.addressName}`;
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
              .map((key) => `${key}: ${typedValue[key]}%`)
              .join("\n\n");
          }

          // if (question.type === "internal_employee_level") {
          //   const typedValue = value as TInternalEmployeeLevelValue;
          //   formattedValue = `${typedValue.name}`;
          // }

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
      <>
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
            field?.name !== undefined
              ? [field.name, question.key]
              : question.key
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
                    message: "请填写百分比，且百分比之和必须等于100",
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
                      if (!typedValue.jobTitle || !typedValue.name) {
                        callback(new Error());
                      }
                      callback();
                    },
                    message: "请填写职位和姓名",
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
              rows={2}
              autoSize={{ minRows: 2, maxRows: 8 }}
              disabled={deleted}
              allowFile={question.allowFile}
            />
          )}
          {question.type === "number" && <InputNumber disabled={deleted} />}
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
          {question.type === "date" && <DatePicker disabled={deleted} />}
          {question.type === "base_salary" && <BaseSalaryInput />}
          {question.type === "city_and_address" && <CityAndAddressSelect />}
          {/* {question.type === "internal_employee_level" && (
            <InternalEmployeeLevel />
          )} */}
          {question.type === "manager_detail" && <ManagerDetail />}
          {question.type === "percentage" && (
            <PercentageInput
              options={(question.options ?? []).map((item) => item.label)}
            />
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
    <Drawer
      open={open}
      onClose={onClose}
      title={questionGroup.title}
      width={"100vw"}
      destroyOnClose
      closable={false}
      mask={false}
      footer={
        <div className={styles.drawerFooter}>
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
      }
    >
      {open && (
        <div style={{ flex: "auto", overflow: "auto" }}>
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
