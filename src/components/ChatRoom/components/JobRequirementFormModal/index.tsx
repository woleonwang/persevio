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

const TeamQuestions: TQuestion[] = [
  {
    key: "name",
    question: "Team name",
    type: "text",
  },
  {
    key: "objectives",
    question:
      "Brief intro about this team's core objectives and responsibilities.",
    type: "textarea",
  },
  {
    key: "members_count",
    question: "How many team members, excluding this new role?",
    type: "number",
  },
  {
    key: "members_detail",
    question:
      "Brief intro about the team members. Their responsibilities, experience levels, where they are from, etc.",
    type: "textarea",
  },
  {
    key: "lead",
    question: "Who is the team lead?",
    type: "text",
  },
  {
    key: "lead_detail",
    question: "Brief introduction to the team lead, their working style. etc",
    type: "textarea",
  },
  {
    key: "team_language",
    question: "What is the working language of the team",
    type: "text",
  },
];

const formatOptions = (options: string[]) => {
  return options.map((item) => {
    return {
      value: item.toLowerCase().replaceAll(" ", "_"),
      label: item,
    };
  });
};

const RoleOverviewFormQuestionsGroups: TQuestionGroup[] = [
  {
    key: "basic_info",
    title: "Basic information",
    questions: [
      {
        key: "time",
        type: "select",
        question:
          "Is this a <b>full-time</b> or <b>part-time</b> role? If part-time, how many hours per week are required?",
        options: [
          {
            value: "full-time",
            label: "Full-time",
          },
          {
            value: "part-time",
            label: "Part-time",
          },
        ],
        required: true,
      },
      {
        key: "role",
        type: "select",
        question: "Is this role a <b>perm role</b> or a <b>contract role</b>?",
        options: [
          {
            value: "perm",
            label: "Perm role",
          },
          {
            value: "contract",
            label: "Contract role",
          },
        ],
        required: true,
      },
      {
        key: "contract_duration",
        type: "number",
        question: "Contract duration (in months)",
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
        question:
          "Is this role <b>fully onsite</b>, <b>fully remote</b>, or <b>hybrid</b>?",
        options: [
          {
            value: "onsite",
            label: "Fully onsite",
          },
          {
            value: "remote",
            label: "Fully remote",
          },
          {
            value: "hybrid",
            label: "Hybrid",
          },
        ],
        required: true,
      },
      {
        key: "city",
        type: "text",
        question: "Which <b>city</b> will this role be based in?",
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
        question: "What is the <b>office address</b> for this role?",
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
        question: "What is the <b>seniority</b> of this role?",
        hint: `- **Internship/Trainee/Entry Level** - No prior experience required; primary focus is on learning and skill development. Training and close guidance are provided to build foundational knowledge and competencies.\n\n- **Junior**  - Some relevant experience required; contributes to tasks under supervision but isn’t responsible for leading major projects or objectives. Works closely with senior team members who oversee key business goals.\n\n- **Senior**- A highly skilled individual contributor who tackles complex problems and delivers impactful results. Works independently on challenging assignments and provides technical expertise to the team. May mentor Junior members, sharing knowledge and best practices, but is primarily focused on individual contributions rather than team leadership or project management.\n\n- **Manager/Team Lead** - This role serves as a bridge between the Senior level and the Director/Head of Department level. Managers/Team Leads have direct responsibility for leading and managing a team, including performance management, coaching, and ensuring the team meets its objectives. They are experienced professionals who can independently manage projects and provide guidance to Junior and Senior team members. Unlike Senior roles, they have direct reports; unlike Directors, their focus is on team-level execution rather than broad departmental strategy.\n\n- **Director/Head of Department** - Oversees critical business functions and manages larger teams. Responsible for aligning team performance with broader company goals, driving strategic initiatives within their area of responsibility.\n\n- **Senior Executive/Leadership Team** - Sets the overall strategic direction for the company, accountable for company-wide objectives and profit and loss (P&L). Leads major business decisions and ensures alignment across all departments.`,
        options: [
          {
            value: "intership",
            label: "Internship/Trainee/Entry Level",
          },
          {
            value: "junior",
            label: "Junior",
          },
          {
            value: "senior",
            label: "Senior",
          },
          {
            value: "manager",
            label: "Manager/Team Lead",
          },
          {
            value: "director",
            label: "Director/Head of Department",
          },
          {
            value: "executive",
            label: "Senior Executive/Leadership Team",
          },
        ],
        required: true,
      },
      {
        key: "internal_employee",
        type: "textarea",
        question: "Is there an internal employee level for this role?",
        required: true,
      },
      {
        key: "headcount",
        type: "number",
        question: "How many headcount? ",
        required: true,
      },
      {
        key: "when_start",
        type: "select",
        question: "When do you need this role to start?",
        options: [
          {
            value: "soon",
            label: "As soon as possible",
          },
          {
            value: "one_month",
            label: "Within 1 month",
          },
          {
            value: "two_month",
            label: "Within 2 months",
          },
          {
            value: "three_month",
            label: "Within 3 months",
          },
          {
            value: "not_hurry",
            label: "We are not in a hurry",
          },
        ],
        required: true,
      },
    ],
  },

  {
    key: "reference",
    title: "Reference materials",
    questions: [
      {
        key: "materials",
        question:
          "Any relevant materials that you believe can help us better understand the role. For example, a draft JD, a JD of a similar role, etc.",
        type: "textarea",
      },
      {
        key: "usage",
        type: "textarea",
        question:
          "How should I use the reference materials? Tell me what this reference material is and how should we use it. For example, is this a JD you drafted for this particular role, or a JD of a similar role from another company, etc.)",
      },
    ],
  },

  {
    key: "team_context",
    title: "Team Context",
    questions: [
      {
        key: "team",
        type: "team",
        question: "Which <b>team</b> will this role join?",
      },
      {
        group: "Team Details",
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
        question: "Who will this role report to?",
      },
      {
        key: "manager_detail",
        type: "textarea",
        question:
          "Brief intro about this role's direct manager, their working style, etc.",
      },
      {
        key: "collaborators",
        type: "textarea",
        question:
          "Who will be the key collaborators (internal teams/roles, external partners/clients)?",
      },
      {
        key: "team_others",
        type: "textarea",
        question:
          "Is there anything about the team that a potential candidate should know?",
      },
    ],
  },

  {
    key: "other_requirement",
    title: "Other requirements",
    questions: [
      {
        group: "Visa Requirements",
        key: "visa_requirments",
        questions: [
          {
            key: "visa_country",
            type: "select",
            question: "Country",
            options: [
              {
                value: "china",
                label: "China",
              },
              {
                value: "singapore",
                label: "Singapore",
              },
            ],
          },
          {
            key: "visa_type_singapore",
            type: "multiple_select",
            question: "Visa Types",
            options: formatOptions([
              "Singapore Citizen",
              "Singapore PR",
              "EP",
              "SP",
              "WP",
              "DP",
              "Other",
            ]),
            dependencies: [
              { questionKey: "visa_country", valueKey: "singapore" },
            ],
          },
          {
            key: "visa_type_singapore_other",
            type: "text",
            question: "Other",
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
            question: "Visa Types",
            options: formatOptions([
              "We cannot sponsor Visa",
              "We can sponsor Visa",
              "Other",
            ]),
            dependencies: [
              { questionKey: "visa_country", exceptValueKey: "singapore" },
            ],
          },
          {
            key: "visa_type_others_other",
            type: "text",
            question: "Other",
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
        group: "Language proficiency",
        key: "language_group",
        questions: [
          {
            key: "language",
            type: "select",
            question: "Language",
            options: formatOptions(["Chinese", "English"]),
          },
          {
            key: "proficiency",
            type: "select",
            question: "Proficiency level",
            options: formatOptions([
              "Native Speaker",
              "Professional Proficiency",
              "Daily Conversational",
              "Other",
            ]),
          },
          {
            key: "proficiency_other",
            type: "text",
            question: "Other",
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
        group: "Travel",
        key: "travel_group",
        questions: [
          {
            key: "travel_type",
            type: "select",
            question: "Travel",
            options: formatOptions([
              "No travel",
              "Ad hoc travel",
              "Some travel",
              "Regular travel",
            ]),
          },
          {
            key: "destinations",
            type: "text",
            question: "Destinations",
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
            question: "Nature of travel",
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
            question: "Regularity",
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
        question: "Onboarding date before",
      },
      {
        key: "certifications",
        type: "text",
        question:
          "Certifications, security clearances, legal requirements, etc",
      },
      {
        key: "others",
        type: "text",
        question: "Others",
      },
    ],
  },
];

interface IProps {
  open: boolean;
  group?: TRoleOverviewType;
  onClose: () => void;
  onOk: (result: string) => void;
}

type TTeam = {
  id: number;
  name: string;
  detail: string;
};

const JobRequirementFormModal = (props: IProps) => {
  const { open, group = "basic_info", onClose, onOk } = props;
  const [form] = Form.useForm();
  const [createTeamForm] = Form.useForm();
  const [_, forceUpdate] = useReducer(() => ({}), {});
  const [createTeamModelOpen, setCreateTeamModelOpen] = useState(false);
  const [teams, setTeams] = useState<TTeam[]>([]);

  const questionGroup = RoleOverviewFormQuestionsGroups.find(
    (item) => item.key === group
  ) as unknown as TQuestionGroup;

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    const res = await Get<{ teams: TTeam[] }>(`/api/teams`);
    if (res.code === 0) {
      setTeams(res.data.teams);
    }
  };

  const onCloseCreateTeamModal = () => setCreateTeamModelOpen(false);

  const createTeam = async () => {
    const questions = createTeamForm.getFieldsValue();

    const { code } = await Post<TTeam>(`/api/teams`, {
      name: questions.name,
      detail: JSON.stringify(questions),
    });

    if (code === 0) {
      message.success("Create team succeed");
      fetchTeams();
      onCloseCreateTeamModal();
    }
  };

  const onSubmit = () => {
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
        rules={[
          {
            required: question.required,
            message: `Please enter or select`,
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
                      Create Team
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
      title="Role Overview"
      width={800}
      onOk={() => onSubmit()}
      okText="Submit"
      centered
    >
      <div style={{ height: "60vh", overflow: "auto" }}>
        <div style={{ color: "#999" }}>
          You don't have to answer every question below, but more information
          from you will help me form a more accurate initial understanding of
          the role, which leads to a more productive conversation.
        </div>
        {questionGroup && (
          <>
            <h2>{questionGroup.title}</h2>
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
                        },
                      ]}
                      style={{ marginBottom: 20 }}
                    />
                  ) : (
                    <div className={styles.group}>
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
          title="Create Team"
          width={800}
          onOk={() => createTeam()}
          centered
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
