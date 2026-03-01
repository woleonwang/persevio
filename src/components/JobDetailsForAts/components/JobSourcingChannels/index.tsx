import { useTranslation } from "react-i18next";
import { Button, Input, message, Table } from "antd";
import classnames from "classnames";

import useJob from "@/hooks/useJob";
import { confirmModal, copy, getJobChatbotUrl } from "@/utils";
import Icon from "@/components/Icon";
import Link2 from "@/assets/icons/link2";
import Delete from "@/assets/icons/delete";
import ListUp from "@/assets/icons/list-up";
import styles from "./style.module.less";
import ButtonGroup from "antd/es/button/button-group";
import BoostJob from "@/assets/icons/boost-job";
import OutreachCampaign from "@/assets/icons/outreach-campaign";
import StartBoost from "@/assets/icons/start-boost";
import { Post } from "@/utils/request";
import Copy from "@/assets/icons/copy";

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

  const applyService = async (type: "boost" | "outreach") => {
    const { code } = await Post(`/api/jobs/${job?.id}`, {
      [type === "boost" ? "apply_boosting" : "apply_outreach_campaign"]: true,
    });

    if (code === 0) {
      message.success(originalT("submit_succeed"));
    } else {
      message.error(originalT("submit_failed"));
    }
  };

  const trackingColumns = [
    {
      title: t("source"),
      dataIndex: "source",
      key: "source",
      width: 160,
      render: (key: string) => (
        <div className={styles.sourceName}>{t(key)}</div>
      ),
    },
    {
      title: t("url"),
      dataIndex: "url",
      key: "url",
      ellipsis: true,
      render: (url: string) => <div className={styles.url}>{url}</div>,
    },
    {
      title: t("actions"),
      key: "actions",
      width: 150,
      render: (_: unknown, record: { url: string }) => (
        <Button type="default" onClick={() => handleCopyUrl(record.url)}>
          <Icon icon={<Copy />} /> {t("copy")}
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
      <div className={classnames(styles.section, styles.freeJobBoardSection)}>
        <div className={styles.sectionTitle}>{t("free_job_board_title")}</div>
        <p className={styles.sectionDesc}>{t("free_job_board_desc")}</p>
        <div className={styles.urlRow}>
          <ButtonGroup style={{ width: 720 }}>
            <Input
              value={jobUrl}
              readOnly
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            />
            <Button onClick={() => handleCopyUrl(jobUrl)}>
              {t("copy_url")}
            </Button>
          </ButtonGroup>
          <div className={styles.urlActions}>
            <Button type="primary" onClick={handleViewPosting}>
              {t("view_posting")}
            </Button>
            <Button type="primary" onClick={handlePostOrTakeDown}>
              {job.posted_at
                ? t("take_down")
                : originalT("job_details.post_job")}
            </Button>
          </div>
        </div>
      </div>

      {/* Boost Your Job */}
      <div className={styles.section}>
        <div className={styles.sectionLeft}>
          <div className={styles.sectionTitle}>
            <Icon icon={<BoostJob />} className={styles.boost} />
            {t("boost_title")}
          </div>
          <p className={styles.sectionDesc}>{t("boost_desc")}</p>
        </div>
        <div className={styles.sectionRight}>
          <div className={styles.boostBtnWrap}>
            <Button
              type="primary"
              className={styles.boostBtn}
              icon={<Icon icon={<StartBoost />} />}
              onClick={() => applyService("boost")}
            >
              {t("start_boosting")}
            </Button>
            <div className={styles.boostPricing}>
              <span>{t("no_upfront_cost")}</span>
              {/* <span>{t("flat_fee_per_hire")}</span> */}
            </div>
          </div>
        </div>
      </div>

      {/* Outreach Campaigns */}
      <div className={styles.section}>
        <div className={styles.sectionLeft}>
          <div className={styles.sectionTitle}>
            <Icon icon={<OutreachCampaign />} className={styles.outreach} />
            {t("outreach_title")}
          </div>
          <p className={styles.sectionDesc}>{t("outreach_desc")}</p>
        </div>
        <div className={styles.sectionRight}>
          <Button type="primary" onClick={() => applyService("outreach")}>
            {t("start_outreach_campaigns")}
          </Button>
        </div>
      </div>

      {/* Tracking Links */}
      <div>
        <h3 className={styles.sectionTitle}>{t("tracking_links_title")}</h3>
        <p className={styles.sectionDesc}>{t("tracking_links_desc")}</p>
        <div className={styles.tableWrap}>
          <Table
            columns={trackingColumns}
            dataSource={trackingData}
            pagination={false}
            size="small"
            bordered
          />
        </div>
        <Button variant="outlined" color="primary">
          + {t("add_custom_source")}
        </Button>
      </div>
    </div>
  );
};

export default JobSourcingChannels;
