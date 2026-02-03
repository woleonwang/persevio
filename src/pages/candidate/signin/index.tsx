import React, { useEffect, useState } from "react";
import { message } from "antd";
import classnames from "classnames";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { Get, Post } from "@/utils/request";
import { deleteQuery, getQuery, isTempAccount } from "@/utils";
import { storage, StorageKey, tokenStorage } from "@/utils/storage";

import OAuth from "./components/OAuth";
import styles from "./style.module.less";
const CandidateSignIn: React.FC = () => {
  const [pending, setPending] = useState(true);

  const navigate = useNavigate();
  const { t: originalT, i18n } = useTranslation();
  const t = (key: string) => originalT(`candidate_sign.${key}`);

  const jobIdStr: string = getQuery("job_id");

  useEffect(() => {
    const error = getQuery("error");
    const code = getQuery("code");
    if (error === "google_login_failed" && code === "10001") {
      message.error(t("email_not_exists"));
    }

    const tokenFromUrl = getQuery("token");
    if (tokenFromUrl) {
      deleteQuery("token");
      tokenStorage.setToken(tokenFromUrl, "candidate");
    }

    if (jobIdStr) {
      storage.set(StorageKey.SIGNIN_JOB_ID, jobIdStr);
    }

    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { code, data } = await Get(`/api/candidate/settings`);
    if (code === 0) {
      const candidate: ICandidateSettings = data.candidate;
      i18n.changeLanguage(candidate.lang ?? "zh-CN");
      const signinJobId = storage.get<string>(StorageKey.SIGNIN_JOB_ID);
      if (isTempAccount(candidate)) {
        navigate(`/signup-candidate`, { replace: true });
      } else if (signinJobId) {
        const { code, data } = await Post("/api/candidate/job_applies", {
          job_id: parseInt(signinJobId),
        });
        if (code === 0) {
          navigate(`/candidate/jobs/applies/${data.job_apply_id}?open=1`, {
            replace: true,
          });
          storage.remove(StorageKey.SIGNIN_JOB_ID);
        } else {
          navigate("/candidate/jobs", { replace: true });
        }
      } else {
        navigate("/candidate/jobs", { replace: true });
      }
    } else {
      setPending(false);
    }
  };

  if (pending) {
    return null;
  }

  return (
    <div className={classnames(styles.container)}>
      <div className={styles.main}>
        <OAuth />
      </div>
    </div>
  );
};

export default CandidateSignIn;
