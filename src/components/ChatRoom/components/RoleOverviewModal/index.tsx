import { Form, Input, Modal, Popover } from "antd";
import Markdown from "react-markdown";
import { QuestionCircleOutlined } from "@ant-design/icons";
import styles from "./style.module.less";

type TQuestion = {
  key: string;
  question: string;
  hint?: string;
};

const RoleOverviewFormQuestionsGroups: {
  key: string;
  title: string;
  questions: TQuestion[];
}[] = [
  {
    key: "basic",
    title: "Basic information",
    questions: [
      {
        key: "team",
        question: "Which <b>team</b> will this role join?",
      },
      {
        key: "report",
        question: "Who will this role report to?",
      },
      {
        key: "headcounts",
        question: "How many <b>headcounts</b> are you planning for this role?",
      },
      {
        key: "time",
        question:
          "Is this a <b>full-time</b> or <b>part-time</b> role? If part-time, how many hours per week are required?",
      },
      {
        key: "city",
        question: "Which <b>city</b> will this role be based in?",
      },
      {
        key: "remote",
        question:
          "Is this role <b>fully onsite</b>, <b>fully remote</b>, or <b>hybrid</b>? If fully onsite, what is the working location? If hybrid, how many days onsite and how many days remote? What is the onsite location?",
      },
      {
        key: "seniority",
        question: "What is the <b>seniority</b> of this role?",
        hint: `- **Internship/Trainee/Entry Level** - No prior experience required; primary focus is on learning and skill development. Training and close guidance are provided to build foundational knowledge and competencies.\n\n- **Junior**  - Some relevant experience required; contributes to tasks under supervision but isn’t responsible for leading major projects or objectives. Works closely with senior team members who oversee key business goals.\n\n- **Senior**- A highly skilled individual contributor who tackles complex problems and delivers impactful results. Works independently on challenging assignments and provides technical expertise to the team. May mentor Junior members, sharing knowledge and best practices, but is primarily focused on individual contributions rather than team leadership or project management.\n\n- **Manager/Team Lead** - This role serves as a bridge between the Senior level and the Director/Head of Department level. Managers/Team Leads have direct responsibility for leading and managing a team, including performance management, coaching, and ensuring the team meets its objectives. They are experienced professionals who can independently manage projects and provide guidance to Junior and Senior team members. Unlike Senior roles, they have direct reports; unlike Directors, their focus is on team-level execution rather than broad departmental strategy.\n\n- **Director/Head of Department** - Oversees critical business functions and manages larger teams. Responsible for aligning team performance with broader company goals, driving strategic initiatives within their area of responsibility.\n\n- **Senior Executive/Leadership Team** - Sets the overall strategic direction for the company, accountable for company-wide objectives and profit and loss (P&L). Leads major business decisions and ensures alignment across all departments.`,
      },
    ],
  },
  {
    key: "requirement",
    title: "Job Requirements",
    questions: [
      {
        key: "nonNegotiableRequirement",
        question: "Non-negotiable requirements",
      },
      {
        key: "preferredRequirement",
        question: "Preferred requirements",
      },
    ],
  },
  {
    key: "overview",
    title: "Role Overview",
    questions: [
      {
        key: "others",
        question:
          "Tell us anything that you believe will help us better understand the role",
      },
    ],
  },
  {
    key: "materials",
    title: "Reference materials",
    questions: [
      {
        key: "materials",
        question:
          "Any relevant materials that you believe can help us better understand the role. For example, a draft JD, a JD of a similar role, etc.",
      },
      {
        key: "usage",
        question:
          "How should I use the reference materials? Tell us what this reference material is and how should we use it. For example, is this a JD you drafted for this particular role, or a JD of a similar role from another company, etc.)",
      },
    ],
  },
];

const RoleOverviewFormQuestions: TQuestion[] =
  RoleOverviewFormQuestionsGroups.map((item) => item.questions).flat();

type TSubmitResult = {
  key: string;
  question: string;
  answer: string;
};

interface IProps {
  open: boolean;
  onClose: () => void;
  onOk: (result: string) => void;
}
const roleOverviewModal = (props: IProps) => {
  const { open, onClose, onOk } = props;
  const [form] = Form.useForm();

  const onSubmit = () => {
    const values = form.getFieldsValue();
    const result: TSubmitResult[] = [];
    Object.keys(values).forEach((key) => {
      const value = values[key];
      const question = RoleOverviewFormQuestions.find(
        (item) => item.key === key
      );
      if (question && value) {
        result.push({
          key,
          question: question.question
            .replaceAll("</b>", "")
            .replaceAll("<b>", ""),
          answer: value,
        });
      }
    });

    let resultStr = "";
    RoleOverviewFormQuestionsGroups.forEach((group) => {
      const questions: string[] = [];
      group.questions.forEach((question) => {
        const value = values[question.key];
        if (value) {
          questions.push(
            `${question.question
              .replaceAll("</b>", "**")
              .replaceAll("<b>", "**")}\n\n${value}`
          );
        }
      });
      if (questions.length > 0) {
        resultStr += `## ${group.title}\n\n${questions.join("\n\n")}\n\n`;
      }
    });

    onOk(resultStr);
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
        <Form form={form} layout="vertical">
          {RoleOverviewFormQuestionsGroups.map((group) => {
            return (
              <div key={group.key}>
                <h2>{group.title}</h2>
                {group.questions.map((item) => {
                  return (
                    <Form.Item
                      label={
                        <>
                          <span
                            dangerouslySetInnerHTML={{ __html: item.question }}
                          />
                          {item.hint && (
                            <Popover
                              content={
                                <Markdown className={styles.container}>
                                  {item.hint}
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
                      name={item.key}
                      key={item.key}
                    >
                      <Input.TextArea rows={4} />
                    </Form.Item>
                  );
                })}
              </div>
            );
          })}
        </Form>
      </div>
    </Modal>
  );
};

export default roleOverviewModal;
