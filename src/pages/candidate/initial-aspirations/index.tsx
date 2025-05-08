import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, message } from "antd";

import MarkdownEditor from "@/components/MarkdownEditor";
import MarkdownContainer from "@/components/MarkdownContainer";
import { parseMarkdown } from "@/utils";
import { Get, Post } from "@/utils/request";

import styles from "./style.module.less";

const InitialAspirations = () => {
  const [aspirationsContent, setAspirationsContent] = useState("");

  const [isEditing, setIsEditing] = useState(false);

  const [editAspirationsContent, setEditAspirationsContent] = useState("");

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`candidate_aspirations.${key}`);

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

  const handleSave = async () => {
    const { code } = await Post(
      "/api/candidate/docs/initial_career_aspiration",
      {
        content: editAspirationsContent,
      }
    );
    if (code === 0) {
      setIsEditing(false);
      fetchAspirations();
      message.success(originalT("submit_succeed"));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>{t("career_aspirations")}</div>
      <div className={styles.markdownWrapper}>
        {isEditing ? (
          <MarkdownEditor
            value={editAspirationsContent}
            onChange={(md) => setEditAspirationsContent(md)}
          />
        ) : (
          <MarkdownContainer content={aspirationsContent} />
        )}
      </div>
      <div className={styles.footer}>
        {isEditing ? (
          <div>
            <Button type="primary" onClick={handleSave}>
              {originalT("save")}
            </Button>
            <Button
              onClick={() => setIsEditing(false)}
              style={{ marginLeft: 10 }}
            >
              {originalT("cancel")}
            </Button>
          </div>
        ) : (
          <Button
            type="primary"
            onClick={() => {
              setEditAspirationsContent(aspirationsContent);
              setIsEditing(true);
            }}
          >
            {originalT("edit")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default InitialAspirations;
