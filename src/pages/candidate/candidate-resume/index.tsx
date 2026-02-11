import { useEffect, useRef } from "react";

import styles from "./style.module.less";
import { useTranslation } from "react-i18next";
import { message, Spin } from "antd";
import CandidateChat from "@/components/CandidateChat";
import useCandidate from "@/hooks/useCandidate";
import globalStore from "@/store/global";
import { observer } from "mobx-react-lite";
import Insight, { TInsight } from "./components/Insight";
import { parseJSON } from "@/utils";
import Profile from "./components/Profile";
import { TProfile } from "./components/Profile";

// type TWorkExperience = {
//   /** Legal employer name from verified sources */
//   company_name?: string;
//   employer_context?: string;
//   /** Validated job title during tenure */
//   position?: string;
//   /** Employment period in 'MM/YYYY-MM/YYYY' format */
//   duration?: string;
//   /** Office location (city, country code) */
//   location?: string;
//   /** Synthesized key responsibilities from transcript/resume */
//   core_role_objectives?: string;
//   /** Team structure/size if mentioned (omit if unavailable) */
//   team_context?: string;
//   /** Major projects synthesized from multiple sources */
//   projects_involved?: string;
//   /** Quantified accomplishments from transcript priority */
//   key_achievements?: string;
//   reason_for_leaving_or_current_status?: string;
//   /** Concise role overview combining objectives/achievements */
//   summary?: string;
// };

// type TEducation = {
//   /** Full institutional name from verified sources */
//   school_name?: string;
//   /** Complete degree title (e.g., 'BSc Computer Science') */
//   degree?: string;
//   major?: string;
//   /** Study period in 'MM/YYYY-MM/YYYY' format */
//   duration?: string;
//   /** GPA/Honors class if explicitly mentioned */
//   grade_or_honors?: string;
//   other_relevant_info?: string[];
// };

// interface TResume {
//   /** Full name from resume/transcript (combine first/last name fields) */
//   name?: string;
//   /** Most recent job title with current employer */
//   current_position?: string;
//   /** Primary contact email from resume/transcript */
//   email?: string;
//   /** Primary phone number with international dial code */
//   phone?: string;
//   /** Combined city and country location (e.g., 'Singapore, SG') */
//   current_based_in?: string;
//   /** List of work permits/visas (e.g., 'Singapore PR, EU Blue Card') */
//   work_authorization?: string;
//   /** Candidate highlights from transcript/resume */
//   candidate_highlights?: string[];
//   /** Validated skills/domain expertise (e.g., 'B2B SaaS Sales: Enterprise Accounts') */
//   core_competencies?: { name: string; experiences: string[] }[];
//   other_competencies?: { name: string; experiences: string[] }[];
//   /** Work experience in reverse chronological order */
//   work_experience?: TWorkExperience[];
//   /** Education background information */
//   education?: TEducation[];
//   additional_qualifications?: {
//     publications?: string[];
//     certifications?: string[];
//     awards_and_honors?: string[];
//   };
// }

// type TTabKey = "resume" | "biography";
const CandidateResume = () => {
  // const [resume, setResume] = useState<string>();
  // const [biography, setBiography] = useState<string>();
  // const [status, _] = useState<TTabKey>("resume");
  // const [isEditing, setIsEditing] = useState(false);

  // const [editResumeContent, setEditResumeContent] = useState("");

  const fetchResumeTimeoutRef = useRef<number>();

  const { candidate, fetchCandidate } = useCandidate({ withDoc: true });

  useEffect(() => {
    return () => {
      if (fetchResumeTimeoutRef.current) {
        clearTimeout(fetchResumeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!candidate) {
      return;
    }

    if (candidate.interview_finished_at) {
      if (!!candidate?.profile_json) {
        fetchResumeTimeoutRef.current = 0;
      } else {
        fetchResumeTimeoutRef.current = window.setTimeout(() => {
          fetchCandidate();
        }, 5000);
      }
    } else {
      setMenuCollapse(true);
    }
  }, [candidate]);

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`candidate_resume.${key}`);

  const { setMenuCollapse } = globalStore;

  if (!candidate) {
    return <Spin style={{ marginTop: 200 }} />;
  }

  const profile = parseJSON(candidate.profile_json) as TProfile;
  const insight = parseJSON(candidate.insight_json) as TInsight;

  return (
    <div className={styles.container}>
      {candidate.interview_finished_at ? (
        <div style={{ display: "flex", gap: 24, overflow: "hidden" }}>
          {!!candidate.profile_json && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <Profile profile={profile} />
            </div>
          )}
          {!!insight.metadata && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <Insight insight={insight} />
            </div>
          )}
        </div>
      ) : (
        <CandidateChat
          chatType="profile"
          onFinish={() => {
            message.success(t("discovery_chat_done"), 5, () => {
              fetchCandidate();
            });
          }}
        />
      )}
    </div>
  );
};

export default observer(CandidateResume);
