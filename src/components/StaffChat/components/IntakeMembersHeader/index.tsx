import { Popover, Modal, message, Select } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import classnames from "classnames";

import { Get, Post } from "@/utils/request";
import Icon from "@/components/Icon";
import Delete from "@/assets/icons/delete";
import useStaffs from "@/hooks/useStaffs";
import {
  getActiveMemberships,
  getAvatarColor,
  getNameInitials,
  getStaffEmail,
} from "../../intakeCollabUtils";
import VionaAvatar from "@/assets/viona-avatar.png";

import styles from "./style.module.less";

type IProps = {
  jobId: string;
  chatTypePath: string;
  memberships: TJobIntakeMembership[];
  ownerName: string;
  ownerEmail?: string;
  isOwner: boolean;
  onChanged: () => void;
  /** Guest 外页：只读成员列表，不展示邮箱 / 不拉 collaborators */
  readOnly?: boolean;
  hideEmails?: boolean;
};

type TPerson = {
  key: string;
  name: string;
  email?: string;
  membershipId?: number;
  staffId?: number;
  collaboratorId?: number;
  collaboratorRole?: "hiring_manager" | "recruiter";
  role: "owner" | "ai" | "staff" | "guest";
  canRemove: boolean;
  canEditRole: boolean;
};

const IntakeMembersHeader = (props: IProps) => {
  const {
    jobId,
    chatTypePath,
    memberships,
    ownerName,
    ownerEmail,
    isOwner,
    onChanged,
    readOnly = false,
    hideEmails = false,
  } = props;
  const { t: originalT } = useTranslation();
  const t = (key: string, params?: Record<string, string>) =>
    originalT(`chat.intake_members.${key}`, params);
  const { staffs } = useStaffs();
  const [open, setOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<TJobCollaborator[]>([]);

  const active = useMemo(
    () => getActiveMemberships(memberships),
    [memberships],
  );

  const fetchCollaborators = async () => {
    if (readOnly) return;
    const { code, data } = await Get<TJobCollaboratorsResponse>(
      `/api/jobs/${jobId}/collaborators`,
    );
    if (code === 0) {
      setCollaborators(data.job_collaborators ?? []);
    }
  };

  useEffect(() => {
    if (open && !readOnly) {
      fetchCollaborators();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, jobId, readOnly]);

  const people = useMemo(() => {
    const list: TPerson[] = [
      {
        key: "owner",
        name: ownerName || "Owner",
        email: hideEmails ? undefined : ownerEmail,
        role: "owner",
        canRemove: false,
        canEditRole: false,
      },
      {
        key: "viona",
        name: "Viona",
        role: "ai",
        canRemove: false,
        canEditRole: false,
      },
    ];
    active.forEach((m) => {
      if (m.member_type === "guest") {
        list.push({
          key: `m-${m.id}`,
          name: m.name,
          membershipId: m.id,
          role: "guest",
          canRemove: !readOnly && isOwner,
          canEditRole: false,
        });
        return;
      }
      const collab = collaborators.find((c) => c.staff_id === m.staff_id);
      const staff = staffs.find((s) => s.id === m.staff_id);
      list.push({
        key: `m-${m.id}`,
        name: m.name,
        email: hideEmails ? undefined : getStaffEmail(staff),
        membershipId: m.id,
        staffId: m.staff_id,
        collaboratorId: collab?.id,
        collaboratorRole:
          collab?.role === "recruiter" ? "recruiter" : "hiring_manager",
        role: "staff",
        canRemove: !readOnly && isOwner,
        canEditRole: !readOnly && isOwner && !!collab?.id,
      });
    });
    return list;
  }, [
    active,
    ownerName,
    ownerEmail,
    isOwner,
    collaborators,
    staffs,
    readOnly,
    hideEmails,
  ]);

  const humanPeople = people.filter((p) => p.role !== "ai");

  const handleRemove = (membershipId: number, name: string) => {
    Modal.confirm({
      title: t("remove_title"),
      content: t("remove_content", { name }),
      okText: originalT("confirm"),
      cancelText: originalT("cancel"),
      okButtonProps: { danger: true },
      onOk: async () => {
        const { code } = await Post(
          `/api/jobs/${jobId}/chat/${chatTypePath}/memberships/${membershipId}/remove`,
          {},
        );
        if (code === 0) {
          message.success(t("removed"));
          onChanged();
        } else {
          message.error(t("remove_failed"));
        }
      },
    });
  };

  const handleUpdateRole = async (
    person: TPerson,
    role: "hiring_manager" | "recruiter",
  ) => {
    if (!person.collaboratorId || person.collaboratorRole === role) return;
    const { code } = await Post(
      `/api/jobs/${jobId}/collaborators/${person.collaboratorId}`,
      { role },
    );
    if (code === 0) {
      message.success(t("role_updated"));
      await fetchCollaborators();
      onChanged();
    } else {
      message.error(t("role_update_failed"));
    }
  };

  const roleOptions = [
    { value: "hiring_manager", label: t("role_hiring_manager") },
    { value: "recruiter", label: t("role_recruiter") },
  ];

  const content = (
    <div className={styles.popover}>
      <div className={styles.popoverTitle}>
        {t("in_conversation", { count: String(people.length) })}
      </div>
      <div className={styles.list}>
        {people.map((p) => (
          <div key={p.key} className={styles.row}>
            {p.role === "ai" ? (
              <img
                className={styles.avatarImage}
                src={VionaAvatar}
                alt="Viona"
              />
            ) : (
              <div
                className={styles.avatar}
                style={{ background: getAvatarColor(p.key) }}
              >
                {getNameInitials(p.name)}
              </div>
            )}
            <div
              className={classnames(styles.info, {
                [styles.infoSingle]: !p.email,
              })}
            >
              <div className={styles.nameLine}>
                <span className={styles.name}>{p.name}</span>
                {p.canEditRole ? (
                  <Select
                    className={classnames(styles.roleSelect, {
                      [styles.roleHiring]:
                        p.collaboratorRole === "hiring_manager",
                      [styles.roleRecruiter]:
                        p.collaboratorRole === "recruiter",
                    })}
                    value={p.collaboratorRole}
                    options={roleOptions}
                    onChange={(role: "hiring_manager" | "recruiter") =>
                      handleUpdateRole(p, role)
                    }
                    popupMatchSelectWidth={false}
                    variant="borderless"
                    size="small"
                  />
                ) : (
                  <span
                    className={classnames(styles.rolePill, {
                      [styles.roleOwner]: p.role === "owner",
                      [styles.roleAi]: p.role === "ai",
                      [styles.roleGuest]: p.role === "guest",
                      [styles.roleHiring]: p.role === "staff",
                    })}
                  >
                    {p.role === "staff"
                      ? t(
                          p.collaboratorRole === "recruiter"
                            ? "role_recruiter"
                            : "role_hiring_manager",
                        )
                      : t(`role_${p.role}`)}
                  </span>
                )}
              </div>
              {p.email && (
                <div className={styles.email} title={p.email}>
                  {p.email}
                </div>
              )}
            </div>
            {p.canRemove && p.membershipId != null && (
              <Icon
                className={styles.removeBtn}
                onClick={() => handleRemove(p.membershipId!, p.name)}
                icon={<Delete />}
                style={{ fontSize: 16 }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      classNames={{ root: styles.popoverOverlay }}
    >
      <button
        type="button"
        className={styles.avatarGroup}
        aria-label={t("in_conversation", { count: String(people.length) })}
      >
        {humanPeople.map((p) => (
          <span
            key={p.key}
            className={styles.avatarCircle}
            style={{ background: getAvatarColor(p.key) }}
            title={p.name}
          >
            {getNameInitials(p.name)}
          </span>
        ))}
      </button>
    </Popover>
  );
};

export default IntakeMembersHeader;
