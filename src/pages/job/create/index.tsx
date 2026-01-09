import { useRef, useState } from "react";
import { Button, Input, message } from "antd";
import { useNavigate } from "react-router";
import classnames from "classnames";
import { useTranslation } from "react-i18next";

import { Post } from "@/utils/request";
import globalStore from "@/store/global";
import VionaVideo from "@/assets/banner-video.mp4";

import styles from "./style.module.less";
import Icon from "@/components/Icon";
import Send from "@/assets/icons/send";

const JobCreate = () => {
  const { fetchJobs } = globalStore;
  const [jobName, setJobName] = useState("");

  const isSubmittingRef = useRef(false);

  const navigate = useNavigate();

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`create_job.${key}`);

  const createJob = async () => {
    if (jobName !== "") {
      if (isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      const { code, data } = await Post("/api/jobs", {
        name: jobName,
      });
      if (code === 0) {
        message.success(t("create_success"));
        fetchJobs();
        navigate(`/app/jobs/${data.job_id}/standard-board`);
      }
      isSubmittingRef.current = false;
    }
  };

  const disabled = jobName === "";

  return (
    <div className={styles.container}>
      <div className={classnames("flex-center")}>
        <div className={styles.vionaContainer}>
          {/* <Avatar
            icon={<img src={VionaAvatar} />}
            size={144}
            style={{ background: "none" }}
          /> */}

          <video
            src={VionaVideo}
            autoPlay
            loop
            muted
            className={styles.vionaVideo}
          />
          <div className={styles.vionaName}>Viona</div>
          <div className={styles.vionaTitle}>{t("viona_title")}</div>
        </div>
        <div style={{ marginLeft: 12 }}>
          <b
            className={styles.readyMessage}
            dangerouslySetInnerHTML={{ __html: t("ready_message") }}
          />
        </div>
      </div>

      <div className={styles.form}>
        <Input
          size="large"
          className={styles.jobNameInput}
          suffix={
            <Button
              disabled={disabled}
              type="primary"
              className={classnames(styles.suffixButton, {
                [styles.disabled]: disabled,
              })}
              icon={
                <Icon
                  icon={<Send />}
                  className={classnames(styles.suffixIcon, {
                    [styles.disabled]: disabled,
                  })}
                />
              }
              onClick={createJob}
            />
          }
          placeholder={t("reply_placeholder")}
          onPressEnter={createJob}
          value={jobName}
          onChange={(e) => setJobName(e.target.value)}
        />
      </div>
    </div>
  );
};

export default JobCreate;
