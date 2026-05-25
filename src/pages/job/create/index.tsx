import { useMemo, useRef, useState } from "react";
import { Button, message } from "antd";
import { useNavigate } from "react-router";
import classnames from "classnames";
import { useTranslation } from "react-i18next";

import { Post } from "@/utils/request";
import globalStore from "@/store/global";
import VionaVideo from "@/assets/banner-video.mp4";

import styles from "./style.module.less";
import Icon from "@/components/Icon";
import Send from "@/assets/icons/send";
import PromptTypewriter from "./components/PromptTypewriter";

const JobCreate = () => {
  const { fetchJobs } = globalStore;
  const [jobName, setJobName] = useState("");

  const isSubmittingRef = useRef(false);

  const navigate = useNavigate();

  const { t: originalT, i18n } = useTranslation();
  const t = (key: string) => originalT(`create_job.${key}`);

  const promptSegments = useMemo(
    () => [
      { text: t("ready_message_prefix") },
      { text: t("ready_message_emphasis"), emphasis: true },
      { text: t("ready_message_suffix") },
    ],
    [i18n.language],
  );

  const suggestionTags = useMemo(
    () => [
      { key: "suggestion_1", value: t("suggestion_1") },
      { key: "suggestion_2", value: t("suggestion_2") },
    ],
    [i18n.language],
  );

  const createJob = async () => {
    if (jobName !== "") {
      if (isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      const { code, data } = await Post("/api/jobs", {
        name: jobName,
      });
      if (code === 0) {
        message.success(t("create_success"));
        fetchJobs();
        navigate(
          `/app/jobs/${(data as { invitation_token?: string }).invitation_token ?? data.job_id}/standard-board`,
        );
      }
      isSubmittingRef.current = false;
    }
  };

  const disabled = jobName === "";

  return (
    <div className={styles.page}>
      <section className={styles.assistantScene} aria-label={t("viona_title")}>
        <div className={styles.profile}>
          <div className={styles.avatarWrap}>
            <video
              src={VionaVideo}
              autoPlay
              loop
              muted
              className={styles.vionaVideo}
            />
          </div>
          <div>
            <h1 className={styles.profileName}>Viona</h1>
            <p className={styles.profileRole}>{t("viona_title")}</p>
          </div>
        </div>

        <div className={styles.prompt}>
          <PromptTypewriter segments={promptSegments} />
        </div>

        <div className={styles.promptDivider} aria-hidden />

        <div className={styles.suggestions} aria-label={t("try_asking")}>
          <p className={styles.suggestionsLabel}>{t("try_asking")}</p>
          <div className={styles.suggestionList}>
            {suggestionTags.map((tag) => (
              <button
                key={tag.key}
                type="button"
                className={styles.suggestionChip}
                onClick={() => setJobName(tag.value)}
              >
                {tag.value}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.composer}>
          <div className={styles.composerLeft}>
            <label className={styles.composerLabel} htmlFor="jobTitleInput">
              {t("job_name")}
            </label>
            <span className={styles.composerDivider} aria-hidden />
            <input
              id="jobTitleInput"
              className={styles.composerInput}
              type="text"
              autoComplete="off"
              placeholder={t("composer_placeholder")}
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void createJob();
                }
              }}
            />
          </div>
          <Button
            disabled={disabled}
            type="primary"
            shape="circle"
            className={classnames(styles.suffixButton, {
              [styles.disabled]: disabled,
            })}
            icon={
              <Icon
                icon={<Send />}
                className={classnames(styles.suffixIcon, {
                  [styles.disabled]: disabled,
                })}
              />
            }
            onClick={() => void createJob()}
          />
        </div>
      </section>
    </div>
  );
};

export default JobCreate;
