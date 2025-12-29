import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  message,
  Modal,
  Select,
  Table,
} from "antd";
import { ColumnsType } from "antd/es/table";
import classnames from "classnames";
import { Download, Get, Post } from "@/utils/request";

import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import {
  deleteQuery,
  getQuery,
  isTempAccount,
  parseJSON,
  updateQuery,
} from "@/utils";
import dayjs from "dayjs";
import Empty from "@/components/Empty";
import MarkdownContainer from "../MarkdownContainer";
import EditableMarkdown from "../EditableMarkdown";
import ChatMessagePreview from "../ChatMessagePreview";

interface IProps {
  jobId?: number;
  hideHeader?: boolean;
  filterParams?: {
    talentOrJobName?: string;
    approveStatus?: TApproveStatus;
  };
}

type TTalentItem = TTalent & {
  current_job_title: string;
  current_company: string;
  current_compensation: string;
  visa: string;
};

type TAdminJobApplyItem = {
  id: number;
  candidate_id: number;
  job_id: number;
  status: TJobListStatus;
  created_at: string;
  interview_finished_at: string;
  deliveried_at: string;
  interview_mode: "ai" | "human" | "whatsapp";
  candidate: ICandidateSettings;
  job: {
    id: number;
    name: string;
    company: {
      id: number;
      name: string;
    };
  };
};

type TAdminTalentItem = {
  talent?: TTalentItem;
  linkedinProfile?: TLinkedinProfile;
  jobApply?: TAdminJobApplyItem;
  created_at: string;
};

interface IJobApplyForAdmin extends IJobApply {
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

type TAccountStatus =
  | "evaluated"
  | "message_generated"
  | "message_sent"
  | "message_read"
  | "registered"
  | "resume_uploaded"
  | "email_binded";

export type TApproveStatus =
  | "initialize"
  | "interviewing"
  | "interview_finished"
  | "hunter_rejected"
  | "hunter_accepted"
  | "staff_rejected"
  | "staff_accepted"
  | "interview_scheduled"
  | "interview_confirmed";

interface IAdminTalentShareChain {
  id: number;
  name: string;
  email: string;
  phone: string;
}
const AdminTalents = (props: IProps) => {
  const { jobId, hideHeader = false, filterParams } = props;
  const [linkedinProfiles, setLinkedinProfiles] = useState<TLinkedinProfile[]>(
    []
  );
  const [jobApplies, setJobApplies] = useState<TAdminJobApplyItem[]>([]);
  const [talents, setTalents] = useState<TTalentItem[]>([]);

  const [selectedJobApplyId, setSelectedJobApplyId] = useState<number>();
  const [jobApply, setJobApply] = useState<IJobApplyForAdmin>();
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
  const [talent, setTalent] = useState<TTalent>();

  const [chatMessages, setChatMessages] = useState<TMessageFromApi[]>([]);
  const [isEditingRecommendReport, setIsEditingRecommendReport] =
    useState(false);
  const [selectedTalent, setSelectedTalent] = useState<TTalentItem>();
  const [hireStatusModalOpen, setHireStatusModalOpen] = useState(false);
  const [shareChainModalOpen, setShareChainModalOpen] = useState(false);
  const [shareChainCandidates, setShareChainCandidates] = useState<
    IAdminTalentShareChain[]
  >([]);

  const [form] = Form.useForm();

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`admin_talents.${key}`);

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

