import React, { useEffect, useState } from "react";
import { Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Get } from "@/utils/request";
import MarkdownContainer from "@/components/MarkdownContainer";
import { backOrDirect } from "@/utils";
import { useNavigate, useParams } from "react-router";
import classnames from "classnames";
import { observer } from "mobx-react-lite";

import styles from "./style.module.less";
import usePublicJob from "@/hooks/usePublicJob";

interface IProps {
  isPreview?: boolean;
}

const LinkedinProfileDetail: React.FC<IProps> = (props) => {
  const { job } = usePublicJob();

  const [linkedinProfile, setLinkedinProfile] = useState<TLinkedinProfile>();

  const { isPreview } = props;

  const { jobId, linkedinProfileId } = useParams<{
    jobId: string;
    linkedinProfileId: string;
  }>();

  const navigate = useNavigate();

  useEffect(() => {
    fetchLinkedinProfile();
  }, [linkedinProfileId]);
  const fetchLinkedinProfile = async () => {
    const { code, data } = await Get(
      `/api/jobs/${jobId}/linkedin_profiles/${linkedinProfileId}`
    );
    if (code === 0) {
      setLinkedinProfile(data.linkedin_profile);
    }
  };

  if (!job || !linkedinProfile) {
    return <Spin />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {!isPreview && (
          <ArrowLeftOutlined
            style={{
              fontSize: 20,
              cursor: "pointer",
            }}
            className={styles.desktopVisible}
            onClick={async () => {
              backOrDirect(
                navigate,
                `/app/jobs/${jobId}/standard-board?tab=talents`
              );
            }}
          />
        )}
        <div>
          {linkedinProfile.name} - {job.name}
        </div>
      </div>
      <div className={classnames(styles.main)}>
        <div className={styles.resumeContainer}>
          <div className={styles.markdownContainer}>
            <MarkdownContainer content={linkedinProfile.profile_doc || ""} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default observer(LinkedinProfileDetail);
