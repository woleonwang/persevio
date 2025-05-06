import { Button } from "antd";
import { GoogleOutlined, LinkedinOutlined } from "@ant-design/icons";
interface IProps {
  fileId: number;
  jobId?: string;
}

const OAuth = (props: IProps) => {
  const { fileId, jobId } = props;
  return (
    <div>
      <h2 style={{ fontSize: 36 }}>Candidate Sign in</h2>
      <div>
        <Button
          icon={<GoogleOutlined />}
          shape="circle"
          size="large"
          onClick={() => {
            window.location.href = `/api/auth/google/login?role=candidate&file_id=${fileId}&job_id=${
              jobId ?? ""
            }`;
          }}
        />

        <Button
          icon={<LinkedinOutlined />}
          shape="circle"
          size="large"
          onClick={() => {
            window.location.href = `/api/auth/linkedin/login?role=candidate&file_id=${fileId}&job_id=${
              jobId ?? ""
            }`;
          }}
        />
      </div>
    </div>
  );
};

export default OAuth;
