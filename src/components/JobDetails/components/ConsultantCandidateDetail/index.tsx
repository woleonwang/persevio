import { useEffect, useState } from "react";
import { Drawer, Spin, Tag, Timeline } from "antd";
import dayjs from "dayjs";
import { LinkOutlined } from "@ant-design/icons";

import { Get } from "@/utils/request";
import { normalizeReport, parseJSON } from "@/utils";
import MarkdownContainer from "@/components/MarkdownContainer";
import Report from "@/components/NewTalentDetail/components/Report";
import styles from "./style.module.less";

interface IProps {
  jobId: number;
  linkedinProfileId?: number;
  talentId?: number;
  jobApplyId?: number;
  candidateType?: "passive" | "active";
  open: boolean;
  onClose: () => void;
}

type TStageEvent = {
  stage: string;
  label: string;
  reached_at: string;
};

type TDetail = {
  candidate_type?: "passive" | "active";
  name: string;
  linkedin_url: string;
  current_title: string;
  current_company: string;
  fit_level: string;
  status_label: string;
  stage_events: TStageEvent[];
  profile_doc: string;
  resume_content: string;
  screen_recommendation_doc: string;
  assessment_evaluate_json: string;
  outreach_message_doc: string;
  message_sent_at?: string;
  page_blocks: string;
};

const ConsultantCandidateDetail = (props: IProps) => {
  const {
    jobId,
    linkedinProfileId,
    talentId,
    jobApplyId,
    candidateType,
    open,
    onClose,
  } = props;
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<TDetail>();

  useEffect(() => {
    if (!open) {
      return;
    }
    fetchDetail();
  }, [open, linkedinProfileId, talentId, jobApplyId, candidateType, jobId]);

  const fetchDetail = async () => {
    let url = "";
    if (candidateType === "passive" && linkedinProfileId) {
      url = `/api/admin/jobs/${jobId}/consultant/candidates/${linkedinProfileId}`;
    } else if (talentId) {
      url = `/api/admin/jobs/${jobId}/consultant/talents/${talentId}`;
    } else if (jobApplyId) {
      url = `/api/admin/jobs/${jobId}/consultant/job_applies/${jobApplyId}`;
    } else {
      return;
    }

    setLoading(true);
    const { code, data } = await Get(url);
    setLoading(false);
    if (code === 0) {
      setDetail(data);
    }
  };

  const report = detail?.assessment_evaluate_json
    ? normalizeReport(parseJSON(detail.assessment_evaluate_json))
    : null;

  const isPassive = detail?.candidate_type === "passive" || candidateType === "passive";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={720}
      title={detail?.name || "Candidate"}
      destroyOnClose
    >
      {loading || !detail ? (
        <Spin />
      ) : (
        <div className={styles.container}>
          <div className={styles.headerBlock}>
            <div className={styles.metaLine}>
              {[detail.current_title, detail.current_company]
                .filter(Boolean)
                .join(" · ") || "—"}
            </div>
            <div className={styles.metaLine}>
              {detail.linkedin_url && (
                <a href={detail.linkedin_url} target="_blank" rel="noreferrer">
                  <LinkOutlined /> LinkedIn
                </a>
              )}
              <Tag>{detail.fit_level || "No verdict"}</Tag>
              <Tag color="blue">{detail.status_label}</Tag>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Status timeline</div>
            <Timeline
              items={(detail.stage_events || []).map((event) => ({
                children: (
                  <div>
                    <div>{event.label}</div>
                    <div className={styles.timeText}>
                      {dayjs(event.reached_at).format("YYYY-MM-DD HH:mm")}
                    </div>
                  </div>
                ),
              }))}
            />
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Profile</div>
            {detail.resume_content ? (
              <>
                <div className={styles.subTitle}>Submitted resume</div>
                <MarkdownContainer content={detail.resume_content} />
                {!!detail.profile_doc && (
                  <>
                    <div className={styles.subTitle}>
                      {isPassive ? "LinkedIn scrape" : "Profile"}
                    </div>
                    <MarkdownContainer content={detail.profile_doc} />
                  </>
                )}
              </>
            ) : (
              <MarkdownContainer
                content={detail.profile_doc || "No profile content yet."}
              />
            )}
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Assessment</div>
            {report ? (
              <Report
                candidateName={detail.name}
                jobName=""
                report={report}
                evaluateFeedback={"" as TEvaluateFeedback}
                onChangeEvaluateFeedback={() => undefined}
                onOpenEvaluateFeedback={() => undefined}
              />
            ) : (
              <MarkdownContainer
                content={
                  detail.screen_recommendation_doc ||
                  "No screen result available yet."
                }
              />
            )}
          </div>

          {isPassive && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Outreach context</div>
              <div className={styles.subTitle}>
                Sent message
                {detail.message_sent_at
                  ? ` · ${dayjs(detail.message_sent_at).format("YYYY-MM-DD HH:mm")}`
                  : ""}
              </div>
              <MarkdownContainer
                content={detail.outreach_message_doc || "No outreach message yet."}
              />
              {!!detail.page_blocks && (
                <>
                  <div className={styles.subTitle}>Personalized page blocks</div>
                  <MarkdownContainer content={detail.page_blocks} />
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
};

export default ConsultantCandidateDetail;
