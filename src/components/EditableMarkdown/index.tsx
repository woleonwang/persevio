import { Button } from "antd";
import MarkdownContainer from "../MarkdownContainer";
import MarkdownEditor from "../MarkdownEditor";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./style.module.less";

interface IProps {
  value: string;
  isEditing: boolean;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}
const EditableMarkdown = (props: IProps) => {
  const { value, isEditing, onSubmit, onCancel } = props;

  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    setEditingValue(value);
  }, [value]);

  const { t } = useTranslation();

  return isEditing ? (
    <>
      <div className={styles.container}>
        <MarkdownEditor
          value={editingValue}
          onChange={(val) => setEditingValue(val)}
          style={{
            flex: "auto",
            overflow: "hidden",
            display: "flex",
          }}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <Button onClick={() => onSubmit(editingValue)} type="primary">
          {t("save")}
        </Button>
        <Button onClick={() => onCancel()} style={{ marginLeft: 12 }}>
          {t("cancel")}
        </Button>
      </div>
    </>
  ) : (
    <div
      className={styles.container}
      style={{
        flex: "auto",
        overflow: "auto",
        padding: "0 24px",
      }}
    >
      <MarkdownContainer content={value} />
    </div>
  );
};

export default EditableMarkdown;
