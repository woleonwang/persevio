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
        hint: `- **Internship/Trainee/Entry Level** - No prior experience required; primary focus is on learning and skill development. Training and close guidance are provided to build foundational knowledge and competencies.
    
    - **Junior** - Some relevant experience required; contributes to tasks under supervision but isn’t responsible for leading major projects or objectives. Works closely with senior team members who oversee key business goals.
    
    - **Senior** - Capable of independently managing certain tasks or projects; provides guidance and mentorship to junior team members and may lead small teams. Plays a role in achieving departmental objectives.
    
    - **Director/Head of Department** - Oversees critical business functions and manages larger teams. Responsible for aligning team performance with broader company goals, driving strategic initiatives within their area of responsibility.
    
    - **Senior Executive** - Sets the overall strategic direction for the company, accountable for company-wide objectives and profit and loss (P&L). Leads major business decisions and ensures alignment across all departments.`,
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
        key: "others",
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
  onOk: (result: TSubmitResult[]) => void;
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
    onOk(result);
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
