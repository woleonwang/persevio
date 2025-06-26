import { Input } from "antd";
import { useTranslation } from "react-i18next";
import styles from "./style.module.less";

export type TManangerDetailValue = {
  jobTitle?: string;
  name?: string;
};

export interface IProps {
  value?: TManangerDetailValue;
  onChange?: (val: TManangerDetailValue) => void;
}
const ManagerDetail = (props: IProps) => {
  const { value: { jobTitle, name } = {}, onChange } = props;

  const { t: originalT } = useTranslation();
  const t = (key: string, params?: Record<string, string>): string => {
    return originalT(`manager_detail.${key}`, params);
  };

  const onJobTitleChange = (jobTitle: string) => {
    onChange?.({
      jobTitle,
      name,
    });
  };

  const onNameChange = (name: string) => {
    onChange?.({
      jobTitle,
      name,
    });
  };

  return (
    <div className={styles.container}>
      <Input
        value={jobTitle}
        style={{ flex: 1 }}
        onChange={(e) => onJobTitleChange(e.target.value)}
        placeholder={t("job_title")}
      />

      <Input
        value={jobTitle}
        style={{ flex: 1 }}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder={t("name")}
      />
    </div>
  );
};

export default ManagerDetail;
