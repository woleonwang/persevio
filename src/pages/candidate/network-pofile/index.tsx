import { useEffect, useState } from "react";
import { Get, Post } from "@/utils/request";

import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { Empty, message, Tabs, Upload } from "antd";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import EditableTargets from "./components/EditableTargets";
import EditableMarkdown from "@/components/EditableMarkdown";

type TTabKey = "profile" | "goals";
const NetworkProfile = () => {
  const [candidate, setCandidate] = useState<ICandidateSettings>();
  const [status, setStatus] = useState<TTabKey>("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingGoals, setIsEditingGoals] = useState(false);

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
    values: Partial<
      Record<
        "targets" | "avatar" | "profile_doc" | "goals_doc",
        string | string[]
      >
    >
  ) => {
    const { code } = await Post("/api/candidate/network/profile", values);
    if (code === 0) {
      fetchCandidate();
      setIsEditingProfile(false);
      setIsEditingGoals(false);
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
                <div className={styles.title}>
                  基本职业生涯
                  {!isEditingProfile && (
                    <EditOutlined
                      style={{ marginLeft: 10 }}
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                    />
                  )}
                </div>
                <div className={styles.resumeWrapper}>
                  <EditableMarkdown
                    value={candidate.profile_doc}
                    isEditing={isEditingProfile}
                    onSubmit={(doc) => updateProfile({ profile_doc: doc })}
                    onCancel={() => setIsEditingProfile(false)}
                  />
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
              <EditableTargets
                value={candidate.targets}
                onChange={(doc) => updateProfile({ targets: doc })}
              />
            </div>

            <div style={{ marginTop: 20 }}>
              <div className={styles.title}>
                具体感兴趣的人物画像
                {!isEditingGoals && (
                  <EditOutlined
                    style={{ marginLeft: 10 }}
                    onClick={() => setIsEditingGoals(!isEditingGoals)}
                  />
                )}
              </div>
              <div className={styles.resumeWrapper}>
                <EditableMarkdown
                  value={candidate.goals_doc}
                  isEditing={isEditingGoals}
                  onSubmit={(doc) => updateProfile({ goals_doc: doc })}
                  onCancel={() => setIsEditingGoals(false)}
                />
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
