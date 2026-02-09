import MarkdownContainer from "@/components/MarkdownContainer";
import styles from "./style.module.less";
import { useEffect, useState } from "react";
import { Get } from "@/utils/request";
import { useTranslation } from "react-i18next";
import ChatMessagePreview from "../ChatMessagePreview";

const CandidateDrawerContent = (props: { candidateId: number }) => {
  const { candidateId } = props;
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`candidate_drawer_content.${key}`);

  const [candidate, setCandidate] = useState<ICandidateSettings>();
  const [messages, setMessages] = useState<TMessageFromApi[]>([]);

  useEffect(() => {
    fetchCandidate();
  }, [candidateId]);

  const fetchCandidate = async () => {
    const { code, data } = await Get(`/api/admin/candidates/${candidateId}`);
    if (code === 0) {
      setCandidate(data.candidate);
      setMessages(data.messages ?? []);
    }
  };

  if (!candidate) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.left}>
          <div className={styles.title}>{t("profile")}</div>
          <div className={styles.flexContent}>
            <MarkdownContainer content={candidate.resume_content} />
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.title}>{t("chatContent")}</div>
          <div className={styles.flexContent}>
            <ChatMessagePreview messages={messages} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDrawerContent;
