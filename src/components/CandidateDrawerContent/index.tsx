import MarkdownContainer from "@/components/MarkdownContainer";
import styles from "./style.module.less";
import { useEffect, useState } from "react";
import { Get } from "@/utils/request";
import ChatMessagePreview from "../ChatMessagePreview";

const CandidateDrawerContent = (props: { candidateId: number }) => {
  const { candidateId } = props;

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
          <div className={styles.title}>个人资料</div>
          <div className={styles.flexContent}>
            <MarkdownContainer content={candidate.resume_content} />
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.title}>对话内容</div>
          <div className={styles.flexContent}>
            <ChatMessagePreview messages={messages} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDrawerContent;
