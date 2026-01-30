import Logo from "@/assets/logo.png";
import Google from "@/assets/google.png";
import Linkedin from "@/assets/linkedin.png";
import styles from "./style.module.less";
import classnames from "classnames";

interface IProps {
  jobId?: string;
}

const OAuth = (props: IProps) => {
  const { jobId } = props;

  return (
    <div className={styles.container}>
      <div className={styles.body}>
        <div className={styles.logoWrapper}>
          <img src={Logo} style={{ width: 250 }} />
        </div>

        <div style={{ width: "50%" }}>
          <div>
            <div className={styles.title}>
              <div>
                Hi, 我是 <span className={styles.primary}>Viona</span>。
              </div>
              <div>
                是一名 <span className={styles.primary}>“超级连接者”</span>。
              </div>
            </div>
            <div className={styles.hint}>
              我的工作就是把我人脉圈里像你一样优秀的人才介绍给彼此，创造互惠共赢的机会：比如融资、招聘、专家咨询，或者只是拓展一下职业人脉。
            </div>
          </div>
          <div
            onClick={() => {
              window.location.href = `/api/auth/google/login?role=candidate&job_id=${
                jobId ?? ""
              }`;
            }}
            className={classnames(styles.button, styles.google)}
          >
            <img src={Google} className={styles.brand} />
            使用 Google 登录
          </div>

          <div
            onClick={() => {
              window.location.href = `/api/auth/linkedin/login?role=candidate&job_id=${
                jobId ?? ""
              }`;
            }}
            className={classnames(styles.button, styles.linkedin)}
          >
            <img src={Linkedin} className={styles.brand} />
            使用 LinkedIn 登录
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuth;
