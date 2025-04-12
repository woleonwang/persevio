import { Form, Input, Button, Drawer } from "antd";
import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { TScreeningQuestionType } from "../../type";
import { useState } from "react";

interface IProps {
  onClose: () => void;
  onOk: (result: TResult[]) => void;
  candidateScreeningQuestionDrawerOpen: boolean;
  questions: TScreeningQuestionType[];
}

export type TResult = { question: string; answer: string };

const CandidateScreeningQuestionDrawer = (props: IProps) => {
  const { candidateScreeningQuestionDrawerOpen, questions, onClose, onOk } =
    props;
  const [form] = Form.useForm<Record<string, string>>();
  const { t: originalT } = useTranslation();
  const [uploading, setUploading] = useState(false);

  const t = (key: string) => {
    return originalT(`candidate_screening_question.${key}`);
  };

  return (
    <Drawer
      open={candidateScreeningQuestionDrawerOpen}
      title={t("edit_screening_questions")}
      width={"50vw"}
      onClose={() => onClose()}
      destroyOnClose
      mask={false}
      footer={
        <div className={styles.footer}>
          <Button onClick={() => onClose()}>{originalT("cancel")}</Button>
          <Button
            type="primary"
            disabled={uploading}
            onClick={() => {
              form.validateFields().then(async (values) => {
                const result: TResult[] = [];
                Object.keys(values).forEach((question: string) => {
                  const answer = values[question];

                  result.push({
                    question,
                    answer,
                  });
                });
                setUploading(true);
                await onOk(result);
                setUploading(false);
              });
            }}
          >
            {uploading ? originalT("submitting") : originalT("submit")}
          </Button>
        </div>
      }
    >
      {questions && (
        <Form form={form} layout="vertical">
          {questions.map((question, index) => {
            return (
              <Form.Item
                key={index}
                label={question.question}
                name={question.question}
                required={question.required}
              >
                <Input.TextArea
                  rows={2}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                />
              </Form.Item>
            );
          })}
        </Form>
      )}
    </Drawer>
  );
};

export default CandidateScreeningQuestionDrawer;
