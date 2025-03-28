import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popover,
  Select,
} from "antd";
import Markdown from "react-markdown";
import { QuestionCircleOutlined } from "@ant-design/icons";
import styles from "./style.module.less";
import { useEffect, useReducer, useState } from "react";
import { TRoleOverviewType } from "../../type";
import { Get, Post } from "../../../../utils/request";

type TQuestion = {
  key: string;
  question: string;
  type: "text" | "select" | "textarea" | "number" | "team";
  hint?: string;
  dependencies?: {
    questionKey: string;
    valueKey?: string | string[];
    exists?: boolean;
  }[];
  options?: {
    value: string;
    label: string;
  }[];
  required?: boolean;
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
    question: "How many team members?",
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
    key: "language",
    question: "What is the working language of the team",
    type: "text",
  },
];

const RoleOverviewFormQuestionsGroups: {
  key: TRoleOverviewType;
  title: string;
  questions: TQuestion[];
}[] = [
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
        type: "textarea",
        question:
          "Which <b>city</b> and <b>address</b> will this role be based in?",
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
          "How should I use the reference materials? Tell us what this reference material is and how should we use it. For example, is this a JD you drafted for this particular role, or a JD of a similar role from another company, etc.)",
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
      ...TeamQuestions.map((item) => ({
        ...item,
        dependencies: [{ questionKey: "team", exists: true }],
      })),
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
        key: "others",
        type: "textarea",
        question:
          "Is there anything about the team that a potential candidate should know?",
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

const RoleOverviewModal = (props: IProps) => {
  const { open, group = "basic_info", onClose, onOk } = props;
  const [form] = Form.useForm();
  const [createTeamForm] = Form.useForm();
  const [_, forceUpdate] = useReducer(() => ({}), {});
  const [createTeamModelOpen, setCreateTeamModelOpen] = useState(false);
  const [teams, setTeams] = useState<TTeam[]>([]);

  const questionGroup = RoleOverviewFormQuestionsGroups.find(
    (item) => item.key === group
  );

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
      RoleOverviewFormQuestionsGroups.forEach((group) => {
        const questions: string[] = [];
        group.questions.forEach((question) => {
          if (question.key === "team") return;

          const value = values[question.key];
          const formattedValue =
            question.type === "select"
              ? (question.options ?? []).find((item) => item.value === value)
                  ?.label
              : value;
          if (value) {
            questions.push(
              `${question.question
                .replaceAll("</b>", "**")
                .replaceAll("<b>", "**")}\n\n${formattedValue}`
            );
          }
        });
        if (questions.length > 0) {
          resultStr += `## ${group.title}\n\n${questions.join("\n\n")}\n\n`;
        }
      });

      onOk(resultStr);
    });
  };

  const genFormItem = (question: TQuestion) => {
    return (
      <Form.Item
        label={
          <>
            <span dangerouslySetInnerHTML={{ __html: question.question }} />
            {question.hint && (
              <Popover
                content={
                  <Markdown className={styles.container}>
                    {question.hint}
                  </Markdown>
                }
                placement="right"
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
              {questionGroup.questions
                .filter((item) => {
                  if (!item.dependencies) return true;

                  return item.dependencies.every((dep) => {
                    const currentValue = form.getFieldValue(dep.questionKey);
                    return dep.exists
                      ? !!currentValue
                      : Array.isArray(dep.valueKey)
                      ? dep.valueKey.includes(currentValue)
                      : dep.valueKey === currentValue;
                  });
                })
                .map((item) => genFormItem(item))}
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

export default RoleOverviewModal;
