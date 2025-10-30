import { Button } from "antd";
import MarkdownContainer from "../MarkdownContainer";
import MarkdownEditor from "../MarkdownEditor";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import classnames from "classnames";
import styles from "./style.module.less";

interface IProps {
  value: string;
  isEditing: boolean;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  style?: React.CSSProperties;
  className?: string;
}
const EditableMarkdown = (props: IProps) => {
  const { value, isEditing, onSubmit, onCancel, style, className } = props;

  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    setEditingValue(value);
  }, [value]);

  const { t } = useTranslation();

  return isEditing ? (
    <div className={classnames(styles.container, className)} style={style}>
      <MarkdownEditor
        value={editingValue}
        onChange={(val) => setEditingValue(val)}
        style={{
          flex: "auto",
          overflow: "hidden",
          display: "flex",
        }}
      />
      <div style={{ marginTop: 12 }}>
        <Button onClick={() => onSubmit(editingValue)} type="primary">
          {t("save")}
        </Button>
        <Button onClick={() => onCancel()} style={{ marginLeft: 12 }}>
          {t("cancel")}
        </Button>
      </div>
    </div>
  ) : (
    <div className={classnames(styles.container, className)} style={style}>
      <MarkdownContainer content={value} />
    </div>
  );
};

export default EditableMarkdown;
