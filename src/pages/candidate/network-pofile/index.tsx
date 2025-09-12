import { useEffect, useState } from "react";
import { Get, Post } from "@/utils/request";

import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { Empty, message, Tabs, Upload, Input, Button } from "antd";
import MarkdownContainer from "@/components/MarkdownContainer";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";

type TTabKey = "profile" | "goals";
const NetworkProfile = () => {
  const [candidate, setCandidate] = useState<ICandidateSettings>();
  const [status, setStatus] = useState<TTabKey>("profile");
  const [editInterests, setEditInterests] = useState(false);
  const [editGoals, setEditGoals] = useState(false);
  const [interests, setInterests] = useState("");
  const [goals, setGoals] = useState("");

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`candidate_resume.${key}`);

  useEffect(() => {
    fetchCandidate();
  }, []);

  const fetchCandidate = async () => {
    const { code, data } = await Get("/api/candidate/settings");
    if (code === 0) {
      setCandidate(data.candidate);
      setInterests(data.candidate.interests);
      setGoals(data.candidate.targets);
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
                      const { code } = await Post(
                        "/api/candidate/network/profile",
                        {
                          avatar: info.file.response.data.avatar,
                        }
                      );
                      if (code === 0) {
                        fetchCandidate();
                      } else {
                        message.error("上传失败");
                      }
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
              <div className={styles.subTitle}>
                目前正在探索的领域，或者感兴趣的主题？
                {!editInterests && (
                  <EditOutlined
                    style={{ marginLeft: 10 }}
                    onClick={() => setEditInterests(!editInterests)}
                  />
                )}
              </div>
              {editInterests ? (
                <>
                  <Input.TextArea
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    rows={8}
                  />
                  <Button
                    type="primary"
                    onClick={() => setEditInterests(false)}
                  >
                    保存
                  </Button>
                </>
              ) : (
                <div className={styles.content}>{interests}</div>
              )}

              <div className={styles.subTitle}>
                想通过networking来解决什么问题？{" "}
                {!editGoals && (
                  <EditOutlined
                    style={{ marginLeft: 10 }}
                    onClick={() => setEditGoals(!editGoals)}
                  />
                )}
              </div>
              {editGoals ? (
                <Input.TextArea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  rows={8}
                />
              ) : (
                <div className={styles.content}>{goals}</div>
              )}
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
