import { Form, Input, Button, Switch, Drawer } from "antd";
import { useEffect } from "react";
import { DeleteOutlined } from "@ant-design/icons";

import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { TScreeningQuestionType } from "../../type";

interface IProps {
  onClose: () => void;
  onOk: (groups: TScreeningQuestionType[]) => void;
  screeningQuestionDrawerOpen: boolean;
  questions: TScreeningQuestionType[];
}

const ScreeningQuestionDrawer = (props: IProps) => {
  const { screeningQuestionDrawerOpen, questions, onClose, onOk } = props;
  const [form] = Form.useForm<{ questions: TScreeningQuestionType[] }>();
  const { t: originalT } = useTranslation();

  const t = (key: string) => {
    return originalT(`screening_question.${key}`);
  };

  useEffect(() => {
    form.setFieldsValue({ questions });
  }, [questions]);

  return (
    <Drawer
      open={screeningQuestionDrawerOpen}
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
            onClick={() => {
              form.validateFields().then((values) => {
                const result: TScreeningQuestionType[] =
                  values.questions.filter((question) => question.question);
                onOk(result);
              });
            }}
          >
            {originalT("submit")}
          </Button>
        </div>
      }
    >
      {questions && (
        <Form form={form}>
          <Form.List name="questions">
            {(fields, { add, remove }) => {
              return (
                <div style={{ marginBottom: 24 }}>
                  {fields.map((field) => (
                    <div key={field.key} className={styles.group}>
                      <Form.Item
                        name={[field.name, "question"]}
                        style={{ flex: "auto" }}
                        label={t("question")}
                      >
                        <Input.TextArea
                          rows={2}
                          autoSize={{ minRows: 2, maxRows: 4 }}
                        />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "required"]}
                        label={t("required")}
                      >
                        <Switch />
                      </Form.Item>
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
                  <Button
                    type="primary"
                    onClick={() => add({ question: "", required: false })}
                  >
                    {t("add")}
                  </Button>
                </div>
              );
            }}
          </Form.List>
        </Form>
      )}
    </Drawer>
  );
};

export default ScreeningQuestionDrawer;
