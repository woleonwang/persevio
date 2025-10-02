import { useEffect, useState } from "react";
import classnames from "classnames";
import { useTranslation } from "react-i18next";

import { Get, Post } from "@/utils/request";

import styles from "./style.module.less";
import { Button, Empty, message } from "antd";
import ConnectionsList, {
  getFinalStatus,
  TCandidateConnectionForCandidate,
} from "../components/ConnectionsList";

const CandidateHome = () => {
  const [connections, setConnections] = useState<
    TCandidateConnectionForCandidate[]
  >([]);
  const [candidateTasks, setCandidateTasks] = useState<ICandidateTask[]>([]);

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`candidate_home.${key}`);

  useEffect(() => {
    fetchCandidateTasks();
    fetchConnections();
  }, []);

  const fetchCandidateTasks = async () => {
    const { code, data } = await Get<{
      tasks: ICandidateTask[];
    }>("/api/candidate/network/tasks");
    if (code === 0) {
      setCandidateTasks(data.tasks ?? []);
    }
  };

  const fetchConnections = async () => {
    const response = await Get<{
      candidate_connections: TCandidateConnectionForCandidate[];
    }>("/api/candidate/network/candidate_connections");
    if (response.code === 0) {
      setConnections(response.data.candidate_connections ?? []);
    }
  };

  const finisheTask = async (taskId: number) => {
    const { code } = await Post(
      `/api/candidate/network/tasks/${taskId}/finish`
    );
    if (code === 0) {
      message.success("任务已完成");
      fetchCandidateTasks();
    }
  };

  const visiableConnections = connections.filter((connection) =>
    ["pending"].includes(
      getFinalStatus(connection.status, connection.target_status)
    )
  );

  const taskTexts = {
    connection_approved: {
      title: "匹配成功!",
      content: (params: { target_candidate_name: string }) =>
        `已与【${params.target_candidate_name}】匹配成功，请及时联系，确定会议日程。`,
    },
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>{t("home")}</div>
      <div className={styles.homeTitle}>欢迎回来！</div>
      <div className={classnames(styles.homePanel, styles.tasks)}>
        <div className={styles.title}>{t("important_tasks")}</div>
        <div className={styles.taskCardWrapper}>
          {candidateTasks.length > 0 ? (
            candidateTasks.map((task) => {
              const title = taskTexts[task.task_type]?.title;
              const content = taskTexts[task.task_type]?.content?.(
                JSON.parse(task.task_params)
              );
              return (
                <div className={styles.taskCard} key={task.id}>
                  <div className={styles.taskCardTitle}>{title}</div>
                  <div className={styles.taskCardHint}>{content}</div>
                  <div>
                    <Button
                      type="primary"
                      shape="round"
                      onClick={() => {
                        finisheTask(task.id);
                      }}
                      style={{ width: "100%", marginTop: 20 }}
                    >
                      Start Now
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <Empty description="暂无任务" style={{ margin: "30px auto" }} />
          )}
        </div>
      </div>
      <div className={styles.homePanel}>
        <div className={styles.title}>为您推荐的人</div>
        <div>
          {visiableConnections.length > 0 ? (
            <ConnectionsList
              connections={visiableConnections}
              onRefresh={fetchConnections}
            />
          ) : (
            <Empty description="暂无推荐" style={{ marginTop: 50 }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateHome;
