import { Breadcrumb, Button, FloatButton, message, Spin } from "antd";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  CheckCircleFilled,
  FileOutlined,
  RightOutlined,
} from "@ant-design/icons";
import classnames from "classnames";

import { observer } from "mobx-react-lite";
import useJob from "@/hooks/useJob";
import useStaffs from "@/hooks/useStaffs";

import styles from "./style.module.less";
import StaffChat from "@/components/StaffChat";
import IntakeMembersHeader from "@/components/StaffChat/components/IntakeMembersHeader";
import Icon from "@/components/Icon";
import UserPlus from "@/assets/icons/user-plus";
import globalStore from "@/store/global";
import { addQuery, getQuery, infoModal } from "@/utils";
import JobDetailsForAts from "@/components/JobDetailsForAts";
import JobDetails from "@/components/JobDetails";
import { Post } from "@/utils/request";
import RoleBasicsStage from "./components/RoleBasicsStage";
import RoleBriefingStage from "./components/RoleBriefingStage";
import { storage, StorageKey } from "@/utils/storage";

type TJobState = "roleBasics" | "roleBriefing" | "jrd" | "jd" | "board";

const JobBoard = observer(() => {
  const { job, fetchJob } = useJob();
  const { staffs } = useStaffs();

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_board.${key}`);
  const tChat = (key: string) => originalT(`chat.${key}`);

  const [jobState, setJobState] = useState<TJobState>();
  const [intakeMemberships, setIntakeMemberships] = useState<
    TJobIntakeMembership[]
  >([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [membershipsRefreshSignal, setMembershipsRefreshSignal] = useState(0);

  const { setMenuCollapse, fetchJobs, isAdmin, email } = globalStore;

  const isFromAdmin = !!storage.get(StorageKey.ADMIN_TOKEN);

  const isOld = getQuery("old") === "1";

  const ownerStaff = staffs.find((s) => s.id === job?.staff_id);
  const currentStaff = staffs.find((s) => s.account?.username === email);
  const isJobOwner =
    !!job && !!currentStaff && currentStaff.id === job.staff_id;
  const ownerName = ownerStaff?.name || "Owner";

  useEffect(() => {
    if (job) {
      if (job.initial_posted_at) {
        setJobState("board");
      } else if (job.requirement_doc_id) {
        setJobState("jd");
        setMenuCollapse(true);
      } else if (job.reference_doc_id) {
        setJobState("jrd");
        setMenuCollapse(true);
      } else if (job.basic_info_doc_id) {
        setJobState("roleBriefing");
      } else {
        setJobState("roleBasics");
      }
    } else {
      setJobState(undefined);
    }
  }, [job]);

  const postJob = async () => {
    if (!job) return;

    if (!job.initial_posted_at) {
      const { code } = await Post(
        `/api/jobs/${job.invitation_token}/post_job`,
        {
          open: "1",
        },
      );

      if (code === 0) {
        fetchJobs();
      } else {
        message.error(originalT("submit_failed"));
        return;
      }
    }

    addQuery("tab", "sourcingChannels");
    setJobState("board");
    infoModal({
      title: t("published_successfully"),
      content: t("published_success_content"),
    });
  };

  if (!job) {
    return <Spin />;
  }

  const jobSeg = job.invitation_token;

  const stepItems = [
    {
      title: t("step_create_new_job"),
      key: "create",
    },
    {
      title: t("step_role_basics"),
      key: "roleBasics",
    },
    {
      title: t("step_role_briefing"),
      key: "roleBriefing",
    },
    {
      title: t("step_job_intake"),
      key: "jrd",
    },
    {
      title: t("step_draft_jd"),
      key: "jd",
    },
    {
      title: t("step_publish"),
      key: "confirm",
    },
  ];

  const currentIndex =
    stepItems.findIndex((step) => step.key === jobState) ?? 0;

  const renderBreadcrumb = () => (
    <Breadcrumb
      items={stepItems}
      itemRender={(item) => {
        const itemIndex = stepItems.findIndex((step) => step.key === item.key);
        let status: "done" | "process" | "wait" = "wait";
        if (itemIndex < currentIndex) {
          status = "done";
        } else if (currentIndex === itemIndex) {
          status = "process";
        }
        return (
          <div className="flex-center">
            {status === "done" && (
              <CheckCircleFilled
                style={{
                  color: "rgba(54, 198, 141, 1)",
                  fontSize: 18,
                  marginRight: 8,
                }}
              />
            )}
            <span
              className={classnames(styles.stepItem, styles[status])}
              dangerouslySetInnerHTML={{ __html: item.title as string }}
            />
          </div>
        );
      }}
      separator={<RightOutlined />}
    />
  );

  return (
    <div className={styles.container}>
      {jobState !== "board" && (
        <div
          className={classnames(styles.header, {
            [styles.headerIntake]: jobState === "jrd",
          })}
        >
          {jobState === "jrd" ? (
            <>
              <div className={styles.headerLeft}>
                <div className={styles.title}>{job.name}</div>
                <div className={styles.breadcrumbRow}>{renderBreadcrumb()}</div>
              </div>
              <div className={styles.headerRight}>
                <IntakeMembersHeader
                  jobId={jobSeg}
                  chatTypePath="JOB_REQUIREMENT"
                  memberships={intakeMemberships}
                  ownerName={ownerName}
                  ownerEmail={ownerStaff?.account?.username || ""}
                  isOwner={isJobOwner}
                  onChanged={() => setMembershipsRefreshSignal((k) => k + 1)}
                />
                {isJobOwner && (
                  <Button
                    type="primary"
                    className={styles.inviteBtn}
                    icon={
                      <Icon
                        icon={<UserPlus />}
                        className={styles.inviteIcon}
                        style={{ fontSize: 20 }}
                      />
                    }
                    onClick={() => setInviteOpen(true)}
                  >
                    {tChat("invite_btn")}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className={styles.title}>{job.name}</div>
              <div className={styles.right}>{renderBreadcrumb()}</div>
            </>
          )}
        </div>
      )}
      <div className={styles.body}>
        {jobState === "roleBasics" && (
          <RoleBasicsStage
            jobId={jobSeg}
            onSuccess={async () => {
              await fetchJob();
            }}
          />
        )}
        {jobState === "roleBriefing" && (
          <RoleBriefingStage
            jobId={jobSeg}
            onSuccess={async () => {
              await fetchJob();
            }}
          />
        )}
        {jobState === "jrd" && (
          <StaffChat
            chatType="jobRequirementDoc"
            jobId={jobSeg}
            onNextTask={() => setJobState("jd")}
            key={`jrd-${job.id}`}
            onMembershipsChange={setIntakeMemberships}
            inviteCollaboratorsOpen={inviteOpen}
            onInviteCollaboratorsOpenChange={setInviteOpen}
            membershipsRefreshSignal={membershipsRefreshSignal}
          />
        )}
        {jobState === "jd" && (
          <StaffChat
            chatType="jobDescription"
            jobId={jobSeg}
            onNextTask={() => {
              postJob();
            }}
            key={`jd-${job.id}`}
          />
        )}
        {jobState === "board" && (
          <div className={styles.boardContent}>
            {isOld ? <JobDetails /> : <JobDetailsForAts />}
          </div>
        )}
      </div>
      {(isAdmin || isFromAdmin) && (
        <FloatButton
          icon={<FileOutlined />}
          onClick={() => {
            window.open(`/app/jobs/${jobSeg}/internal-documents`, "_blank");
          }}
        />
      )}
    </div>
  );
});

export default JobBoard;
