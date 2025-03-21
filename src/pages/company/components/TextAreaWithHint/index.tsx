import { Input } from "antd";
import { TextAreaProps } from "antd/es/input";

const TextAreaWithHint = (props: TextAreaProps) => {
  return (
    <div>
      <div style={{ marginTop: -5, marginBottom: 20, color: "#999" }}>
        <div>
          Viona, your AI Recruiter, relies on the information in this database
          to perform key tasks:
        </div>
        <ul style={{ paddingLeft: 15, margin: 0 }}>
          <li>Understanding job requirements during conversations.</li>
          <li>Creating accurate and compelling job descriptions.</li>
          <li>
            Providing informed answers to candidate inquiries about the company.
          </li>
          <li>Many other tasks.</li>
        </ul>
        <div>
          Please ensure all company details are comprehensive, accurate, and
          kept current. Incomplete or outdated information will impact Viona's
          effectiveness
        </div>
      </div>
      <Input.TextArea {...props} />
    </div>
  );
};

export default TextAreaWithHint;
