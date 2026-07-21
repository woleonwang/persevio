import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button, Input, Modal, Spin, message } from "antd";
import { useTranslation } from "react-i18next";

import { Get, Post } from "@/utils/request";
import {
  guestSessionStorage,
  tokenStorage,
  TGuestSession,
} from "@/utils/storage";
import StaffChat from "@/components/StaffChat";
import IntakeMembersHeader from "@/components/StaffChat/components/IntakeMembersHeader";
import InviteBanner from "@/assets/invite-banner@2x.png";
import InviteBannerCompact from "@/assets/invite-banner-compact@2x.png";

import styles from "./style.module.less";

type TPageView = "loading" | "invalid" | "landing" | "chat" | "left";

type TResolveData = {
  invitation_token: string;
  job_name: string;
  owner_name: string;
};

const GroupChatInvitePage = () => {
  const { groupChatUuid = "" } = useParams<{ groupChatUuid: string }>();
  const navigate = useNavigate();
  const { t: originalT } = useTranslation();
  const t = (key: string, params?: Record<string, string>) =>
    originalT(`group_chat_invite.${key}`, params);

  const [view, setView] = useState<TPageView>("loading");
  const [resolveData, setResolveData] = useState<TResolveData>();
  const [guestSession, setGuestSession] = useState<TGuestSession | null>(null);
  const [guestName, setGuestName] = useState("");
  const [joining, setJoining] = useState(false);
  const [memberships, setMemberships] = useState<TJobIntakeMembership[]>([]);
  const [membershipsRefreshSignal, setMembershipsRefreshSignal] = useState(0);
  const [leftMeta, setLeftMeta] = useState<{
    jobName: string;
    ownerName: string;
  }>();

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupChatUuid]);

  const bootstrap = async () => {
    if (!groupChatUuid) {
      setView("invalid");
      return;
    }

    const { code, data } = await Get<TResolveData>(
      `/api/guest/group_chat/${groupChatUuid}/resolve`,
    );
    if (code !== 0 || !data) {
      setView("invalid");
      return;
    }
    setResolveData(data);

    const staffToken = tokenStorage.getToken("staff");
    if (staffToken) {
      const joined = await joinAsStaff();
      if (joined) return;
    }

    const existing = guestSessionStorage.activate(groupChatUuid);
    if (existing) {
      setGuestSession(existing);
      setView("chat");
      return;
    }

    setView("landing");
  };

  const joinAsStaff = async () => {
    const { code, data } = await Post<{
      invitation_token: string;
      job_id?: string;
    }>(`/api/jobs/group_chat/${groupChatUuid}/join`, {});
    if (code === 0 && data?.invitation_token) {
      navigate(`/app/jobs/${data.invitation_token}/standard-board`, {
        replace: true,
      });
      return true;
    }
    return false;
  };

  const handleGuestJoin = async () => {
    const name = guestName.trim();
    if (!name) return;
    setJoining(true);
    const res = await Post<{
      session_token: string;
      guest_id: number;
      membership_id: number;
      invitation_token: string;
    }>(`/api/guest/group_chat/${groupChatUuid}/join`, { name });
    setJoining(false);

    if (res.code !== 0 || !res.data) {
      message.error((res as { message?: string }).message || t("join_failed"));
      if (res.code === 10002) {
        setView("invalid");
      }
      return;
    }
    const data = res.data;

    const session: TGuestSession = {
      sessionToken: data.session_token,
      guestId: data.guest_id,
      membershipId: data.membership_id,
      invitationToken: data.invitation_token,
      jobName: resolveData?.job_name,
      ownerName: resolveData?.owner_name,
    };
    guestSessionStorage.set(groupChatUuid, session);
    setGuestSession(session);
    setView("chat");
  };

  const handleSignIn = () => {
    const redirect = encodeURIComponent(
      `/app/jobs/group-chat/${groupChatUuid}`,
    );
    navigate(`/signin?redirect=${redirect}`);
  };

  const goToLeftPage = (session: TGuestSession) => {
    setLeftMeta({
      jobName: session.jobName || resolveData?.job_name || t("this_job"),
      ownerName: session.ownerName || resolveData?.owner_name || "",
    });
    guestSessionStorage.remove(groupChatUuid);
    setGuestSession(null);
    setView("left");
  };

  const leaveConversation = async (session: TGuestSession) => {
    const { code } = await Post(
      `/api/guest/jobs/${session.invitationToken}/chat/JOB_REQUIREMENT/leave`,
      {},
    );
    return code === 0;
  };

  const handleLeave = () => {
    if (!guestSession) return;
    Modal.confirm({
      title: t("leave_title"),
      content: t("leave_content"),
      okText: t("leave_confirm"),
      cancelText: originalT("cancel"),
      okButtonProps: { danger: true },
      onOk: async () => {
        const ok = await leaveConversation(guestSession);
        if (!ok) {
          message.error(t("leave_failed"));
          return;
        }
        goToLeftPage(guestSession);
      },
    });
  };

  const handleIntakeComplete = async () => {
    if (!guestSession) return;
    await leaveConversation(guestSession);
    goToLeftPage(guestSession);
  };

  if (view === "loading") {
    return (
      <div className={styles.centerPage}>
        <Spin size="large" />
      </div>
    );
  }

  if (view === "invalid") {
    return (
      <div className={styles.centerPage}>
        <section className={styles.card}>
          <img className={styles.banner} src={InviteBanner} alt="" />
          <h1 className={styles.title}>{t("invalid_title")}</h1>
          <p className={styles.description}>{t("invalid_description")}</p>
          <a className={styles.primaryBtn} href="/">
            {t("go_home")}
          </a>
        </section>
      </div>
    );
  }

  if (view === "left") {
    const jobName = leftMeta?.jobName || resolveData?.job_name || "";
    const ownerName = leftMeta?.ownerName || resolveData?.owner_name || "";
    return (
      <div className={styles.centerPage}>
        <section className={`${styles.card} ${styles.leftCard}`}>
          <img
            className={styles.bannerCompact}
            src={InviteBannerCompact}
            alt="Persevio"
          />
          <h1 className={styles.leftTitle}>
            {t("left_title_prefix")} <span>&quot;{jobName}&quot;</span>
          </h1>
          <p className={styles.leftDescription}>
            <span>{t("left_thanks")}</span>
            <span>
              {ownerName
                ? t("left_ask_owner", { name: ownerName })
                : t("left_ask_owner_fallback")}
            </span>
          </p>
          <a className={styles.primaryBtn} href="/">
            {t("go_home")}
          </a>
        </section>
      </div>
    );
  }

  if (view === "landing" && resolveData) {
    const canJoin = guestName.trim().length > 0;
    return (
      <div className={styles.centerPage}>
        <section className={styles.card}>
          <img className={styles.banner} src={InviteBanner} alt="" />
          <h1 className={styles.title}>
            {t("landing_title", { name: resolveData.owner_name })}{" "}
            <span>&quot;{resolveData.job_name}&quot;</span>
          </h1>
          <p className={styles.description}>{t("landing_description")}</p>
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              if (canJoin && !joining) handleGuestJoin();
            }}
          >
            <label className={styles.label} htmlFor="guest-name">
              {t("join_as_guest")}
            </label>
            <Input
              id="guest-name"
              className={styles.nameInput}
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder={t("name_placeholder")}
              maxLength={64}
              autoComplete="name"
            />
            <Button
              className={styles.joinBtn}
              type="primary"
              htmlType="submit"
              disabled={!canJoin}
              loading={joining}
            >
              {t("join_conversation")}
            </Button>
            <div className={styles.divider} aria-hidden>
              <span />
              <b>{t("or")}</b>
              <span />
            </div>
            <Button className={styles.signinBtn} onClick={handleSignIn}>
              {t("sign_in")}
            </Button>
            <p className={styles.accessNote}>{t("access_note")}</p>
          </form>
        </section>
      </div>
    );
  }

  if (view === "chat" && guestSession) {
    const jobName =
      guestSession.jobName || resolveData?.job_name || t("this_job");
    const ownerName =
      guestSession.ownerName || resolveData?.owner_name || "Owner";

    return (
      <div className={styles.chatPage}>
        <header className={styles.chatHeader}>
          <div className={styles.chatHeaderLeft}>
            <div className={styles.chatTitle}>{jobName}</div>
            <div className={styles.intakePill}>{t("intake_pill")}</div>
          </div>
          <div className={styles.chatHeaderRight}>
            <IntakeMembersHeader
              jobId={guestSession.invitationToken}
              chatTypePath="JOB_REQUIREMENT"
              memberships={memberships}
              ownerName={ownerName}
              isOwner={false}
              readOnly
              hideEmails
              onChanged={() => setMembershipsRefreshSignal((k) => k + 1)}
            />
            <Button className={styles.leaveBtn} onClick={handleLeave}>
              {t("leave")}
            </Button>
          </div>
        </header>
        <div className={styles.chatBody}>
          <StaffChat
            chatType="jobRequirementDoc"
            jobId={guestSession.invitationToken}
            viewerMode="guest"
            guestContext={{
              guestId: guestSession.guestId,
              membershipId: guestSession.membershipId,
              ownerName,
            }}
            hidePredefinedButtons
            hideRetry
            onMembershipsChange={setMemberships}
            membershipsRefreshSignal={membershipsRefreshSignal}
            onGuestAuthFailure={() => {
              guestSessionStorage.remove(groupChatUuid);
              setGuestSession(null);
              setView("landing");
            }}
            onNextTask={handleIntakeComplete}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.centerPage}>
      <Spin size="large" />
    </div>
  );
};

export default GroupChatInvitePage;
