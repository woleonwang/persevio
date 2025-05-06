import MarkdownContainer from "@/components/MarkdownContainer";
import { parseMarkdown } from "@/utils";
import { Get } from "@/utils/request";
import { useEffect, useState } from "react";

import styles from "./style.module.less";

const CandidateResume = () => {
  const [resume, setResume] = useState("");

  useEffect(() => {
    fetchResume();
  }, []);

  const fetchResume = async () => {
    const { code, data } = await Get("/api/candidate/docs/llm_resume");
    if (code === 0) {
      setResume(parseMarkdown(data.content));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>Resume</div>
      <div className={styles.markdownWrapper}>
        <MarkdownContainer content={resume} />
      </div>
    </div>
  );
};

export default CandidateResume;
