import { useEffect, useState } from "react";
import styles from "./style.module.less";
import { Get } from "@/utils/request";
import { parseJSON } from "@/utils";
import { useParams } from "react-router";
import classnames from "classnames";
import logo from "@/assets/logo.png";
import { Collapse, Typography } from "antd";
import MarkdownContainer from "@/components/MarkdownContainer";

const levelTranslations = {
  internship: "实习生",
  no_experience: "应届毕业生/无经验",
  junior: "初级/少量经验",
  mid_level: "中级/有一定经验",
  senior: "高级/经验非常丰富",
};

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
      if (
        show &&
        [
          "requirement",
          "jd",
          "compensation_details",
          "outreach_message",
          "interview_plan",
        ].includes(show)
      ) {
        setActiveTab([show]);
      }
    }
    setLoading(false);
  };

  if (loading) {
    return <div className={styles.container}>加载中...</div>;
  }
  if (!job) {
    return <div className={styles.container}>未找到该职位</div>;
  }

  const {
    name,
    basic_info,
    jrd,
    job_description,
    interview_plan,
    compensation_details,
    outreach_message,
  } = job;

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
            基本信息
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div className={styles.item}>
              <div style={{ color: "#666", fontSize: 14, marginBottom: 4 }}>
                工作地点
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
                {basic_info?.location?.map((loc: any) => loc.city).join("、")}
              </div>
            </div>
            <div className={styles.item}>
              <div style={{ color: "#666", fontSize: 14, marginBottom: 4 }}>
                职位所属部门
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                {basic_info?.team_name}
              </div>
            </div>
            <div className={styles.item}>
              <div style={{ color: "#666", fontSize: 14, marginBottom: 4 }}>
                级别
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                <span className={styles["experience-tag"]}>
                  {basic_info?.employee_level
                    ?.map(
                      (level: string) =>
                        levelTranslations[
                          level as keyof typeof levelTranslations
                        ]
                    )
                    .join("、")}
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
                label: "详细职位信息",
                children: <MarkdownContainer content={jrd} />,
              },
              {
                key: "jd",
                label: "职位描述",
                children: <MarkdownContainer content={job_description} />,
              },
              {
                key: "compensation_details",
                label: "薪资结构",
                children: <MarkdownContainer content={compensation_details} />,
              },
              {
                key: "interview_plan",
                label: "邮件内容",
                children: <MarkdownContainer content={outreach_message} />,
              },
              {
                key: "interview_plan",
                label: "面试流程",
                children: <MarkdownContainer content={interview_plan} />,
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