  useEffect(() => {
    if (shareChainModalOpen && selectedTalent) {
      fetchShareChain();
    }
  }, [shareChainModalOpen]);

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
        setSelectedLinkedinProfile(
          data.linkedin_profiles.find(
            (linkedinProfile) => linkedinProfile.id === parseInt(openProfileId)
          )
        );
      }
    }
  };

  const fetchShareChain = async () => {
    const { code, data } = await Get(
      `/api/admin/talents/${selectedTalent?.id}/share_chain`
    );

    if (code === 0) {
      setShareChainCandidates(
        (data.candidates ?? []).map((candidate: ICandidateSettings) => {
          const preRegisterInfo = parseJSON(
            candidate.pre_register_info ?? "{}"
          );
          return {
            id: candidate.id,
            name: candidate.name || preRegisterInfo.name,
            email: candidate.email,
            phone: `${preRegisterInfo.country_code ?? ""} ${preRegisterInfo.phone ?? ""
              }`,
          };
        })
      );
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
      setTalent(data.talent);
    }
  };

  const getAccountStatus = (talent: TAdminTalentItem): TAccountStatus => {
    const candidate = talent.jobApply?.candidate;
    const linkedinProfile = talent.linkedinProfile;
    if (candidate) {
      if (!isTempAccount(candidate)) {
        return "email_binded";
      }

      if (candidate.resume_content) {
        return "resume_uploaded";
      }

      return "registered";
    } else if (linkedinProfile) {
      if (linkedinProfile.message_read_at) {
        return "message_read";
      }
      if (linkedinProfile.message_sent_at) {
        return "message_sent";
      }
      if (linkedinProfile.outreach_message_doc) {
        return "message_generated";
      }
    }
    return "evaluated";
  };

  const getApproveStatus = (talentItem: TAdminTalentItem): TApproveStatus => {
    const jobApply = talentItem.jobApply;
    const talent = talentItem.talent;
    const interview = talent?.interviews?.[0];

    if (interview) {
      if (interview.scheduled_at) {
        return "interview_confirmed";
      } else {
        return "interview_scheduled";
      }
    }

    if (talent) {
      if (talent.status === "accepted") {
        return "staff_accepted";
      } else if (talent.status === "rejected") {
        return "staff_rejected";
      } else {
        return "hunter_accepted";
      }
    }

    if (jobApply) {
      if (jobApply.status === "ACCEPTED") {
        return "hunter_accepted";
      } else if (jobApply.status === "REJECTED") {
        return "hunter_rejected";
      } else if (jobApply.deliveried_at) {
        return "interview_finished";
      } else {
        return "interviewing";
      }
    }

    return "initialize";
  };

  const feedback = async (action: "accept" | "reject") => {
    const { code } = await Post(
      `/api/admin/job_applies/${selectedJobApplyId}/feedback/${action}`
    );
    if (code === 0) {
      message.success(t("operationSuccess"));
      fetchTalents();
      closeDrawer();
    } else {
      message.error(t("operationFailed"));
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

  const getName = (record: TAdminTalentItem): string => {
    return (
      record.jobApply?.candidate?.name ||
      (() => {
        try {
          const info = JSON.parse(
            record.jobApply?.candidate?.pre_register_info ?? "{}"
          );
          return info.name;
        } catch {
          return "";
        }
      })() ||
      record.linkedinProfile?.name
    );
  };

  const getJobName = (record: TAdminTalentItem): string => {
    return (
      record.jobApply?.job?.name || record.linkedinProfile?.job?.name || ""
    );
  };

  const getCompanyName = (record: TAdminTalentItem): string => {
    return (
      record.jobApply?.job?.company?.name ||
      record.linkedinProfile?.job?.company?.name ||
      ""
    );
  };

  const columns: ColumnsType<TAdminTalentItem> = [
    {
      title: t("candidate_name"),
      dataIndex: "name",
      render: (_: string, record: TAdminTalentItem) => {
        return getName(record);
      },
      width: 150,
      fixed: "left" as const,
    },
    {
      title: t("company_name"),
      dataIndex: "company_name",
      render: (_: string, record: TAdminTalentItem) => {
        return getCompanyName(record) || "-";
      },
      width: 150,
    },
    {
      title: t("job_name"),
      dataIndex: "job_name",
      width: 150,
      render: (_: string, record: TAdminTalentItem) => {
        return getJobName(record) || "-";
      },
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
      title: t("account_status"),
      dataIndex: "status",
      render: (_: any, _record: TAdminTalentItem) => {
        const status = getAccountStatus(_record);
        return t(`account_status_options.${status}`);
      },
      width: 150,
    },
    {
      title: t("screening_status"),
      dataIndex: "status",
      render: (_: any, _record: TAdminTalentItem) => {
        const status = getApproveStatus(_record);
        return t(`screening_status_options.${status}`);
      },
      width: 150,
    },
    {
      title: t("interviewMode"),
      dataIndex: "interview_mode",
      render: (_: string, record: TAdminTalentItem) => {
        const interviewMode = record.jobApply?.interview_mode;
        if (!interviewMode) {
          return "-";
        }
        return originalT(`job_apply_mode_options.${interviewMode}`);
      },
    },
    {
      title: t("actions"),
      key: "actions",
      width: 100,
      render: (_: string, record: TAdminTalentItem) => {
        const talent = record.talent;

        return (
          <>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                if (record.jobApply) {
                  setSelectedJobApplyId(record.jobApply.id);
                } else {
                  setSelectedLinkedinProfile(record.linkedinProfile);
                }
              }}
            >
              {t("viewDetails")}
            </Button>
            {talent?.status === "accepted" && (
              <Button
                variant="outlined"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTalent(talent);
                  setHireStatusModalOpen(true);
                  form.setFieldsValue({
                    hire_status: talent.hire_status || "not_hired",
                  });
                }}
                style={{ marginTop: 4 }}
              >
                {t("editHireStatus")}
              </Button>
            )}
            {!!talent?.share_token_id && (
              <Button
                variant="outlined"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTalent(talent);
                  setShareChainModalOpen(true);
                }}
                style={{ marginTop: 4 }}
              >
                {t("viewReferralLinkDetails")}
              </Button>
            )}
          </>
        );
      },
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

  const talentsList: TAdminTalentItem[] = useMemo(() => {
    // 1. 只有 profile
    // 2. 有 profile + jobApply, 刚注册
    // 3. 有 profile + jobApply + talent，已投递
    // 4. 只有 jobApply， 自己注册
    // 5. jobApply + talent 自己注册，已投递
    let result: TAdminTalentItem[] = [];
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

    if (filterParams?.talentOrJobName) {
      result = result.filter((item) => {
        return (
          getName(item).includes(filterParams.talentOrJobName ?? "") ||
          getJobName(item).includes(filterParams.talentOrJobName ?? "")
        );
      });
    }

    if (filterParams?.approveStatus) {
      result = result.filter((item) => {
        return getApproveStatus(item) === filterParams.approveStatus;
      });
    }

    return result.sort((a, b) => {
      return dayjs(b.created_at).diff(dayjs(a.created_at));
    });
  }, [jobApplies, linkedinProfiles, talents, filterParams]);

  return (
    <div className={styles.container}>
      {!hideHeader && <h3 className={styles.header}>{t("header")}</h3>}
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
                    {t("drawer.accept")}
                  </Button>
                  <Button
                    type="primary"
                    danger
                    onClick={() => feedback("reject")}
                    style={{ marginLeft: 12 }}
                  >
                    {t("drawer.reject")}
                  </Button>
                </>
              )}
              {jobApply.status === "ACCEPTED" && (
                <div className={classnames(styles.status, styles.accepted)}>
                  {t("drawer.accepted")}
                </div>
              )}
              {jobApply.status === "REJECTED" && (
                <div className={classnames(styles.status, styles.rejected)}>
                  {t("drawer.rejected")}
                </div>
              )}
            </div>
            <div className={styles.jobApplyDetail}>
              <div className={styles.jobApplyPanel}>
                <div className={styles.jobApplyPanelTitle}>
                  {t("drawer.basicInfo")}
                </div>
                <div>
                  <div className={styles.jobApplyPanelItem}>
                    <div className={styles.jobApplyPanelItemLabel}>
                      {t("drawer.interviewModeLabel")}
                    </div>
                    <div>{jobApply.interview_mode || "-"}</div>
                  </div>
                  <div className={styles.jobApplyPanelItem}>
                    <div className={styles.jobApplyPanelItemLabel}>
                      {t("drawer.selectHumanReasonLabel")}
                    </div>
                    <div>
                      {jobApply.switch_mode_reason
                        ? (() => {
                          const reason = parseJSON(
                            jobApply.switch_mode_reason
                          );
                          return reason?.reasons
                            ?.map((item: string) => {
                              return item === "others"
                                ? reason.other_reason
                                : originalT(
                                  `switch_mode_reason_options.${item}`
                                );
                            })
                            .join(", ");
                        })()
                        : "-"}
                    </div>
                  </div>
                  <div className={styles.jobApplyPanelItem}>
                    <div className={styles.jobApplyPanelItemLabel}>
                      {t("drawer.employerRejectReasonLabel")}
                    </div>
                    <div>{talent?.feedback || "-"}</div>
                  </div>
                  <div className={styles.jobApplyPanelItem}>
                    <div className={styles.jobApplyPanelItemLabel}>
                      {t("drawer.employerInterviewModeLabel")}
                    </div>
                    <div>
                      {talent?.interviews?.[0]?.mode
                        ? originalT(
                          `interview_form.mode_${talent.interviews[0].mode}`
                        )
                        : "-"}
                    </div>
                  </div>
                  <div className={styles.jobApplyPanelItem}>
                    <div className={styles.jobApplyPanelItemLabel}>
                      {t("drawer.employerInterviewTimeLabel")}
                    </div>
                    <div>
                      {talent?.interviews?.[0]?.scheduled_at
                        ? dayjs(talent.interviews[0].scheduled_at).format(
                          "YYYY-MM-DD HH:mm"
                        )
                        : "-"}
                    </div>
                  </div>
                  <div className={styles.jobApplyPanelItem}>
                    <div className={styles.jobApplyPanelItemLabel}>
                      {t("drawer.interviewTypeLabel")}
                    </div>
                    <div>
                      {talent?.interviews?.[0]?.interview_type
                        ? originalT(
                          `interview_form.type_${talent.interviews[0].interview_type}`
                        )
                        : "-"}
                    </div>
                  </div>
                </div>
                <div
                  className={styles.jobApplyPanelTitle}
                  style={{ marginTop: 24 }}
                >
                  {t("drawer.jd")}
                </div>
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
                  <div>{t("drawer.recommendReport")}</div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <Button
                      type="primary"
                      onClick={() => setIsEditingRecommendReport(true)}
                    >
                      {t("drawer.editReport")}
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => setJobApplyResumeDrawerOpen(true)}
                    >
                      {t("drawer.viewResume")}
                    </Button>
                    <Button type="primary" onClick={() => downloadResume()}>
                      {t("drawer.downloadResume")}
                    </Button>
                    {chatMessages.length > 0 && (
                      <Button
                        type="primary"
                        onClick={() => setChatDrawerOpen(true)}
                      >
                        {t("drawer.viewChat")}
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
                        message.success(t("operationSuccess"));
                        fetchJobApply();
                        setIsEditingRecommendReport(false);
                      } else {
                        message.error(t("operationFailed"));
                      }
                    }}
                    onCancel={() => setIsEditingRecommendReport(false)}
                  />
                ) : (
                  <div>{t("drawer.noReport")}</div>
                )}
              </div>
            </div>

            <Drawer
              title={t("drawer.resume")}
              open={jobApplyResumeDrawerOpen}
              onClose={() => setJobApplyResumeDrawerOpen(false)}
              width={800}
            >
              <MarkdownContainer content={resume} />
            </Drawer>

            <Drawer
              title={t("drawer.chat")}
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
              <div className={styles.jobApplyPanelTitle}>
                {t("drawer.resume")}
              </div>
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
              <div className={styles.jobApplyPanelTitle}>
                {t("drawer.outreachMessage")}
              </div>
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
                  <Empty
                    style={{ margin: "60px 0" }}
                    description={t("drawer.notGenerated")}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </Drawer>

      <Modal
        open={hireStatusModalOpen}
        title={t("hireStatusModal.title")}
        cancelText={t("hireStatusModal.cancel")}
        onCancel={() => {
          setHireStatusModalOpen(false);
        }}
        onOk={async () => {
          form.validateFields().then(async (values) => {
            const { code } = await Post(
              `/api/admin/talents/${selectedTalent?.id}`,
              {
                hire_status: values.hire_status,
              }
            );

            if (code === 0) {
              message.success(t("hireStatusModal.updateSuccess"));
              fetchTalents();
              setHireStatusModalOpen(false);
            } else {
              message.error(t("hireStatusModal.updateFailed"));
            }
          });
        }}
      >
        <Form
          form={form}
          layout="vertical"
          className={styles.bonusPoolModalForm}
        >
          <div className={styles.modalDescription}>
            {originalT("admin_talents.hireStatusModal.description", {
              bonusPool: selectedTalent?.job?.bonus_pool,
            })}
          </div>
          <Form.Item
            label={t("hireStatusModal.label")}
            name="hire_status"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: "hired", label: t("hireStatusModal.hired") },
                {
                  value: "not_hired",
                  label: t("hireStatusModal.notHired"),
                },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={shareChainModalOpen}
        onCancel={() => setShareChainModalOpen(false)}
        title={t("referralChainModal.title")}
        cancelButtonProps={{
          style: {
            display: "none",
          },
        }}
        onOk={async () => {
          setShareChainModalOpen(false);
        }}
        width={740}
        centered
      >
        <div>
          {shareChainCandidates.map((candidate, index) => {
            return (
              <div key={candidate.id} className={styles.shareChainCandidate}>
                <div className={styles.index}>{index + 1}</div>
                <div className={styles.candidateInfo}>
                  <div className={styles.candidateName}>{candidate.name}</div>
                  <div className={styles.candidateContactInfo}>
                    <div>{candidate.email}</div>
                    <div>{candidate.phone}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

export default AdminTalents;
