import empty from "@/assets/empty.png";
import { useTranslation } from "react-i18next";

interface IProps {
  description?: string;
  style?: React.CSSProperties;
  className?: string;
}
const Empty = (props: IProps) => {
  const { description, style, className } = props;
  const { t: originalT } = useTranslation();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
      className={className}
    >
      <img src={empty} alt="empty" style={{ width: 140 }} />
      <div style={{ marginTop: 12 }}>
        {description || originalT("empty_text")}
      </div>
    </div>
  );
};

export default Empty;
