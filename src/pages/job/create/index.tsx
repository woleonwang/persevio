import { useRef, useState } from "react";
import { Avatar, Button, Input, message } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import classnames from "classnames";
import { useTranslation } from "react-i18next";

import { Post } from "@/utils/request";
import globalStore from "@/store/global";
import VionaAvatar from "@/assets/viona-avatar.png";

import styles from "./style.module.less";
import { copy } from "@/utils";

interface IProps {
  share?: boolean;
}
const JobCreate = (props: IProps) => {
  const { share } = props;

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
        navigate(`/app/jobs/${data.job_id}/chat/job-requirement`);
      }
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className={styles.container}>
      <div className={classnames("flex-center")}>
        <Avatar icon={<img src={VionaAvatar} />} size={64} />
        <div style={{ marginLeft: 12 }}>
          <b style={{ fontSize: 32 }}>{t("viona_title")}</b>
        </div>
      </div>

      <div
        className={classnames("flex-center", "fs-36-b")}
        style={{ marginTop: 24 }}
      >
        {t("ready_message")}
      </div>

      {!share && (
        <div
          className={classnames("flex-center", "gap-12")}
          style={{ marginTop: 24, fontSize: 20 }}
        >
          {t("share_message")}
          <Button
            type="primary"
            onClick={async () => {
              const url = `${
                window.origin
              }/app/entry/create-job?token=${localStorage.getItem(
                "token"
              )}&share=1`;
              await copy(url);
              message.success(t("copy_success"));
            }}
          >
            {t("share_link")}
          </Button>
        </div>
      )}

      <div className={styles.form}>
        <Input
          size="large"
          suffix={
            <SendOutlined
              onClick={createJob}
              style={{ fontSize: 20, color: "#1FAC6A" }}
            />
          }
          style={{ borderRadius: 32, width: 720, height: 64, paddingLeft: 32 }}
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
