import MarkdownContainer from "@/components/MarkdownContainer";
import { parseMarkdown } from "@/utils";
import { Get } from "@/utils/request";
import { useEffect, useState } from "react";
import styles from "./style.module.less";
const InitialAspirations = () => {
  const [aspirationsContent, setAspirationsContent] = useState("");

  useEffect(() => {
    fetchAspirations();
  }, []);

  const fetchAspirations = async () => {
    const { code, data } = await Get(
      "/api/candidate/docs/initial_career_aspiration"
    );
    if (code === 0) {
      setAspirationsContent(parseMarkdown(data.content));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>Resume</div>
      <div className={styles.markdownWrapper}>
        <MarkdownContainer content={aspirationsContent} />
      </div>
    </div>
  );
};

export default InitialAspirations;
