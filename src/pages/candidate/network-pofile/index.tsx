import { useEffect, useState } from "react";
import { Get, Post } from "@/utils/request";

import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { Empty, message, Tabs, Upload } from "antd";
import MarkdownContainer from "@/components/MarkdownContainer";
import { PlusOutlined } from "@ant-design/icons";
import EditableText from "./components/EditableText";

type TTabKey = "profile" | "goals";
const NetworkProfile = () => {
  const [candidate, setCandidate] = useState<ICandidateSettings>();
  const [status, setStatus] = useState<TTabKey>("profile");

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`candidate_resume.${key}`);

  useEffect(() => {
    fetchCandidate();
  }, []);

  const fetchCandidate = async () => {
    const { code, data } = await Get("/api/candidate/settings");
    if (code === 0) {
      setCandidate(data.candidate);
    }
  };

  const updateProfile = async (
    values: Partial<Record<"interests" | "targets" | "avatar", string>>
  ) => {
    const { code } = await Post("/api/candidate/network/profile", values);
    if (code === 0) {
      fetchCandidate();
      message.success("更新成功");
      return true;
    } else {
      message.error("更新失败");
      return false;
    }
  };

  return (
    <div className={styles.container}>
      <Tabs
        style={{ marginTop: 20 }}
        centered
        activeKey={status}
        items={[
          {
            key: "profile",
            label: "基本职业生涯",
          },
          {
            key: "goals",
            label: "感兴趣的人物画像",
          },
        ]}
        onChange={(type) => {
          setStatus(type as TTabKey);
        }}
      />
      {status === "profile" && (
        <div style={{ padding: 20, overflow: "auto" }}>
          {candidate?.profile_doc ? (
            <>
              <div>
                <div className={styles.title}>头像</div>
                <Upload
                  action="/api/candidate/network/avatar"
                  accept="image/*"
                  maxCount={1}
                  listType="picture-card"
                  showUploadList={false}
                  headers={{
                    authorization:
                      localStorage.getItem("candidate_token") || "",
                  }}
                  onChange={async (info) => {
                    if (info.file.status === "done") {
                      await updateProfile({
                        avatar: info.file.response.data.avatar,
                      });
                    } else if (info.file.status === "error") {
                      message.error("上传失败");
                    }
                  }}
                >
                  {candidate?.avatar ? (
                    <img
                      src={`/api/avatar/${candidate?.avatar}`}
                      alt="avatar"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        width: "auto",
                        height: "auto",
                        display: "block",
                        margin: "0 auto",
                      }}
                    />
                  ) : (
                    <button
                      style={{ border: 0, background: "none" }}
                      type="button"
                    >
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>上传</div>
                    </button>
                  )}
                </Upload>
              </div>

              <div style={{ marginTop: 20 }}>
                <div className={styles.title}>基本职业生涯</div>
                <div className={styles.resumeWrapper}>
                  <MarkdownContainer content={candidate.profile_doc} />
                </div>
              </div>
            </>
          ) : (
            <Empty style={{ marginTop: 200 }} description={t("pending")} />
          )}
        </div>
      )}
      {status === "goals" &&
        (candidate?.goals_doc ? (
          <div style={{ margin: 20, overflow: "auto" }}>
            <div>
              <div className={styles.title}>兴趣意向</div>
              <EditableText
                title="目前正在探索的领域，或者感兴趣的主题？"
                value={candidate.interests}
                onChange={(doc) => updateProfile({ interests: doc })}
              />

              <EditableText
                title="想通过networking来解决什么问题"
                value={candidate.targets}
                onChange={(doc) => updateProfile({ targets: doc })}
              />
            </div>

            <div style={{ marginTop: 20 }}>
              <div className={styles.title}>具体感兴趣的人物画像</div>
              <div className={styles.resumeWrapper}>
                <MarkdownContainer content={candidate.goals_doc} />
              </div>
            </div>
          </div>
        ) : (
          <Empty style={{ marginTop: 200 }} description={t("pending")} />
        ))}
    </div>
  );
};

export default NetworkProfile;
