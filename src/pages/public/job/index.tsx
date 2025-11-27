import { useEffect, useState } from "react";
import styles from "./style.module.less";
import { Get } from "@/utils/request";
import { parseJSON } from "@/utils";
import { useParams } from "react-router";
import classnames from "classnames";
import logo from "@/assets/logo.png";
import { Collapse, Typography } from "antd";
import MarkdownContainer from "@/components/MarkdownContainer";
import { useTranslation } from "react-i18next";

type TPublicJob = {
  id: number;
  name: string;
  basic_info: TJobBasicInfo;
  jrd: string;
  job_description: string;
  compensation_details: string;
  outreach_message: string;
  interview_plan: string;
};
const PublicJobDetail = () => {
  const { id } = useParams();
  const [job, setJob] = useState<TPublicJob>();
  const [activeTab, setActiveTab] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`share_job.${key}`);

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    setLoading(true);
    const search = window.location.search;
    const { code, data } = await Get(`/api/public/jobs/${id}/share`);
    if (code === 0 && data) {
      setJob({ ...data.job, basic_info: parseJSON(data.job.basic_info) });
      // 默认展示 show 参数对应的 tab
      const params = new URLSearchParams(search);
      const show = params.get("show");
      if (show && ["requirement", "jd", "outreach_message"].includes(show)) {
        setActiveTab([show]);
      }
    }
    setLoading(false);
  };

  const listSeparator = t("listSeparator") || "、";

  if (loading) {
    return <div className={styles.container}>{t("loading")}</div>;
  }
  if (!job) {
    return <div className={styles.container}>{t("notFound")}</div>;
  }

  const { name, basic_info, jrd, job_description, outreach_message } = job;

  return (
    <div className={classnames(styles.container, styles.v)}>
      <div>
        <img src={logo} style={{ width: 220, margin: "21px 28px" }} />
      </div>
      <div className={styles.main}>
        <div className={styles.header}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {name}
          </Typography.Title>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 8 }}>
            {t("basicInfo.title")}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div className={styles.item}>
              <div style={{ color: "#666", fontSize: 14, marginBottom: 4 }}>
                {t("basicInfo.location")}
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
                {basic_info
                  ?.location?.map((loc: any) => loc.city)
                  .join(listSeparator)}
              </div>
            </div>
            <div className={styles.item}>
              <div style={{ color: "#666", fontSize: 14, marginBottom: 4 }}>
                {t("basicInfo.roleType")}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                {originalT(`jobs_show.role_type.${basic_info?.role_type}`)}
              </div>
            </div>
            <div className={styles.item}>
              <div style={{ color: "#666", fontSize: 14, marginBottom: 4 }}>
                {t("basicInfo.level")}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                <span className={styles["experience-tag"]}>
                  {basic_info?.employee_level
                    ?.map((level: string) => t(`level.${level}`))
                    .join(listSeparator)}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* 详细信息 */}
        <div style={{ flex: 1, padding: 20, overflow: "auto" }}>
          <Collapse
            items={[
              {
                key: "requirement",
                label: t("sections.requirement"),
                children: <MarkdownContainer content={jrd} />,
              },
              {
                key: "jd",
                label: t("sections.description"),
                children: <MarkdownContainer content={job_description} />,
              },
              {
                key: "interview_plan",
                label: t("sections.email"),
                children: <MarkdownContainer content={outreach_message} />,
              },
            ]}
            activeKey={activeTab}
            onChange={(v) => setActiveTab(v)}
          />
        </div>
      </div>
    </div>
  );
};

export default PublicJobDetail;
