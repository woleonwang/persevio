import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Input, message, Select, Table, Tag } from "antd";
import classnames from "classnames";

import useJob from "@/hooks/useJob";
import { confirmModal, copy, getJobChatbotUrl } from "@/utils";
import Icon from "@/components/Icon";
import styles from "./style.module.less";
import ButtonGroup from "antd/es/button/button-group";
import BoostJob from "@/assets/icons/boost-job";
import OutreachCampaign from "@/assets/icons/outreach-campaign";
import StartBoost from "@/assets/icons/start-boost";
import { Post } from "@/utils/request";
import Copy from "@/assets/icons/copy";
import Delete from "@/assets/icons/delete";
import useSourcingChannels from "@/hooks/useSourcingChannels";
import { DEFAULT_TRACKING_SOURCES } from "../JobPipeline/components/utils";

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

  const { customSources, fetchCustomSources } = useSourcingChannels({
    jobId: job?.id,
  });

  const { t: originalT } = useTranslation();
  const t = (key: string) =>
    originalT(`job_details.sourcing_channels_section.${key}`);

  const getJobUrl = (source: string) => {
    if (!job?.id) return "";
    return getJobChatbotUrl(job.id, job.jd_version?.toString(), source);
  };

  const customSourceUrl = getJobUrl("persevio");

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

  const handleBoostClick = () => {
    confirmModal({
      styles: {
        content: {
          width: 600,
        },
      },
      rootClassName: styles.conformModal,
      title: t("boost_modal_title"),
      content: (
        <div style={{ marginTop: 8 }}>
          <p
            style={{ marginBottom: 12 }}
            dangerouslySetInnerHTML={{ __html: t("boost_modal_desc") }}
          />
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li>{t("boost_modal_point_1")}</li>
            <li>{t("boost_modal_point_2")}</li>
            <li>{t("boost_modal_point_3")}</li>
            <li>{t("boost_modal_point_4")}</li>
          </ul>
          <div
            style={{
              marginTop: 8,
              padding: 12,
              borderRadius: 8,
              background: "#F3F4F6",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {t("boost_modal_pricing_title")}
            </div>
            <div
              style={{ fontSize: 13, color: "#4B5563" }}
              dangerouslySetInnerHTML={{
                __html: t("boost_modal_pricing_desc"),
              }}
            />
          </div>
        </div>
      ),
      okText: t("boost_modal_confirm"),
      onOk: () => applyService("boost"),
    });
  };

  const handleOutreachClick = () => {
    confirmModal({
      styles: {
        content: {
          width: 600,
        },
      },
      rootClassName: styles.conformModal,
      title: t("outreach_modal_title"),
      content: (
        <div style={{ marginTop: 8 }}>
          <p style={{ marginBottom: 12 }}>{t("outreach_modal_desc")}</p>
          <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
            <li>{t("outreach_modal_point_1")}</li>
            <li>{t("outreach_modal_point_2")}</li>
            <li>{t("outreach_modal_point_3")}</li>
            <li>{t("outreach_modal_point_4")}</li>
          </ul>
          <div
            style={{
              marginTop: 8,
              padding: 12,
              borderRadius: 8,
              background: "#F3F4F6",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {t("outreach_modal_pricing_title")}
            </div>
            <div style={{ fontSize: 13, color: "#4B5563" }}>
              {t("outreach_modal_pricing_desc")}
            </div>
          </div>
        </div>
      ),
      okText: t("outreach_modal_contact_sales"),
      onOk: () => applyService("outreach"),
    });
  };

  const handleChangePostingStatus = (value: "published" | "delisted") => {
    if (!job) return;
    const isLive = !!job.posted_at;
    const targetLive = value === "published";
    if (isLive === targetLive) return;
    handlePostOrTakeDown();
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
          {record.type === "default"
            ? originalT(`sourcing_channel.${record.source}`)
            : record.source}
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
            <Tag
              color={job.posted_at ? "success" : "error"}
              style={{ fontSize: 16, lineHeight: "26px", padding: "2px 10px" }}
            >
              {job.posted_at ? "Live" : "Delisted"}
            </Tag>
          </div>
          <Select
            style={{ width: 120, marginLeft: "auto" }}
            value={job.posted_at ? "published" : "delisted"}
            onChange={handleChangePostingStatus}
            options={[
              { value: "published", label: "Published" },
              { value: "delisted", label: "Delist" },
            ]}
          />
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
              onClick={handleBoostClick}
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
          <Button type="primary" onClick={handleOutreachClick}>
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
            <label className={styles.addCustomFormLabel}>
              {t("source_name")}
            </label>
            <div className={styles.addCustomFormRow}>
              <Input
                className={styles.addCustomFormInput}
                placeholder={t("source_name_placeholder")}
                value={customSourceName}
                onChange={(e) => setCustomSourceName(e.target.value)}
                allowClear
                autoFocus
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
