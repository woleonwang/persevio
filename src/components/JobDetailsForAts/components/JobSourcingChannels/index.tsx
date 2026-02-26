import { useTranslation } from "react-i18next";
import { Button, message, Table } from "antd";

import useJob from "@/hooks/useJob";
import { confirmModal, copy, getJobChatbotUrl } from "@/utils";
import Icon from "@/components/Icon";
import Link2 from "@/assets/icons/link2";
import Delete from "@/assets/icons/delete";
import ListUp from "@/assets/icons/list-up";
import styles from "./style.module.less";

const DEFAULT_TRACKING_SOURCES = [
  "direc",
  "linkedin",
  "jobstreet",
  "mycareersfuture",
] as const;

interface IProps {
  togglePostJob: () => Promise<void>;
}

const JobSourcingChannels = ({ togglePostJob }: IProps) => {
  const { job } = useJob();

  const { t: originalT } = useTranslation();
  const t = (key: string) =>
    originalT(`job_details.sourcing_channels_section.${key}`);

  const jobUrl = job
    ? getJobChatbotUrl(job.id, job.jd_version?.toString(), "customer")
    : "";

  const handleCopyUrl = async (url: string) => {
    await copy(url);
    message.success(originalT("copied"));
  };

  const handlePostOrTakeDown = () => {
    confirmModal({
      title: job?.posted_at
        ? originalT("job_details.unpost_job_title")
        : originalT("job_details.post_job_title"),
      content: job?.posted_at
        ? originalT("job_details.unpost_job_content")
        : originalT("job_details.post_job_content"),
      onOk: togglePostJob,
    });
  };

  const handleViewPosting = () => {
    window.open(jobUrl, "_blank");
  };

  const trackingColumns = [
    {
      title: t("source"),
      dataIndex: "source",
      key: "source",
      width: 160,
      render: (key: string) => t(key),
    },
    {
      title: t("url"),
      dataIndex: "url",
      key: "url",
      ellipsis: true,
    },
    {
      title: t("actions"),
      key: "actions",
      width: 100,
      render: (_: unknown, record: { url: string }) => (
        <Button
          type="link"
          size="small"
          onClick={() => handleCopyUrl(record.url)}
        >
          {t("copy")}
        </Button>
      ),
    },
  ];

  const trackingData = DEFAULT_TRACKING_SOURCES.map((source) => ({
    key: source,
    source,
    url: jobUrl,
  }));

  if (!job) return null;

  return (
    <div className={styles.container}>
      {/* Persevio's Free Job Board */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t("free_job_board_title")}</h3>
        <p className={styles.sectionDesc}>{t("free_job_board_desc")}</p>
        <div className={styles.urlRow}>
          <a href={jobUrl} target="_blank" rel="noopener noreferrer" className={styles.urlLink}>
            {jobUrl}
          </a>
          <div className={styles.urlActions}>
            <Button
              icon={<Icon icon={<Link2 />} />}
              onClick={() => handleCopyUrl(jobUrl)}
            >
              {t("copy_url")}
            </Button>
            <Button type="primary" onClick={handleViewPosting}>
              {t("view_posting")}
            </Button>
            {job.posted_at ? (
              <Button
                danger
                icon={<Icon icon={<Delete />} />}
                onClick={handlePostOrTakeDown}
              >
                {t("take_down")}
              </Button>
            ) : (
              <Button type="primary" onClick={handlePostOrTakeDown}>
                {originalT("job_details.post_job")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Boost Your Job */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t("boost_title")}</h3>
        <p className={styles.sectionDesc}>{t("boost_desc")}</p>
        <div className={styles.boostRow}>
          <div className={styles.boostPricing}>
            <span>{t("no_upfront_cost")}</span>
            <span>{t("flat_fee_per_hire")}</span>
          </div>
          <Button type="primary" className={styles.boostBtn} icon={<Icon icon={<ListUp />} />}>
            {t("start_boosting")}
          </Button>
        </div>
      </div>

      {/* Outreach Campaigns */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t("outreach_title")}</h3>
        <p className={styles.sectionDesc}>{t("outreach_desc")}</p>
        <Button type="primary">{t("start_outreach_campaigns")}</Button>
      </div>

      {/* Tracking Links */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t("tracking_links_title")}</h3>
        <p className={styles.sectionDesc}>{t("tracking_links_desc")}</p>
        <div className={styles.tableWrap}>
          <Table
            columns={trackingColumns}
            dataSource={trackingData}
            pagination={false}
            size="small"
          />
        </div>
        <Button type="link" className={styles.addCustomSource}>
          + {t("add_custom_source")}
        </Button>
      </div>
    </div>
  );
};

export default JobSourcingChannels;
