import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Avatar, Button, Drawer, Input, message, Spin, Tooltip } from "antd";
import { v4 as uuidV4 } from "uuid";
import classnames from "classnames";
import { ShareAltOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import ChatRoom from "@/components/ChatRoom";
import { Get, Post } from "@/utils/request";
import MarkdownContainer from "@/components/MarkdownContainer";
import { copy, getQuery, parseJSON } from "@/utils";
import HomeHeader from "@/components/HomeHeader";

import styles from "./style.module.less";

import VionaAvatar from "@/assets/viona-avatar.png";
import dayjs from "dayjs";
import Icon from "@/components/Icon";
import Send from "@/assets/icons/send";

type TCompany = {
  logo: string;
  name: string;
  lang: string;
};

type TJobDescription = {
  company_introduction: string; // 公司简介，纯文本格式
  job_description: string; // 职位描述，支持 markdown 格式
  basic_requirements: string; // 基本要求，支持 markdown 格式
  bonus_points: string; // 加分项，支持 markdown 格式
};

type TJob = {
  name: string;
  company_id: number;
  updated_at: string;
  job_description: string;
  job_description_json: TJobDescription;
  screening_questions: string;
  basic_info: TJobBasicInfo;
  posted_at?: string;
};

type TStatus = "loading" | "success" | "error";

const JobsShow = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<TCompany>();
  const [candidate, setCandidate] = useState<ICandidateSettings>();
  const [job, setJob] = useState<TJob>();
  const [status, setStatus] = useState<TStatus>("loading");
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(true);

  const originalI18nRef = useRef<string>();

  const navigate = useNavigate();

  const isPreview = getQuery("preview") === "1";

  const { i18n, t: originalT } = useTranslation();
  const t = (key: string) => originalT(`jobs_show.${key}`);

  useEffect(() => {
    fetchCandidateSettings();
    fetchJob();
    storeShareToken();
    setTimeout(() => {
      setTooltipVisible(false);
    }, 5000);

    return () => {
      if (originalI18nRef.current) {
        i18n.changeLanguage(originalI18nRef.current);
      }
    };
  }, []);

  const sessionId = useMemo(() => {
    let value = localStorage.getItem("sessionId");
    if (!value) {
      value = uuidV4();
      localStorage.setItem("sessionId", value);
    }

    return value;
  }, []);

  const currentTime = useMemo(() => {
    return dayjs().format("YYYY/MM/DD HH:mm:ss");
  }, []);

  const fetchCandidateSettings = async () => {
    const { code, data } = await Get("/api/candidate/settings");
    if (code === 0) {
      setCandidate(data.candidate);
    }
  };

  const fetchJob = async () => {
    const { code, data } = await Get(`/api/public/jobs/${id}`);
    if (code === 0) {
      setCompany(data.company);
      setJob({
        ...data.job,
        basic_info: parseJSON(data.job.basic_info),
        job_description_json: parseJSON(data.job.job_description_json),
      });
      originalI18nRef.current = i18n.language;
      i18n.changeLanguage("en-US");
      setStatus("success");
    } else {
      setStatus("error");
    }
  };

  const storeShareToken = () => {
    const shareToken = getQuery("share_token");
    if (!shareToken) return;

    const shareTokenMapping = parseJSON(
      localStorage.getItem("share_token") ?? ""
    );
    if (id) {
      shareTokenMapping[id] = shareToken;
      localStorage.setItem("share_token", JSON.stringify(shareTokenMapping));
    }
  };

  if (status === "loading") {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin spinning />
      </div>
    );
  }

  const ApplyButton = (
    <Button
      type="primary"
      size="large"
      className={styles.applyButton}
      onClick={async () => {
        if (candidate) {
          if (candidate.email.endsWith("@persevio.ai") && !!candidate.job_id) {
            message.info("Please complete the registration process first");
            navigate(`/apply-job/${candidate.job_id}`);
            // 没走完注册流程
          } else {
            // 是否已经创建职位申请
            const { code, data } = await Get(
              `/api/candidate/jobs/${id}/job_apply`
            );
            if (code === 0) {
              navigate(`/candidate/job-applies/${data.job_apply.id}`);
            } else {
              const { code, data } = await Post("/api/candidate/job_applies", {
                job_id: parseInt(id as string),
              });
              if (code === 0) {
                navigate(`/candidate/job-applies/${data.job_apply_id}`);
              } else {
                message.error("Apply job failed");
              }
            }
          }
        } else {
          navigate(`/apply-job/${id}`);
        }
      }}
    >
      {t("apply_now")}
    </Button>
  );

  const ChatRoomArea = (
    <ChatRoom
      userRole="candidate"
      jobId={parseInt(id ?? "0")}
      sessionId={sessionId}
      enableFullscreen
    />
  );

  return (
    <HomeHeader
      className={styles.headerContainer}
      onlyLogo
      isPreview={isPreview}
    >
      {status === "success" && company && job && (
        <div className={styles.container}>
          {/* Banner 区域 */}
          <div className={styles.banner}>
            <div className={styles.bannerLeft}>
              {!!company.logo && (
                <img
                  src={
                    company.logo.startsWith("http")
                      ? company.logo
                      : `/api/logo/${company.logo}`
                  }
                  className={classnames(styles.logo, styles.desktopVisible)}
                  alt={company.name}
                />
              )}
              <div className={styles.companyInfo}>
                <div className={styles.jobTitleSection}>
                  <div className={styles.jobTitle}>{job.name}</div>
                  {!isPreview && (
                    <ShareAltOutlined
                      onClick={async () => {
                        await copy(window.location.href);
                        message.success(originalT("copied"));
                      }}
                      style={{ color: "#3682fe" }}
                    />
                  )}
                </div>

                <div className={styles.jobAttributes}>
                  {!!job.basic_info.location?.length && (
                    <div className={styles.attributeItem}>
                      <span className={styles.attributeIcon} />
                      <span>
                        {job.basic_info.location
                          .map((item) => item.city)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                  {!!job.basic_info.role_type && (
                    <div className={styles.attributeItem}>
                      <span className={styles.attributeIcon} />
                      <span>
                        {originalT(
                          `public_jobs.job_card.role_type.${job.basic_info.role_type}`
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.bannerRight}>
              <div
                className={classnames(
                  styles.companySection,
                  styles.mobileVisible
                )}
              >
                {!!company.logo && (
                  <img
                    src={
                      company.logo.startsWith("http")
                        ? company.logo
                        : `/api/logo/${company.logo}`
                    }
                    className={styles.logo}
                    alt={company.name}
                  />
                )}
                <div className={styles.companyName}>{company.name}</div>
              </div>

              {!isPreview && <div>{ApplyButton}</div>}
            </div>
          </div>

          <div
            className={classnames(styles.chatRoomSection, styles.mobileVisible)}
            onClickCapture={(e) => {
              e.stopPropagation();
              setChatModalVisible(true);
            }}
          >
            <div className={styles.messageBlock}>
              <Avatar
                className={styles.avatar}
                icon={<img src={VionaAvatar} />}
              />
              <div>
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: "bold" }}>
                    Viona
                  </span>
                  <span className={styles.timestamp}>{currentTime}</span>
                </div>
                <div className={styles.messageContainer}>
                  Hi, I'm Viona, your AI recruiter for this role. Have questions
                  about our company or this role? Ask me!
                </div>
              </div>
            </div>

            <div className={styles.inputArea}>
              <Input
                placeholder={originalT("chat.reply_viona")}
                style={{
                  width: "100%",
                  height: 44,
                  fontSize: 14,
                  borderRadius: 12,
                }}
              />

              <Button
                type="primary"
                icon={<Icon icon={<Send />} style={{ fontSize: 20 }} />}
                className={styles.sendButton}
              />
            </div>
          </div>

          {/* 主要内容区域：JD和聊天框水平布局 */}
          <div className={styles.mainContent}>
            <div className={styles.left}>
              {!!job.job_description_json.company_introduction && (
                <div className={styles.jobDescriptionSection}>
                  <div className={styles.sectionTitle}>
                    <div className={styles.greenBar}></div>
                    <span>{company.name}</span>
                  </div>
                  <div className={styles.sectionContent}>
                    <MarkdownContainer
                      content={job.job_description_json.company_introduction}
                    />
                  </div>
                </div>
              )}
              {!!job.job_description_json.job_description ? (
                <>
                  <div className={styles.jobDescriptionSection}>
                    <div className={styles.sectionTitle}>
                      <div className={styles.greenBar}></div>
                      <span>{t("job_description_section")}</span>
                    </div>
                    <div className={styles.sectionContent}>
                      <MarkdownContainer
                        content={job.job_description_json.job_description}
                      />
                    </div>
                  </div>

                  <div className={styles.jobDescriptionSection}>
                    <div className={styles.sectionTitle}>
                      <div className={styles.greenBar}></div>
                      <span>{t("basic_requirements")}</span>
                    </div>
                    <div className={styles.sectionContent}>
                      <MarkdownContainer
                        content={job.job_description_json.basic_requirements}
                      />
                    </div>
                  </div>

                  <div className={styles.jobDescriptionSection}>
                    <div className={styles.sectionTitle}>
                      <div className={styles.greenBar}></div>
                      <span>{t("bonus_points")}</span>
                    </div>
                    <div className={styles.sectionContent}>
                      <MarkdownContainer
                        content={job.job_description_json.bonus_points}
                      />
                    </div>
                  </div>

                  {!!job.posted_at && (
                    <div className={styles.postedAt}>
                      Updated at:{" "}
                      {dayjs(job.posted_at).format("YYYY/MM/DD HH:mm:ss")}
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <MarkdownContainer content={job.job_description} />
                </div>
              )}
            </div>

            <div className={classnames(styles.right, styles.desktopVisible)}>
              {ChatRoomArea}
            </div>
          </div>

          <Tooltip
            title={t("ask_me_anything")}
            placement="left"
            open={tooltipVisible}
            classNames={{ root: styles.mobileVisible }}
          >
            <div className={classnames(styles.vionaAvatar)}>
              <img
                src={VionaAvatar}
                style={{ width: 50, height: 50 }}
                onClick={() => setChatModalVisible(true)}
                className={styles.mobileVisible}
              />
            </div>
          </Tooltip>

          <Drawer
            title="Viona, your application copilot"
            open={chatModalVisible}
            onClose={() => setChatModalVisible(false)}
            placement="bottom"
            height="90vh"
            style={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
            className={classnames(styles.chatDrawer, styles.mobileVisible)}
          >
            {ChatRoomArea}
          </Drawer>

          {/* {!isPreview && (
            <Link className={styles.footer} to="/">
              {t("powered_by_persevio")}
            </Link>
          )} */}
        </div>
      )}
    </HomeHeader>
  );
};

export default JobsShow;
