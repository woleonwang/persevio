import { useEffect, useMemo, useState } from "react";
import { Button, Drawer, message, Table, Tag } from "antd";
import { ColumnsType } from "antd/es/table";
import classnames from "classnames";
import { Download, Get, Post } from "@/utils/request";

import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { deleteQuery, getQuery, parseJSON, updateQuery } from "@/utils";
import dayjs from "dayjs";
import Empty from "@/components/Empty";
import MarkdownContainer from "../MarkdownContainer";
import EditableMarkdown from "../EditableMarkdown";
import ChatMessagePreview from "../ChatMessagePreview";

interface IProps {
  jobId?: number;
  hideHeader?: boolean;
}

type TTalentItem = TTalent & {
  current_job_title: string;
  current_company: string;
  current_compensation: string;
  visa: string;
  interviews: TInterview[];
};

type TAdminJobApplyItem = IJobApplyListItem & {
  candidate: ICandidateSettings;
};

type TAdminTalentItem = {
  talent?: TTalentItem;
  linkedinProfile?: TLinkedinProfile;
  jobApply?: TAdminJobApplyItem;
  created_at: string;
};

interface IJobApplyListItemForAdmin extends IJobApplyListItem {
  job: {
    name: string;
    company: {
      name: string;
    };
  };
  candidate: {
    name: string;
    pre_register_info: string;
  };
}
const AdminTalents = (props: IProps) => {
  const { jobId, hideHeader = false } = props;
  const [linkedinProfiles, setLinkedinProfiles] = useState<TLinkedinProfile[]>(
    []
  );
  const [jobApplies, setJobApplies] = useState<TAdminJobApplyItem[]>([]);
  const [talents, setTalents] = useState<TTalentItem[]>([]);

  const [selectedJobApplyId, setSelectedJobApplyId] = useState<number>();
  const [jobApply, setJobApply] = useState<IJobApplyListItemForAdmin>();
  const [selectedLinkedinProfile, setSelectedLinkedinProfile] =
    useState<TLinkedinProfile>();
  const [jobApplyDetailDrawerOpen, setJobApplyDetailDrawerOpen] =
    useState(false);
  const [jobApplyResumeDrawerOpen, setJobApplyResumeDrawerOpen] =
    useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [recommendReport, setRecommendReport] = useState("");
  const [chatMessages, setChatMessages] = useState<TMessageFromApi[]>([]);
  const [isEditingRecommendReport, setIsEditingRecommendReport] =
    useState(false);

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_talents.${key}`);

  useEffect(() => {
    fetchTalents();
  }, [jobId]);

  useEffect(() => {
    if (selectedJobApplyId) {
      updateQuery("open-id", selectedJobApplyId.toString());
      setJobApplyDetailDrawerOpen(true);
      fetchJobApply();
    }
  }, [selectedJobApplyId]);

  useEffect(() => {
    if (selectedLinkedinProfile) {
      updateQuery("open-profile-id", selectedLinkedinProfile.id.toString());
    }
  }, [selectedLinkedinProfile]);

  const talentsList: TAdminTalentItem[] = useMemo(() => {
    // 1. 只有 profile
    // 2. 有 profile + jobApply, 刚注册
    // 3. 有 profile + jobApply + talent，已投递
    // 4. 只有 jobApply， 自己注册
    // 5. jobApply + talent 自己注册，已投递
    const result: TAdminTalentItem[] = [];
    linkedinProfiles.forEach((linkedinProfile) => {
      if (linkedinProfile.candidate_id) {
        // 2 + 3
        const jobApply = jobApplies.find(
          (jobApply) => jobApply.candidate_id === linkedinProfile.candidate_id
        );
        const talent = talents.find(
          (talent) => talent.candidate_id === linkedinProfile.candidate_id
        );
        result.push({
          linkedinProfile,
          jobApply,
          talent,
          created_at: jobApply?.created_at || linkedinProfile.created_at,
        });
      } else {
        // 1
        result.push({
          linkedinProfile,
          created_at: linkedinProfile.created_at,
        });
      }
    });

    jobApplies
      .filter(
        (jobApply) =>
          !linkedinProfiles.find(
            (linkedinProfile) =>
              linkedinProfile.candidate_id === jobApply.candidate_id
          )
      )
      .forEach((jobApply) => {
        result.push({
          jobApply,
          talent: talents.find(
            (talent) => talent.candidate_id === jobApply.candidate_id
          ),
          created_at: jobApply.created_at,
        });
      });

    return result.sort((a, b) => {
      return dayjs(b.created_at).diff(dayjs(a.created_at));
    });
  }, [jobApplies, linkedinProfiles, talents]);

  const fetchTalents = async () => {
    const { code, data } = await Get<{
      linkedin_profiles: TLinkedinProfile[];
      job_applies: TAdminJobApplyItem[];
      talents: TTalent[];
    }>(`/api/admin/scoped_talents?job_id=${jobId ?? ""}`);

    if (code === 0) {
      setLinkedinProfiles(data.linkedin_profiles);
      setJobApplies(data.job_applies);
      setTalents(
        data.talents.map((talent) => {
          return {
            ...talent,
            ...parseJSON(talent.basic_info_json),
          };
        })
      );

      const openId = getQuery("open-id");
      if (openId) {
        setSelectedJobApplyId(parseInt(openId));
      }

      const openProfileId = getQuery("open-profile-id");
      if (openProfileId) {
        console.log(
          data.linkedin_profiles.find(
            (linkedinProfile) => linkedinProfile.id === parseInt(openProfileId)
          )
        );
        setSelectedLinkedinProfile(
          data.linkedin_profiles.find(
            (linkedinProfile) => linkedinProfile.id === parseInt(openProfileId)
          )
        );
      }
    }
  };

  const fetchJobApply = async () => {
    const { code, data } = await Get(
      `/api/admin/job_applies/${selectedJobApplyId}`
    );

    if (code === 0) {
      setJd(data.jd);
      setResume(data.resume);
      setRecommendReport(data.job_apply.evaluate_result);
      setChatMessages(data.messages ?? []);
      setJobApply(data.job_apply);
    }
  };

  const feedback = async (action: "accept" | "reject") => {
    const { code } = await Post(
      `/api/admin/job_applies/${selectedJobApplyId}/feedback/${action}`
    );
    if (code === 0) {
      message.success("操作成功");
      fetchTalents();
      closeDrawer();
    } else {
      message.error("操作失败");
    }
  };

  const downloadResume = async () => {
    Download(
      `/api/admin/job_applies/${selectedJobApplyId}/download_resume`,
      `${jobApply?.candidate?.name ?? "Candidate"}`
    );
  };
  const closeDrawer = () => {
    setJobApplyDetailDrawerOpen(false);
    setSelectedJobApplyId(undefined);
    deleteQuery("open-id");
  };

  const columns: ColumnsType<TAdminTalentItem> = [
    {
      title: t("candidate_name"),
      dataIndex: "name",
      render: (_: string, record: TAdminTalentItem) => {
        return (
          record.jobApply?.candidate?.name ||
          record.linkedinProfile?.name ||
          "-"
        );
      },
      width: 150,
    },
    {
      title: t("current_job_title"),
      dataIndex: "current_job_title",
      width: 150,
      render: (_: string, record: TAdminTalentItem) => {
        return record.talent?.current_job_title || "-";
      },
    },
    {
      title: t("current_company"),
      dataIndex: "current_company",
      width: 150,
      render: (_: string, record: TAdminTalentItem) => {
        return record.talent?.current_company || "-";
      },
    },
    {
      title: t("current_compensation"),
      dataIndex: "current_compensation",
      width: 150,
      render: (_: string, record: TAdminTalentItem) => {
        return record.talent?.current_compensation || "-";
      },
    },
    {
      title: t("visa"),
      dataIndex: "visa",
      width: 150,
      render: (_: string, record: TAdminTalentItem) => {
        return record.talent?.visa || "-";
      },
    },
    {
      title: t("received_on"),
      dataIndex: "created_at",
      render: (created_at: string) => {
        return dayjs(created_at).format("YYYY-MM-DD HH:mm:ss");
      },
      width: 150,
    },
    {
      title: t("screening_status"),
      dataIndex: "status",
      render: (_: any, _record: TAdminTalentItem) => {
        // if (status === "accepted") {
        //   if (!record.interviews?.length) {
        //     return <Tag color="green">{t("status_pending_interview")}</Tag>;
        //   } else if (!record.interviews[0].scheduled_at) {
        //     return (
        //       <Tag color="green">{t("status_pending_candidate_confirm")}</Tag>
        //     );
        //   } else {
        //     return <Tag color="green">{t("status_interview_scheduled")}</Tag>;
        //   }
        // }
        // if (status === "rejected") {
        //   return (
        //     <Tooltip title={record.feedback}>
        //       <Tag color="red">{t("status_rejected")}</Tag>
        //     </Tooltip>
        //   );
        // }
        return <Tag color="default">{t("status_unfiltered")}</Tag>;
      },
      width: 150,
    },
    {
      title: t("schedule_time"),
      dataIndex: "scheduled_at",
      render: (_: string, record: TAdminTalentItem) => {
        const scheduled_at = record.talent?.interviews?.[0]?.scheduled_at;
        return scheduled_at
          ? dayjs(scheduled_at).format("YYYY-MM-DD HH:mm")
          : "-";
      },
      width: 150,
    },
  ].map((item) => {
    return {
      ...item,
      render:
        item.render ??
        ((data) => {
          return data ?? "--";
        }),
    };
  });

  return (
    <div className={styles.container}>
      {!hideHeader && <h3 className={styles.header}>候选人</h3>}
      <div className={styles.tableContainer}>
        <Table<TAdminTalentItem>
          scroll={{ x: "max-content" }}
          columns={columns}
          rowKey="id"
          dataSource={talentsList}
          pagination={{
            pageSize: 10,
          }}
          locale={{
            emptyText: <Empty style={{ margin: "60px 0" }} />,
          }}
          onRow={(record) => {
            return {
              onClick: () => {
                if (record.jobApply) {
                  setSelectedJobApplyId(record.jobApply.id);
                } else {
                  setSelectedLinkedinProfile(record.linkedinProfile);
                }
              },
            };
          }}
        />
      </div>

      <Drawer
        title={`${jobApply?.job.name} - ${jobApply?.candidate.name}`}
        open={jobApplyDetailDrawerOpen}
        onClose={() => closeDrawer()}
        width={1500}
      >
        {jobApply && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              height: "100%",
            }}
          >
            <div style={{ display: "flex", flex: "none" }}>
              {jobApply.status === "INITIAL" && (
                <>
                  <Button type="primary" onClick={() => feedback("accept")}>
                    Accept
                  </Button>
                  <Button
                    type="primary"
                    danger
                    onClick={() => feedback("reject")}
                    style={{ marginLeft: 12 }}
                  >
                    Reject
                  </Button>
                </>
              )}
              {jobApply.status === "ACCEPTED" && (
                <div className={classnames(styles.status, styles.accepted)}>
                  Accepted
                </div>
              )}
              {jobApply.status === "REJECTED" && (
                <div className={classnames(styles.status, styles.rejected)}>
                  Rejected
                </div>
              )}
            </div>
            <div className={styles.jobApplyDetail}>
              <div className={styles.jobApplyPanel}>
                <div className={styles.jobApplyPanelTitle}>JD</div>
                <div style={{ flex: "auto", overflow: "auto" }}>
                  <MarkdownContainer content={jd} />
                </div>
              </div>
              <div
                className={styles.jobApplyPanel}
                style={{ borderLeft: "1px solid #f2f2f2" }}
              >
                <div
                  className={styles.jobApplyPanelTitle}
                  style={{ marginBottom: 12 }}
                >
                  <div>推荐报告</div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <Button
                      type="primary"
                      onClick={() => setIsEditingRecommendReport(true)}
                    >
                      编辑报告
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => setJobApplyResumeDrawerOpen(true)}
                    >
                      查看简历
                    </Button>
                    <Button type="primary" onClick={() => downloadResume()}>
                      下载简历
                    </Button>
                    {chatMessages.length > 0 && (
                      <Button
                        type="primary"
                        onClick={() => setChatDrawerOpen(true)}
                      >
                        查看对话
                      </Button>
                    )}
                  </div>
                </div>
                {recommendReport || isEditingRecommendReport ? (
                  <EditableMarkdown
                    style={{ padding: 20 }}
                    value={recommendReport}
                    isEditing={isEditingRecommendReport}
                    onSubmit={async (value) => {
                      const { code } = await Post(
                        `/api/admin/job_applies/${selectedJobApplyId}`,
                        {
                          evaluate_result: value,
                        }
                      );

                      if (code === 0) {
                        message.success("操作成功");
                        fetchJobApply();
                        setIsEditingRecommendReport(false);
                      } else {
                        message.error("操作失败");
                      }
                    }}
                    onCancel={() => setIsEditingRecommendReport(false)}
                  />
                ) : (
                  <div>暂无报告</div>
                )}
              </div>
            </div>

            <Drawer
              title="简历"
              open={jobApplyResumeDrawerOpen}
              onClose={() => setJobApplyResumeDrawerOpen(false)}
              width={800}
            >
              <MarkdownContainer content={resume} />
            </Drawer>

            <Drawer
              title="对话"
              open={chatDrawerOpen}
              onClose={() => setChatDrawerOpen(false)}
              width={800}
              destroyOnClose
            >
              <ChatMessagePreview messages={chatMessages} role="admin" />
            </Drawer>
          </div>
        )}
      </Drawer>

      <Drawer
        title={selectedLinkedinProfile?.name}
        open={!!selectedLinkedinProfile}
        onClose={() => {
          setSelectedLinkedinProfile(undefined);
          deleteQuery("open-profile-id");
        }}
        width={1500}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            height: "100%",
          }}
        >
          <div className={styles.jobApplyDetail}>
            <div className={styles.jobApplyPanel}>
              <div className={styles.jobApplyPanelTitle}>简历</div>
              <div
                className={styles.jobApplyPanelContent}
                style={{ flex: "auto", overflow: "auto" }}
              >
                <MarkdownContainer
                  content={selectedLinkedinProfile?.profile_doc ?? ""}
                />
              </div>
            </div>
            <div
              className={styles.jobApplyPanel}
              style={{ borderLeft: "1px solid #f2f2f2" }}
            >
              <div className={styles.jobApplyPanelTitle}>Outreach Message</div>
              <div
                className={styles.jobApplyPanelContent}
                style={{ flex: "auto", overflow: "auto" }}
              >
                {selectedLinkedinProfile?.outreach_message_doc ? (
                  <MarkdownContainer
                    content={
                      selectedLinkedinProfile?.outreach_message_doc ?? ""
                    }
                  />
                ) : (
                  <Empty style={{ margin: "60px 0" }} description="未生成" />
                )}
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default AdminTalents;
