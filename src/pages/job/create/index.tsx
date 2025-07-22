import { useRef, useState } from "react";
import { Avatar, Button, Input, message } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import classnames from "classnames";

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

  // const { t: originalT } = useTranslation();
  // const t = (key: string) => originalT(`create_job.${key}`);

  const createJob = async () => {
    if (jobName !== "") {
      if (isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      const { code, data } = await Post("/api/jobs", {
        name: jobName,
      });
      if (code === 0) {
        message.success("Create job succeed");
        fetchJobs();
        navigate(`/app/jobs/${data.job_id}`);
      }
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className={styles.container}>
      <div className={classnames("flex-center")}>
        <Avatar icon={<img src={VionaAvatar} />} size={64} />
        <div style={{ marginLeft: 12 }}>
          <b style={{ fontSize: 32 }}>Viona, AI 招聘专员</b>
        </div>
      </div>

      <div
        className={classnames("flex-center", "fs-36-b")}
        style={{ marginTop: 24 }}
      >
        准备好创建职位了吗？请告诉我职位名称吧！
      </div>

      {!share && (
        <div
          className={classnames("flex-center", "gap-12")}
          style={{ marginTop: 24, fontSize: 20 }}
        >
          您也可以分享链接，与小伙伴一起定义职位需求
          <Button
            type="primary"
            onClick={async () => {
              const url = `${
                window.origin
              }/share/create-job?token=${localStorage.getItem("token")}`;
              await copy(url);
              message.success("复制成功");
            }}
          >
            分享链接
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
          placeholder="回复 Viona"
          onPressEnter={createJob}
          value={jobName}
          onChange={(e) => setJobName(e.target.value)}
        />
      </div>
    </div>
  );
};

export default JobCreate;
