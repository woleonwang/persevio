import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Avatar,
  Button,
  Drawer,
  Empty,
  Input,
  message,
  Modal,
  Spin,
  Tooltip,
} from "antd";
import { v4 as uuidV4 } from "uuid";
import classnames from "classnames";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

import JobChatBot from "@/components/JobChatBot";
import { Get, Post } from "@/utils/request";
import MarkdownContainer from "@/components/MarkdownContainer";
import { copy, getQuery, isTempAccount, parseJSON } from "@/utils";
import { storage, StorageKey } from "@/utils/storage";
import Icon from "@/components/Icon";
import Send from "@/assets/icons/send";
import EmptyImg from "@/assets/empty2.png";
import ShareToken from "./components/ShareToken";
import Share2 from "@/assets/icons/share2";
import Logo from "@/assets/logo.png";
import VionaAvatar from "@/assets/viona-avatar.png";

import styles from "./style.module.less";
import Guide from "@/assets/icons/guide";

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

export type TJob = {
  id: number;
  name: string;
  company_id: number;
  updated_at: string;
  job_description: string;
  job_description_json: TJobDescription;
  screening_questions: string;
  basic_info: TJobBasicInfo;
  posted_at?: string;
  bonus_pool: number;
};

type TStatus = "loading" | "success" | "error";

