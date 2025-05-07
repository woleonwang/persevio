import { useEffect, useState } from "react";
import MarkdownContainer from "@/components/MarkdownContainer";
import { parseMarkdown } from "@/utils";
import { Get, Post } from "@/utils/request";

import styles from "./style.module.less";
import MarkdownEditor from "@/components/MarkdownEditor";
import { Button, message } from "antd";
import { useTranslation } from "react-i18next";

const CandidateResume = () => {
  const [resume, setResume] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [editResumeContent, setEditResumeContent] = useState("");

  const { t: originalT } = useTranslation();

  useEffect(() => {
    fetchResume();
  }, []);

  const fetchResume = async () => {
    const { code, data } = await Get("/api/candidate/docs/llm_resume");
    if (code === 0) {
      setResume(parseMarkdown(data.content));
    }
  };

  const handleSave = async () => {
    const { code } = await Post("/api/candidate/docs/llm_resume", {
      content: editResumeContent,
    });
    if (code === 0) {
      setIsEditing(false);
      fetchResume();
      message.success(originalT("submit_succeed"));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>Resume</div>
      <div className={styles.markdownWrapper}>
        {isEditing ? (
          <MarkdownEditor
            value={editResumeContent}
            onChange={(md) => setEditResumeContent(md)}
          />
        ) : (
          <MarkdownContainer content={resume} />
        )}
      </div>
      <div className={styles.footer}>
        {isEditing ? (
          <div>
            <Button type="primary" onClick={handleSave}>
              Save
            </Button>
            <Button
              onClick={() => setIsEditing(false)}
              style={{ marginLeft: 10 }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="primary"
            onClick={() => {
              setEditResumeContent(resume);
              setIsEditing(true);
            }}
          >
            Edit
          </Button>
        )}
      </div>
    </div>
  );
};

export default CandidateResume;
