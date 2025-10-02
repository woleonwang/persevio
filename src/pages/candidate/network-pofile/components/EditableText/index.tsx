import { Button, Input } from "antd";
import { EditOutlined } from "@ant-design/icons";
import styles from "./style.module.less";
import { useState } from "react";

interface IProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
}

const EditableText = ({ title, value, onChange }: IProps) => {
  const [editContent, setEditContent] = useState(value);
  const [isEdit, setIsEdit] = useState(false);
  return (
    <div>
      <div className={styles.subTitle}>
        {title}
        {!isEdit && (
          <EditOutlined
            style={{ marginLeft: 10 }}
            onClick={() => {
              setEditContent(value);
              setIsEdit(!isEdit);
            }}
          />
        )}
      </div>
      {isEdit ? (
        <div style={{ marginTop: 10 }}>
          <Input.TextArea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={8}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <Button
              type="primary"
              onClick={() => {
                setIsEdit(false);
                onChange(editContent);
              }}
            >
              保存
            </Button>
            <Button onClick={() => setIsEdit(false)}>取消</Button>
          </div>
        </div>
      ) : (
        <div className={styles.content}>{value}</div>
      )}
    </div>
  );
};

export default EditableText;
