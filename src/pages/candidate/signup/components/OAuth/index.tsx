import Logo from "@/assets/logo.png";
import Google from "@/assets/google.png";
import Linkedin from "@/assets/linkedin.png";
import styles from "./style.module.less";

interface IProps {
  fileId: number;
  jobId?: string;
}

const OAuth = (props: IProps) => {
  const { fileId, jobId } = props;
  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.panel}>
          <div className={styles.logoWrapper}>
            <img src={Logo} style={{ width: 190 }} />
          </div>

          <div
            onClick={() => {
              window.location.href = `/api/auth/google/login?role=candidate&file_id=${fileId}&job_id=${
                jobId ?? ""
              }`;
            }}
            className={styles.button}
          >
            <img src={Google} className={styles.brand} />
            Continue with Google
          </div>

          <div
            onClick={() => {
              window.location.href = `/api/auth/linkedin/login?role=candidate&file_id=${fileId}&job_id=${
                jobId ?? ""
              }`;
            }}
            className={styles.button}
          >
            <img src={Linkedin} className={styles.brand} />
            Continue with Linked
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div>
          <div>
            Stop the endless job hunt. Persevio uses AI to match you with top
            opportunities in <span>Singapore</span>.
          </div>
          <div>
            <div>One Conversation, Many Opportunities:</div>
            <div>
              Chat once with Viona, our AI recruiter. We'll then proactively
              send you highly accurate, personalized job recommendations.
            </div>
          </div>
          <div>
            <div>Confidentiality Assured</div>
            <div>
              Your profile remains private. Employers only see your details when
              you decide to apply for a specific role.
            </div>
          </div>
          <div>
            <div>Guided Application Process</div>
            <div>
              Viona acts as your dedicated AI copilot, supporting you every step
              of the way.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuth;
