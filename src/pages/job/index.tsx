import { useEffect, useRef, useState } from "react";
import ChatRoom from "../../components/ChatRoom";
import styles from "./style.module.less";
// import { ProfileOutlined } from "@ant-design/icons";
import { Tabs } from "antd";
import { useParams } from "react-router";
import JobInformation, { TJobDocType } from "../../components/JobInformation";
import { observer } from "mobx-react-lite";
import globalStore from "../../store/global";
import { useTranslation } from "react-i18next";
import Talents from "./components/talents";

export type TTabKey = "chat" | "info" | "talents";
export type onChangeTabFunction = (
  tab: TTabKey,
  options?: { docType?: TJobDocType }
) => void;

const Job = () => {
  const { jobId: jobIdStr } = useParams<{ jobId: string }>();
  const jobId = parseInt(jobIdStr ?? "0");
  const [status, setStatus] = useState<TTabKey>("chat");

  const initDocTypeRef = useRef<TJobDocType>();

  const { setMenuCollapse } = globalStore;

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job.${key}`);

  useEffect(() => {
    setMenuCollapse(true);
  }, []);

  useEffect(() => {
    initDocTypeRef.current = undefined;
  }, [jobId]);

  return (
    <div className={styles.container}>
      <div className={styles.jobMain}>
        {jobId && (
          <>
            <Tabs
              centered
              activeKey={status}
              items={[
                {
                  key: "chat",
                  label: t("chat"),
                },
                {
                  key: "info",
                  label: t("document"),
                },
                {
                  key: "talents",
                  label: t("talents"),
                },
              ]}
              onChange={(type) => {
                // initDocTypeRef.current = undefined;
                setStatus(type as TTabKey);
              }}
              className={styles.tabs}
            />
            {status === "chat" && (
              <div className={styles.chatWrapper}>
                <ChatRoom
                  jobId={jobId}
                  allowEditMessage
                  userRole="staff"
                  onChangeTab={(tab, options) => {
                    initDocTypeRef.current = options?.docType ?? undefined;
                    setStatus(tab);
                  }}
                />
              </div>
            )}
            {status === "info" && (
              <div className={styles.chatWrapper}>
                <JobInformation
                  jobId={jobId}
                  activeDocType={initDocTypeRef.current}
                />
              </div>
            )}
            {status === "talents" && (
              <div className={styles.chatWrapper}>
                <Talents jobId={jobId} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default observer(Job);
