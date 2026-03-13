import { useEffect, useMemo, useState } from "react";
import { Button, Dropdown, Modal, Popover, Select, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

import {
  FUNNEL_COLORS,
  FUNNEL_BG_COLORS,
} from "@/components/JobDetailsForAts/components/JobAnalytics/colors";
import EvaluateResultBadge from "@/components/EvaluateResultBadge";
import InterviewForm from "@/components/NewTalentDetail/components/InterviewForm";
import TalentEvaluateFeedbackWithReasonModal from "@/components/TalentEvaluateFeedbackWithReasonModal";
import List from "@/assets/icons/list";
import { EVALUATE_RESULT_LEVEL_KEYS } from "@/utils";
import { Post } from "@/utils/request";
import { getDaysInStage, getStageKey } from "@/utils/talentStage";
import TalentPopoverContent from "@/components/TalentPopoverContent";
import { getCandidateCardData } from "./utils";

import styles from "./style.module.less";

export type PipelineStageLike = {
  id: string;
  name: string;
  isDefault?: boolean;
};

export type ListModeTableVariant = "pipeline" | "talents";

interface IProps {
  variant?: ListModeTableVariant;
  allStages?: PipelineStageLike[];
  items: TTalentListItem[];
  onRowClick: (item: TTalentListItem) => void;
  onUpdateTalent?: () => void;
}

const getCurrentWorkExperience = (
  list?: TTalentListItem["basicInfo"]["work_experiences"],
) => {
  const arr = list ?? [];
  return arr.find((w) => w.is_present) ?? arr[0];
};

const ListModeTable = ({
  variant = "pipeline",
  allStages = [],
  items,
  onRowClick,
  onUpdateTalent,
}: IProps) => {
  const { t } = useTranslation();
  const tKey = (key: string) => t(`job_details.pipeline_section.${key}`);

  const [viewedMap, setViewedMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const next: Record<number, boolean> = {};
    items.forEach((talent) => {
      next[talent.id] = !!talent.viewed_at;
    });
    setViewedMap(next);
  }, [items]);

  const wrapCell = (record: TTalentListItem, children: React.ReactNode) => {
    const hasViewed = viewedMap[record.id] ?? !!record.viewed_at;
    const handleOpenChange = (open: boolean) => {
      if (open && !hasViewed && !record.viewed_at) {
        setViewedMap((prev) => ({ ...prev, [record.id]: true }));
        Post(`/api/jobs/${record.job_id}/talents/${record.id}/viewed`, {});
      }
    };

    return (
      <Popover
        content={
          <TalentPopoverContent
            talent={record}
            onUpdateTalent={onUpdateTalent ?? (() => {})}
          />
        }
        trigger="hover"
        placement="right"
        mouseEnterDelay={0.5}
        onOpenChange={handleOpenChange}
      >
        <span className={styles.cellTrigger}>{children}</span>
      </Popover>
    );
  };

  const enablePipelineActions =
    variant === "pipeline" &&
    typeof onUpdateTalent === "function" &&
    allStages.length > 0;

  const [actionRecord, setActionRecord] = useState<TTalentListItem | null>(
    null,
  );
  const [moveStageOpen, setMoveStageOpen] = useState(false);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string | undefined>();

  const customStages = allStages.filter((s) => !s.isDefault);
  const moveStageOptions =
    customStages.length > 0
      ? customStages
      : allStages.filter((s) => s.id !== "rejected");

  const sortedTalents = useMemo(() => {
    return [...items].sort((a, b) => {
      const fitLevelA =
        a.parsedEvaluateResult?.overall_recommendation?.result ||
        a.parsedEvaluateResult?.result ||
        "maybe";
      const fitLevelB =
        b.parsedEvaluateResult?.overall_recommendation?.result ||
        b.parsedEvaluateResult?.result ||
        "maybe";

      if (fitLevelA === fitLevelB) {
        return dayjs(b.created_at).diff(dayjs(a.created_at));
      }

      return (
        EVALUATE_RESULT_LEVEL_KEYS.indexOf(fitLevelA) -
        EVALUATE_RESULT_LEVEL_KEYS.indexOf(fitLevelB)
      );
    });
  }, [items]);

  const updateTalentStatus = async (
    record: TTalentListItem,
    feedback?: string,
  ) => {
    if (!onUpdateTalent) return;
    const { code } = await Post(
      `/api/jobs/${record.job_id}/talents/${record.id}`,
      {
        status: "rejected",
        feedback,
      },
    );
    if (code === 0) {
      onUpdateTalent();
      setRejectOpen(false);
      message.success(t("job_details.saveSuccess"));
    }
  };

  const handleMoveStageOk = async () => {
    if (!onUpdateTalent) return;
    if (!actionRecord || !selectedStageId) return;
    const { code } = await Post(
      `/api/jobs/${actionRecord.job_id}/talents/${actionRecord.id}/stage`,
      { stage_id: selectedStageId },
    );
    if (code === 0) {
      onUpdateTalent();
      setMoveStageOpen(false);
      setActionRecord(null);
      message.success(t("job_details.saveSuccess"));
    }
  };

  const pipelineColumns: ColumnsType<TTalentListItem> = [
    {
      title: tKey("candidate_name"),
      dataIndex: "name",
      width: 180,
      render: (_: unknown, record: TTalentListItem) => {
        const { name } = getCandidateCardData(record);
        const hasViewed = viewedMap[record.id] ?? !!record.viewed_at;
        return wrapCell(
          record,
          <span className={styles.nameWithDot}>
            {name}
            {!hasViewed && !record.viewed_at && (
              <span className={styles.unreadDot} />
            )}
          </span>,
        );
      },
    },
    {
      title: tKey("stage"),
      dataIndex: "stage",
      render: (_: unknown, record: TTalentListItem) => {
        const stageKey = getStageKey(record);
        const stageLabel = allStages.find((s) => s.id === stageKey)?.name || "";
        const stageIndex = allStages.findIndex((s) => s.id === stageKey);
        const colorIndex =
          stageIndex >= 0 ? stageIndex % FUNNEL_BG_COLORS.length : 0;
        const bgColor = FUNNEL_BG_COLORS[colorIndex];
        const textColor = FUNNEL_COLORS[colorIndex];
        return wrapCell(
          record,
          <span
            className={styles.stageBadge}
            style={{
              backgroundColor: bgColor,
              color: textColor,
              borderColor: textColor,
            }}
          >
            {stageLabel}
          </span>,
        );
      },
      width: 140,
    },
    {
      title: tKey("overall_fit"),
      dataIndex: "fit",
      render: (_: unknown, record: TTalentListItem) => {
        const { fitResult } = getCandidateCardData(record);
        return wrapCell(
          record,
          <div style={{ width: "fit-content" }}>
            <EvaluateResultBadge result={fitResult} size="small" />
          </div>,
        );
      },
      width: 160,
    },
    {
      title: tKey("experience"),
      dataIndex: "experience",
      render: (_: unknown, record: TTalentListItem) => {
        const { exp } = getCandidateCardData(record);
        return wrapCell(record, <span className={styles.ellipsis}>{exp}</span>);
      },
      width: 160,
    },
    {
      title: tKey("visa_status"),
      dataIndex: "visa_status",
      render: (_: unknown, record: TTalentListItem) => {
        const { visa } = getCandidateCardData(record);
        return wrapCell(
          record,
          <span className={styles.ellipsis}>{visa}</span>,
        );
      },
      width: 160,
    },
    {
      title: tKey("current_comp"),
      dataIndex: "current_comp",
      render: (_: unknown, record: TTalentListItem) => {
        const { comp } = getCandidateCardData(record);
        return wrapCell(
          record,
          <span className={styles.ellipsis}>{comp}</span>,
        );
      },
      width: 160,
    },
    {
      title: tKey("days_in_stage"),
      dataIndex: "days_in_stage",
      render: (_: unknown, record: TTalentListItem) => {
        const daysInStageValue = getDaysInStage(record);
        const text =
          daysInStageValue != null ? daysInStageValue.toFixed(1) : "--";
        return wrapCell(record, text);
      },
      width: 140,
    },
    ...(enablePipelineActions
      ? ([
          {
            title: tKey("actions"),
            key: "actions",
            width: 100,
            fixed: "right",
            render: (_: unknown, record: TTalentListItem) => {
              const interview = record.interviews?.[0];
              const hasScheduledInterview =
                interview &&
                (interview.mode === "written" || !!interview.scheduled_at);

              const menuItems = [
                {
                  key: "move_stage",
                  label: tKey("move_stage"),
                  onClick: () => {
                    setActionRecord(record);
                    setSelectedStageId(undefined);
                    setMoveStageOpen(true);
                  },
                },
                {
                  key: "schedule",
                  label: hasScheduledInterview
                    ? tKey("view_interview_info")
                    : tKey("schedule_interview"),
                  onClick: () => {
                    setActionRecord(record);
                    setInterviewOpen(true);
                  },
                },
                ...(record.status !== "rejected"
                  ? [
                      {
                        key: "reject",
                        label: tKey("reject"),
                        danger: true,
                        onClick: () => {
                          setActionRecord(record);
                          if (record.evaluate_feedback) {
                            updateTalentStatus(
                              record,
                              record.evaluate_feedback_reason,
                            );
                          } else {
                            setRejectOpen(true);
                          }
                        },
                      },
                    ]
                  : []),
              ];

              return (
                <div
                  className={styles.actionsCell}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
                    <Button
                      variant="outlined"
                      style={{ borderRadius: 8 }}
                      icon={<List />}
                      className={styles.actionsBtn}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Dropdown>
                </div>
              );
            },
          },
        ] as ColumnsType<TTalentListItem>)
      : []),
  ];

  const talentsColumns: ColumnsType<TTalentListItem> = [
    {
      title: "Candidate",
      dataIndex: "name",
      width: 180,
      render: (_: unknown, record) => {
        const { name } = getCandidateCardData(record);
        const hasViewed = viewedMap[record.id] ?? !!record.viewed_at;
        return wrapCell(
          record,
          <span className={styles.nameWithDot}>
            {name}
            {!hasViewed && !record.viewed_at && (
              <span className={styles.unreadDot} />
            )}
          </span>,
        );
      },
    },
    {
      title: "Job Title",
      dataIndex: "job_title",
      width: 220,
      render: (_: unknown, record) => {
        const work = getCurrentWorkExperience(
          record.basicInfo?.work_experiences,
        );
        const currentJobTitle = work?.job_title || "-";
        return wrapCell(
          record,
          <span className={styles.ellipsis}>{currentJobTitle}</span>,
        );
      },
    },
    {
      title: "Company",
      dataIndex: "company",
      width: 220,
      render: (_: unknown, record) => {
        const work = getCurrentWorkExperience(
          record.basicInfo?.work_experiences,
        );
        const currentCompany = work?.company_name || "-";
        return wrapCell(
          record,
          <span className={styles.ellipsis}>{currentCompany}</span>,
        );
      },
    },
    {
      title: "Experience",
      dataIndex: "experience",
      width: 160,
      render: (_: unknown, record) => {
        const { exp } = getCandidateCardData(record);
        return wrapCell(record, <span className={styles.ellipsis}>{exp}</span>);
      },
    },
    {
      title: "Visa Status",
      dataIndex: "visa_status",
      width: 160,
      render: (_: unknown, record) => {
        const { visa } = getCandidateCardData(record);
        return wrapCell(
          record,
          <span className={styles.ellipsis}>{visa}</span>,
        );
      },
    },
    {
      title: "Current Comp",
      dataIndex: "comp",
      width: 180,
      render: (_: unknown, record) => {
        const { comp } = getCandidateCardData(record);
        return wrapCell(
          record,
          <span className={styles.ellipsis}>{comp}</span>,
        );
      },
    },
  ];

  return (
    <div className={styles.listTableWrap}>
      <div className={styles.listTable}>
        <Table<TTalentListItem>
          className={styles.listAntdTable}
          columns={variant === "pipeline" ? pipelineColumns : talentsColumns}
          dataSource={sortedTalents}
          scroll={{ x: "max-content" }}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          onRow={(record) => ({
            onClick: () => onRowClick(record),
          })}
        />
      </div>

      {enablePipelineActions && (
        <>
          <Modal
            title={tKey("move_stage_modal_title")}
            open={moveStageOpen}
            onCancel={() => {
              setMoveStageOpen(false);
              setActionRecord(null);
            }}
            onOk={handleMoveStageOk}
            okText={t("job_details.save")}
            okButtonProps={{
              disabled: !selectedStageId,
            }}
            destroyOnClose
          >
            <div className={styles.moveStageSelectWrap}>
              <Select
                className={styles.moveStageSelect}
                placeholder={tKey("move_stage_modal_title")}
                value={selectedStageId}
                onChange={setSelectedStageId}
                options={moveStageOptions.map((s) => ({
                  value: s.id,
                  label: s.name,
                }))}
              />
            </div>
          </Modal>

          <Modal
            open={interviewOpen}
            onCancel={() => {
              setInterviewOpen(false);
              setActionRecord(null);
            }}
            width="fit-content"
            centered
            title={
              actionRecord?.interviews?.[0]
                ? tKey("view_interview_info")
                : tKey("schedule_interview")
            }
            footer={null}
            destroyOnClose
          >
            {actionRecord && (
              <InterviewForm
                talent={actionRecord as TTalent}
                jobName={actionRecord.job?.name ?? ""}
                interview={
                  actionRecord.interviews?.[0] as TInterview | undefined
                }
                onClose={() => {
                  setInterviewOpen(false);
                  setActionRecord(null);
                }}
                onSubmit={() => {
                  onUpdateTalent?.();
                  setInterviewOpen(false);
                  setActionRecord(null);
                }}
              />
            )}
          </Modal>

          {actionRecord && (
            <TalentEvaluateFeedbackWithReasonModal
              jobId={actionRecord.job_id}
              talentId={actionRecord.id}
              open={rejectOpen}
              onOk={() => {
                setRejectOpen(false);
                setActionRecord(null);
                onUpdateTalent?.();
              }}
              onCancel={() => {
                setRejectOpen(false);
                setActionRecord(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ListModeTable;
