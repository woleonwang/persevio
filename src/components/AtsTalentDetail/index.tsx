import React from "react";
import { Button, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import useTalent from "@/hooks/useTalent";
import usePublicJob from "@/hooks/usePublicJob";
import { Download } from "@/utils/request";
import { backOrDirect, parseJSON } from "@/utils";
import { useNavigate } from "react-router";
import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import Icon from "@/components/Icon";
import DownloadIcon from "@/assets/icons/download";
import Phone from "@/assets/icons/phone";
import MailCheck from "@/assets/icons/mail-check";
import Link2 from "@/assets/icons/link2";
import MarkdownContainer from "@/components/MarkdownContainer";
import Resume from "./components/Resume";
import { TTalentResume } from "@/components/NewTalentDetail/type";
import type { TExtractBasicInfo } from "@/components/JobDetailsForAts/components/JobPipeline/components/types";

import styles from "./style.module.less";

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 1).toUpperCase();
};

const formatLastUpdated = (dateStr?: string) => {
  if (!dateStr) return null;
  return dayjs(dateStr).format("MMM DD, YYYY");
};

const AtsTalentDetail: React.FC = () => {
  const { job } = usePublicJob();
  const { talent } = useTalent();
  const navigate = useNavigate();

  if (!job || !talent) {
    return <Spin />;
  }

  const resumeDetail: TTalentResume | null = talent.resume_detail_json
    ? (parseJSON(talent.resume_detail_json) as TTalentResume)
    : null;
  const basicInfo: TExtractBasicInfo | null = talent.basic_info_json
    ? (parseJSON(talent.basic_info_json) as TExtractBasicInfo)
    : null;

  const report = parseJSON(talent.evaluate_json) as TReport;

  const contact = resumeDetail?.contact_information;
  const lastUpdated =
    talent.evaluate_result_updated_at ||
    talent.viewed_at ||
    talent.feedback_updated_at;

  const downloadResume = async () => {
    await Download(
      `/api/jobs/${job?.id}/talents/${talent?.id}/download_resume`,
      `${talent.name}_resume`,
    );
  };

  const handleBack = () => {
    backOrDirect(navigate, `/app/jobs/${job.id}/standard-board?tab=talents`);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <ArrowLeftOutlined className={styles.backIcon} onClick={handleBack} />
        <div className={styles.avatar}>{getInitials(talent.name)}</div>
        <div className={styles.headerMain}>
          <h1 className={styles.candidateName}>{talent.name}</h1>
        </div>
        <div className={styles.headerMeta}>
          {lastUpdated && (
            <span className={styles.lastUpdated}>
              Last updated: {formatLastUpdated(lastUpdated)}
            </span>
          )}
        </div>
      </header>

      <div className={styles.contactRow}>
        {contact?.phone && (
          <a href={`tel:${contact.phone}`} className={styles.contactLink}>
            <Icon icon={<Phone />} />
            {contact.phone}
          </a>
        )}
        {contact?.email && (
          <a href={`mailto:${contact.email}`} className={styles.contactLink}>
            <Icon icon={<MailCheck />} />
            {contact.email}
          </a>
        )}
        {contact?.linkedin && (
          <a
            href={
              contact.linkedin.startsWith("http")
                ? contact.linkedin
                : `https://${contact.linkedin}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className={styles.contactLink}
          >
            <Icon icon={<Link2 />} />
            {contact.linkedin.replace(/^https?:\/\//, "")}
          </a>
        )}
      </div>

      <section className={styles.snapshotSection}>
        <div className={styles.snapshotSectionBg} />
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Profile Snapshot</h2>
        </div>
        <div className={styles.snapshotGrid}>
          {report.profile_snapshot.map((snapshot) => (
            <div className={styles.snapshotItem}>
              <span className={styles.snapshotLabel}>{snapshot.title}</span>
              <span className={styles.snapshotValue}>{snapshot.details}</span>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.mainRow}>
        <div className={styles.resumeColumn}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Resume</h2>
            <Button
              type="primary"
              icon={<Icon icon={<DownloadIcon />} />}
              onClick={downloadResume}
              className={styles.downloadPdfBtn}
            >
              Download PDF
            </Button>
          </div>
          <div className={styles.resumeContent}>
            {resumeDetail?.contact_information ? (
              <Resume resume={resumeDetail} />
            ) : (
              <MarkdownContainer content={talent.parsed_content || ""} />
            )}
          </div>
        </div>

        <div className={styles.keyInfoColumn}>
          <div className={styles.sectionHead} style={{ height: 49 }}>
            <h2 className={styles.sectionTitle}>Key Information</h2>
            <div className={styles.sectionMeta}>
              {lastUpdated && (
                <span className={styles.lastUpdated}>
                  Last updated: {formatLastUpdated(lastUpdated)}
                </span>
              )}
            </div>
          </div>
          <div className={styles.bgWrap}>
            <div className={styles.keyInfoCards}>
              {report.key_information.map((information) => (
                <div className={styles.keyInfoCard}>
                  <span className={styles.keyInfoLabel}>
                    {information.title}
                  </span>
                  <span className={styles.keyInfoValue}>
                    {information.details}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default observer(AtsTalentDetail);
