import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  message,
  Spin,
  Table,
  Tag,
} from "antd";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ExportOutlined, RightOutlined } from "@ant-design/icons";
import classnames from "classnames";

import { checkJobDotStatus, setJobDotStatus } from "@/utils";
import useJob from "@/hooks/useJob";
import { Get, Post } from "@/utils/request";

import VionaAvatar from "@/assets/viona-avatar.png";
import styles from "./style.module.less";
import ChatRoomNew from "@/components/ChatRoomNew";
import { ColumnsType } from "antd/es/table";

type TJobState = "jrd" | "jd" | "preview" | "board";

const JobBoard = () => {
  const { job, fetchJob } = useJob();

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_board.${key}`);
  const navigate = useNavigate();

  const [talents, setTalents] = useState<TTalent[]>([]);
  const [jobState, setJobState] = useState<TJobState>();

  useEffect(() => {
    if (job) {
      fetchTalents();
      if (job.posted_at) {
        setJobState("board");
      } else if (job.jd_doc_id) {
        setJobState("preview");
      } else if (job.requirement_doc_id) {
        setJobState("jd");
      } else {
        setJobState("jrd");
      }
    }
  }, [job]);
  const fetchTalents = async () => {
    const { code, data } = await Get<{
      talents: TTalent[];
    }>(`/api/jobs/${job?.id}/talents`);

    if (code === 0) {
      setTalents(data.talents);
    }
  };

  if (!job) {
    return <Spin />;
  }

  const VionaAvatarDiv = (
    <div className={styles.avatar}>
      <Avatar src={VionaAvatar} />
      <div>Viona</div>
    </div>
  );

  const columns: ColumnsType<TTalent> = [
    {
      title: "候选人姓名",
      dataIndex: "name",
    },
    // {
    //   title: "邮箱地址",
    //   dataIndex: "email",
    // },
    // {
    //   title: "手机号码",
    //   dataIndex: "phone",
    // },
    {
      title: "筛选状态",
      dataIndex: "status",
      render: (status: string) => {
        if (status === "accepted") {
          return <Tag color="green">已通过</Tag>;
        }
        if (status === "rejected") {
          return <Tag color="red">未通过</Tag>;
        }
        return <Tag color="blue">未筛选</Tag>;
      },
    },
    {
      title: "操作",
      dataIndex: "action",
      render: (_, record) => {
        return (
          <Button
            type="link"
            onClick={() => {
              navigate(`/app/jobs/${job.id}/talents/${record.id}/detail`);
            }}
          >
            查看
          </Button>
        );
      },
    },
  ];

  const stepItems = [
    {
      title: "Create Position",
      key: "create",
    },
    {
      title: "Detailed Define<br/>Job Requirements",
      key: "jrd",
    },
    {
      title: "Define Job<br/>Description",
      key: "jd",
    },
    {
      title: "Position Preview",
      key: "preview",
    },
    {
      title: "Confirm to Publish",
      key: "confirm",
    },
  ];

  const currentIndex =
    stepItems.findIndex((step) => step.key === jobState) ?? 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {jobState === "board" ? (
          <>
            <div className={styles.title}>{job.name}</div>
            <div className={styles.right} style={{ top: 24 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: "#3682fe",
                  cursor: "pointer",
                }}
                onClick={async () => {
                  window.open(`${window.origin}/jobs/${job.id}/chat`);
                }}
              >
                <ExportOutlined />
                <div>{t("recruitment_chatbot")}</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={styles.title}>{job.name}</div>
            <div className={styles.right}>
              <Breadcrumb
                items={stepItems}
                itemRender={(item) => {
                  const itemIndex = stepItems.findIndex(
                    (step) => step.key === item.key
                  );
                  let status: "done" | "process" | "wait" = "wait";
                  if (itemIndex < currentIndex) {
                    status = "done";
                  } else if (currentIndex === itemIndex) {
                    status = "process";
                  }
                  return (
                    <span
                      className={classnames(styles.stepItem, styles[status])}
                      dangerouslySetInnerHTML={{ __html: item.title as string }}
                    />
                  );
                }}
                separator={<RightOutlined />}
              />
            </div>
          </>
        )}
      </div>
      <div className={styles.body}>
        {jobState === "jrd" && (
          <ChatRoomNew
            chatType="jobRequirementDoc"
            jobId={job.id}
            onNextTask={() => setJobState("jd")}
            allowEditMessage={true}
          />
        )}
        {jobState === "jd" && (
          <ChatRoomNew
            chatType="jobDescription"
            jobId={job.id}
            onNextTask={() => setJobState("preview")}
            allowEditMessage={true}
          />
        )}
        {jobState === "preview" && (
          <div className={styles.previewContainer}>
            <div className={styles.previewHeader}>
              A preview of the job position has been generated. Please review
              the information carefully. Once you confirm that everything is
              correct, click the "Confirm and Post" button at the bottom of the
              page to publish the position to the Persevio recruitment website.
            </div>
            <iframe
              src={`/jobs/${job.id}/chat?preview=1`}
              style={{
                border: "1px solid #eee",
                flex: "auto",
                width: "100%",
                borderRadius: 16,
              }}
            />
            <div
              style={{
                padding: 12,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                type="primary"
                onClick={async () => {
                  const { code } = await Post(`/api/jobs/${job.id}/post_job`, {
                    open: "1",
                  });
                  if (code === 0) {
                    message.success(t("operation_success"));
                    fetchJob();
                  }
                }}
              >
                {t("post_job")}
              </Button>
            </div>
          </div>
        )}
        {jobState === "board" && (
          <div
            style={{
              padding: "0 120px",
              flex: "auto",
              display: "flex",
              flexDirection: "column",
              overflow: "auto",
            }}
          >
            <div className={styles.block}>
              {VionaAvatarDiv}
              <div>{t("complete_conversation_tasks")}</div>
              <div className={styles.buttonContainer}>
                <Badge
                  dot={
                    !!job.requirement_doc_id &&
                    !checkJobDotStatus(job.id, "job_description_doc")
                  }
                >
                  <Button
                    // disabled={!job.requirement_doc_id}
                    onClick={() => {
                      setJobDotStatus(job.id, "job_description_doc");
                      navigate(`/app/jobs/${job.id}/document/job-requirement`);
                    }}
                    size="large"
                  >
                    {t("job_requirement_table")}
                  </Button>
                </Badge>
                <Badge
                  dot={
                    !!job.jd_doc_id &&
                    !checkJobDotStatus(job.id, "job_description_doc")
                  }
                >
                  <Button
                    // disabled={!job.jd_doc_id}
                    onClick={() => {
                      setJobDotStatus(job.id, "job_description_doc");
                      navigate(`/app/jobs/${job.id}/document/job-description`);
                    }}
                    size="large"
                  >
                    {t("job_description_jd")}
                  </Button>
                </Badge>
              </div>
            </div>

            <div className={styles.block}>
              <h3>候选人列表</h3>
              <Table
                columns={columns}
                dataSource={talents}
                pagination={{
                  pageSize: 10,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobBoard;