const JobsShow = () => {
  const { id, version = "0" } = useParams<{ id: string; version: string }>();
  const [company, setCompany] = useState<TCompany>();
  const [candidate, setCandidate] = useState<ICandidateSettings>();
  const [job, setJob] = useState<TJob>();
  const [status, setStatus] = useState<TStatus>("loading");
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(true);
  const [shareToken, setShareToken] = useState<string>();
  const [referralModalVisible, setReferralModalVisible] = useState(false);

  const originalI18nRef = useRef<string>();

  const navigate = useNavigate();

  const isPreview = getQuery("preview") === "1";

  const { i18n, t: originalT } = useTranslation();
  const t = (key: string, options?: Record<string, unknown>) =>
    originalT(`jobs_show.${key}`, options);

  useEffect(() => {
    fetchCandidateSettings();
    fetchJob();
    checkShareToken();
    checkLinkedinProfile();
    checkSourceChannel();
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
    let value = storage.get<string>(StorageKey.SESSION_ID);
    if (!value) {
      value = uuidV4();
      storage.set(StorageKey.SESSION_ID, value);
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
    const { code, data } = await Get(`/api/public/jobs/${id}`, { version });
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

  const checkShareToken = async () => {
    if (!id) return;

    const shareToken = getQuery("share_token");
    const shareTokenMapping = storage.get<Record<string, string>>(
      StorageKey.SHARE_TOKEN,
      {}
    ) as Record<string, string>;

    if (shareToken) {
      shareTokenMapping[id] = shareToken;
      storage.set(StorageKey.SHARE_TOKEN, shareTokenMapping);
    }

    const token = shareTokenMapping[id];
    if (token) {
      setShareToken(token);
      await Get(`/api/public/share_token/${token}`);
    }
  };

  const checkLinkedinProfile = async () => {
    const profileId = getQuery("profile_id");
    if (profileId) {
      Post(`/api/public/linkedin_profiles/${profileId}/message_read`);
      storage.set(StorageKey.LINKEDIN_PROFILE_ID, profileId);
    }
  };

  const checkSourceChannel = () => {
    if (!id) return;

    const sourceChannel = getQuery("source_channel");
    if (sourceChannel) {
      const sourceChannelMapping = storage.get<Record<string, string>>(
        StorageKey.SOURCE_CHANNEL,
        {}
      ) as Record<string, string>;

      if (sourceChannel) {
        sourceChannelMapping[id] = sourceChannel;
        storage.set(StorageKey.SOURCE_CHANNEL, sourceChannelMapping);
      }
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

  if (status === "error") {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Empty
          styles={{
            image: {
              height: 140,
            },
          }}
          image={<img src={EmptyImg} alt="empty" style={{ width: "auto" }} />}
          description={
            <div style={{ marginTop: 20 }}>
              {t("job_closed_description_line1")}
              <br />
              {t("job_closed_description_line2")}
            </div>
          }
        />
      </div>
    );
  }

  const ChatRoomArea = (
    <JobChatBot
      userRole="candidate"
      jobId={parseInt(id ?? "0")}
      sessionId={sessionId}
      enableFullscreen
    />
  );

  return (
    <div className={styles.headerContainer}>
      {status === "success" && company && job && (
        <div
          className={styles.container}
          style={isPreview ? { margin: 0 } : undefined}
        >
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
                    <Icon
                      icon={<Share2 />}
                      className={styles.shareIcon}
                      onClick={async () => {
                        await copy(window.location.href);
                        message.success(originalT("copied"));
                      }}
                    />
                  )}
                </div>

                <div className={styles.companyName}>
                  {company.name}
                  <Icon icon={<Guide />} className={styles.guideIcon} />
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

              {!isPreview && (
                <div>
                  {!!job.bonus_pool && (
                    <Button
                      variant="outlined"
                      color="primary"
                      size="large"
                      className={styles.applyButton}
                      onClick={() => setReferralModalVisible(true)}
                    >
                      Refer & earn
                    </Button>
                  )}
                  <Button
                    type="primary"
                    size="large"
                    className={styles.applyButton}
                    onClick={async () => {
                      if (candidate) {
                        if (isTempAccount(candidate)) {
                          // 没走完注册流程
                          message.info(t("complete_registration_first"));
                          navigate(`/signup-candidate`, {
                            replace: true,
                          });
                        } else {
                          // 是否已经创建职位申请
                          const { code, data } = await Get(
                            `/api/candidate/jobs/${id}/job_apply`
                          );
                          if (code === 0) {
                            navigate(
                              `/candidate/jobs/applies/${data.job_apply.id}?open=1`
                            );
                          } else {
                            const { code, data } = await Post(
                              "/api/candidate/job_applies",
                              {
                                job_id: parseInt(id as string),
                              }
                            );
                            if (code === 0) {
                              navigate(
                                `/candidate/jobs/applies/${data.job_apply_id}?open=1`
                              );
                            } else {
                              message.error(t("apply_job_failed"));
                            }
                          }
                        }
                      } else {
                        navigate(`/signup-candidate?job_id=${id}`, {
                          replace: true,
                        });
                      }
                    }}
                  >
                    {t("apply_now")}
                  </Button>
                </div>
              )}
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
                  {t("viona_intro_text")}
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
              <div className={styles.jobDescriptionSection}>
                <div className={styles.sectionTitle}>
                  <div className={styles.greenBar}></div>
                  <span>{t("job_description_section")}</span>
                </div>
                <div className={styles.sectionContent}>
                  <MarkdownContainer content={job.job_description} />
                </div>
              </div>

              {!!job.posted_at && (
                <div className={styles.postedAt}>
                  {t("updated_at", {
                    date: dayjs(job.posted_at).format("YYYY-MM-DD HH:mm:ss"),
                  })}
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
            title={t("drawer_title")}
            open={chatModalVisible}
            onClose={() => setChatModalVisible(false)}
            placement="bottom"
            height="90vh"
            style={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
            className={classnames(styles.chatDrawer, styles.mobileVisible)}
          >
            {ChatRoomArea}
          </Drawer>

          <Modal
            title=""
            open={referralModalVisible}
            onCancel={() => setReferralModalVisible(false)}
            centered
            footer={null}
            closeIcon={null}
            width={800}
            destroyOnClose
            styles={{
              mask: {
                overflow: "hidden",
                pointerEvents: "none",
              },
            }}
          >
            <ShareToken
              parentShareToken={shareToken}
              job={job}
              onClose={() => setReferralModalVisible(false)}
            />
          </Modal>
          {/* {!isPreview && (
            <Link className={styles.footer} to="/">
              {t("powered_by_persevio")}
            </Link>
          )} */}
        </div>
      )}
      <div className={styles.footer}>
        <img src={Logo} className={styles.logo} />
      </div>
    </div>
  );
};

export default JobsShow;
