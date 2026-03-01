import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Input, message, Table } from "antd";
import classnames from "classnames";

import useJob from "@/hooks/useJob";
import { confirmModal, copy, getJobChatbotUrl } from "@/utils";
import Icon from "@/components/Icon";
import styles from "./style.module.less";
import ButtonGroup from "antd/es/button/button-group";
import BoostJob from "@/assets/icons/boost-job";
import OutreachCampaign from "@/assets/icons/outreach-campaign";
import StartBoost from "@/assets/icons/start-boost";
import { Get, Post } from "@/utils/request";
import Copy from "@/assets/icons/copy";
import Delete from "@/assets/icons/delete";

const DEFAULT_TRACKING_SOURCES = [
  "direc",
  "linkedin",
  "jobstreet",
  "mycareersfuture",
] as const;

type TCustomSource = {
  id: number;
  job_id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

type TrackingRow =
  | { key: string; source: string; url: string; type: "default" }
  | { key: string; source: string; url: string; type: "custom"; id: number };

interface IProps {
  togglePostJob: () => Promise<void>;
}

const JobSourcingChannels = ({ togglePostJob }: IProps) => {
  const { job } = useJob();
  const [showAddCustomForm, setShowAddCustomForm] = useState(false);
  const [customSourceName, setCustomSourceName] = useState("");
  const [customSources, setCustomSources] = useState<TCustomSource[]>([]);

  const fetchCustomSources = async () => {
    if (!job?.id) return;
    const { code, data } = await Get<{ custom_sources: TCustomSource[] }>(
      `/api/jobs/${job.id}/custom_sources`,
    );
    if (code === 0) setCustomSources(data?.custom_sources ?? []);
  };

  useEffect(() => {
    fetchCustomSources();
  }, [job?.id]);

  const { t: originalT } = useTranslation();
  const t = (key: string) =>
    originalT(`job_details.sourcing_channels_section.${key}`);

  const getJobUrl = (source: string) => {
    if (!job?.id) return "";
    return getJobChatbotUrl(job.id, job.jd_version?.toString(), source);
  };

  const customSourceUrl = getJobUrl("customer");

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
    window.open(customSourceUrl, "_blank");
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

  const handleDeleteCustomSource = (id: number, name: string) => {
    confirmModal({
      title: t("delete_custom_source_title"),
      content: originalT(
        "job_details.sourcing_channels_section.delete_custom_source_content",
        { name },
      ),
      onOk: async () => {
        const { code } = await Post(
          `/api/jobs/${job!.id}/custom_sources/${id}/destroy`,
        );
        if (code === 0) {
          message.success(originalT("delete_success"));
          fetchCustomSources();
        } else {
          message.error(originalT("delete_failed"));
        }
      },
    });
  };

  const trackingColumns = [
    {
      title: t("source"),
      dataIndex: "source",
      key: "source",
      width: 160,
      render: (_: string, record: TrackingRow) => (
        <div className={styles.sourceName}>
          {record.type === "default" ? t(record.source) : record.source}
        </div>
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
      width: 250,
      render: (_: unknown, record: TrackingRow) => (
        <span className={styles.actionsCell}>
          <Button type="default" onClick={() => handleCopyUrl(record.url)}>
            <Icon icon={<Copy />} /> {t("copy")}
          </Button>
          {record.type === "custom" && (
            <Button
              type="default"
              danger
              onClick={() => handleDeleteCustomSource(record.id, record.source)}
              className={styles.deleteSourceBtn}
            >
              <Icon icon={<Delete />} /> {t("delete")}
            </Button>
          )}
        </span>
      ),
    },
  ];

  const trackingData: TrackingRow[] = [
    ...DEFAULT_TRACKING_SOURCES.map((source) => ({
      key: source,
      source,
      url: getJobUrl(source),
      type: "default" as const,
    })),
    ...customSources.map((cs) => ({
      key: `custom-${cs.id}`,
      source: cs.name,
      url: getJobUrl(cs.name),
      type: "custom" as const,
      id: cs.id,
    })),
  ];

  const handleGenerateUrl = async () => {
    const name = customSourceName.trim();
    if (!name || !job?.id) return;
    const { code } = await Post(`/api/jobs/${job.id}/custom_sources`, {
      name,
    });
    if (code === 0) {
      message.success(originalT("create_succeed"));
      fetchCustomSources();
      setShowAddCustomForm(false);
      setCustomSourceName("");
    } else {
      message.error(originalT("submit_failed"));
    }
  };

  const handleCancelAddCustom = () => {
    setShowAddCustomForm(false);
    setCustomSourceName("");
  };

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
              value={customSourceUrl}
              readOnly
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            />
            <Button onClick={() => handleCopyUrl(customSourceUrl)}>
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
        {!showAddCustomForm ? (
          <Button
            type="default"
            onClick={() => setShowAddCustomForm(true)}
            className={styles.addCustomSourceBtn}
          >
            + {t("add_custom_source")}
          </Button>
        ) : (
          <div className={styles.addCustomForm}>
            <div className={styles.addCustomFormRow}>
              <label className={styles.addCustomFormLabel}>
                {t("source_name")}
              </label>
            </div>
            <div className={styles.addCustomFormRow}>
              <Input
                className={styles.addCustomFormInput}
                placeholder={t("source_name_placeholder")}
                value={customSourceName}
                onChange={(e) => setCustomSourceName(e.target.value)}
                allowClear
              />
              <Button
                type="primary"
                onClick={handleGenerateUrl}
                className={styles.generateUrlBtn}
              >
                {t("generate_url")}
              </Button>
              <Button onClick={handleCancelAddCustom}>{t("cancel")}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobSourcingChannels;
