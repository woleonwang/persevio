import { Input } from "antd";
import { TextAreaProps } from "antd/es/input";
import { useTranslation } from "react-i18next";

const TextAreaWithHint = (props: TextAreaProps) => {
  const { t } = useTranslation();
  return (
    <div>
      <div style={{ marginTop: -5, marginBottom: 20, color: "#999" }}>
        <div>{t("company.hint.title")}</div>
        <ul style={{ paddingLeft: 15, margin: 0 }}>
          <li>{t("company.hint.li1")}</li>
          <li>{t("company.hint.li2")}</li>
          <li>{t("company.hint.li3")}</li>
          <li>{t("company.hint.li4")}</li>
        </ul>
        <div>{t("company.hint.footer")}</div>
      </div>
      <Input.TextArea {...props} />
    </div>
  );
};

export default TextAreaWithHint;
