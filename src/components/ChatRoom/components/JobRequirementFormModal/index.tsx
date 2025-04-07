import {
  Button,
  Collapse,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popover,
  Select,
} from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { ReactNode, useEffect, useReducer, useState } from "react";
import { TRoleOverviewType } from "../../type";
import { Get, Post } from "../../../../utils/request";
import MarkdownContainer from "../../../MarkdownContainer";
import dayjs from "dayjs";

import styles from "./style.module.less";
import { useTranslation } from "react-i18next";

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
    | "team"
    | "multiple_select"
    | "date";
  hint?: string;
  dependencies?: TDependence[];
  options?: {
    value: string;
    label: string;
  }[];
  required?: boolean;
};

type TGroup = {
  group: string;
  key: string;
  questions: TQuestion[];
  collapse?: boolean;
  dependencies?: TDependence[];
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

const JobRequirementFormModal = (props: IProps) => {
  const { open, group = "basic_info", isCoworker, onClose, onOk } = props;
  const [form] = Form.useForm();
  const [createTeamForm] = Form.useForm();
  const [_, forceUpdate] = useReducer(() => ({}), {});
  const [createTeamModelOpen, setCreateTeamModelOpen] = useState(false);
  const [teams, setTeams] = useState<TTeam[]>([]);

  const { t: originalT } = useTranslation();

  const t = (key: string) => {
    return originalT(`job_requirement_form.${key}`);
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
          key: "visa_requirments",
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
                { questionKey: "visa_country", valueKey: "singapore" },
              ],
            },
            {
              key: "visa_type_singapore_other",
              type: "text",
              question: t("visa_type_singapore_other"),
              dependencies: [
                {
                  questionKey: "visa_type_singapore",
                  valueKey: "other",
                },
              ],
            },
            {
              key: "visa_type_others",
              type: "multiple_select",
              question: t("visa_type"),
              options: formatOptions(["no_visa", "has_visa", "other_visa"]),
              dependencies: [
                { questionKey: "visa_country", exceptValueKey: "singapore" },
              ],
            },
            {
              key: "visa_type_others_other",
              type: "text",
              question: t("other_visa"),
              dependencies: [
                {
                  questionKey: "visa_type_others",
                  valueKey: "other",
                },
              ],
            },
          ],
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
                  questionKey: "proficiency",
                  valueKey: "other",
                },
              ],
            },
          ],
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
        },

        {
          key: "onboarding_date",
          type: "date",
          question: t("onboarding"),
        },
        {
          key: "certifications",
          type: "text",
          question: t("certification"),
        },
        {
          key: "others",
          type: "text",
          question: t("other"),
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
    const questions = createTeamForm.getFieldsValue();

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
        const getAnswer = (question: TQuestion): string => {
          const value = values[question.key];
          if (!value) return "";

          let formattedValue = value;
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

          return `${(question as TQuestion).question
            .replaceAll("</b>", "**")
            .replaceAll("<b>", "**")}\n\n${formattedValue}`;
        };

        const questions: string[] = [];
        (questionGroup?.questions ?? []).forEach((question) => {
          if (question.key === "team") return;

          if (!!(question as TGroup).group) {
            const answers = (question as TGroup).questions
              .map((question) => getAnswer(question))
              .filter(Boolean);

            if (answers.length) {
              questions.push(`#### ${(question as TGroup).group}`);
              answers.forEach((answer) => {
                questions.push(answer);
              });
            }
          } else {
            const answer = getAnswer(question as TQuestion);
            if (answer) {
              questions.push(answer);
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

  const checkVisible = (dependencies?: TDependence[]) => {
    return (dependencies ?? []).every((dep) => {
      const currentValue = form.getFieldsValue()[dep.questionKey];

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
  const genFormItem = (question: TQuestion): ReactNode => {
    const visible = checkVisible(question.dependencies);

    if (!visible) return null;

    return (
      <Form.Item
        label={
          <>
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
          </>
        }
        name={question.key}
        key={question.key}
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
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      onCancel={onClose}
      closable={true}
      title={questionGroup.title}
      width={800}
      centered
      footer={[
        <Button key="back" onClick={onClose}>
          {originalT("cancel")}
        </Button>,
        group === "reference" && (
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
        ),
        <Button
          key="submit"
          type="primary"
          disabled={!canSubmit()}
          onClick={() => onSubmit()}
        >
          {originalT("submit")}
        </Button>,
      ]}
    >
      <div style={{ height: "60vh", overflow: "auto" }}>
        <div style={{ color: "#999", marginBottom: 20 }}>{t("tips")}</div>
        {questionGroup && (
          <>
            <Form form={form} layout="vertical" onFieldsChange={forceUpdate}>
              {questionGroup.questions.map((item) => {
                if (!!(item as TGroup).group) {
                  const itemGroup = item as TGroup;
                  const isVisible = checkVisible(item.dependencies);
                  if (!isVisible) return null;

                  return itemGroup.collapse ? (
                    <Collapse
                      items={[
                        {
                          key: "team-context",
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
                    />
                  ) : (
                    <div className={styles.group} key={itemGroup.key}>
                      <div className={styles.groupTitle}>{itemGroup.group}</div>
                      {itemGroup.questions.map((question) =>
                        genFormItem(question)
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
        <Modal
          open={createTeamModelOpen}
          onClose={() => onCloseCreateTeamModal()}
          onCancel={() => onCloseCreateTeamModal()}
          closable={true}
          title={t("create_team")}
          width={800}
          onOk={() => createTeam()}
          centered
          okText={originalT("submit")}
          cancelText={originalT("cancel")}
        >
          <div style={{ height: "60vh", overflow: "auto" }}>
            <Form form={createTeamForm} layout="vertical">
              {TeamQuestions.map((item) => genFormItem(item))}
            </Form>
          </div>
        </Modal>
      </div>
    </Modal>
  );
};

export default JobRequirementFormModal;
