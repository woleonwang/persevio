import { useEffect, useMemo, useState } from "react";
import { Button, Dropdown, Modal, Popover, Table, Tooltip } from "antd";
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
import MoveStageModal, {
  type MoveStageOption,
} from "@/components/MoveStageModal";
import List from "@/assets/icons/list";
import {
  getCandidateCardData,
  getEvaluateResultLevel,
} from "@/utils";
import { Post } from "@/utils/request";
import { getDaysInStage, getStageKey } from "@/utils/talentStage";
import TalentPopoverContent from "@/components/TalentPopoverContent";

import styles from "./style.module.less";
import globalStore from "@/store/global";
import { EVALUATE_INTERVIEW_RECOMMENDATION_KEYS } from "@/utils/consts";

export type PipelineStageLike = MoveStageOption;

export type ListModeTableVariant = "pipeline" | "talents";

interface IProps {
  variant?: ListModeTableVariant;
  allStages?: PipelineStageLike[];
  items: TTalentListItem[];
  onMarkViewed?: () => void;
  onRowClick: (item: TTalentListItem) => void;
  onUpdateTalent?: () => void;
  onStartCalibrationConversation: (
    params: TStartCalibrationConversationParams,
  ) => void;
  selectedRowKeys?: number[];
  onSelectedRowKeysChange?: (keys: number[]) => void;
}

const getCurrentWorkExperience = (
  list?: TTalentListItem["basicInfo"]["work_experiences"],
) => {
  const arr = list ?? [];
  return arr.find((w) => w.is_present) ?? arr[0];
};

const getAssignedTalentRecruiterRows = (
  record: TTalentListItem,
): { staffId: number; name: string }[] => {
  return [...(record.talent_recruiters ?? [])]
    .sort((left, right) => left.id - right.id)
    .map((item) => ({
      staffId: item.staff_id,
      name: (item.staff?.name ?? "").trim(),
    }))
    .filter((row) => row.name);
};

const ListModeTable = ({
  variant = "pipeline",
  allStages = [],
  items,
  onRowClick,
  onUpdateTalent,
  onStartCalibrationConversation,
  onMarkViewed,
  selectedRowKeys,
  onSelectedRowKeysChange,
}: IProps) => {
  const { t } = useTranslation();
  const tKey = (key: string) => t(`job_details.pipeline_section.${key}`);
  const tCandidateList = (key: string) => t(`candidate_list_page.${key}`);

  const [viewedMap, setViewedMap] = useState<Record<number, boolean>>({});

  const { fetchUnreadTalentsCount } = globalStore;

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

  useEffect(() => {
    const next: Record<number, boolean> = {};
    items.forEach((talent) => {
      next[talent.id] = !!talent.viewed_at;
    });
    setViewedMap(next);
  }, [items]);

  const sortedTalents = useMemo(() => {
    return [...items].sort((a, b) => {
      const fitLevelA = getEvaluateResultLevel(a.parsedEvaluateResult);
      const fitLevelB = getEvaluateResultLevel(b.parsedEvaluateResult);

      if (fitLevelA === fitLevelB) {
        return dayjs(b.created_at).diff(dayjs(a.created_at));
      }

      return (
        EVALUATE_INTERVIEW_RECOMMENDATION_KEYS.indexOf(fitLevelA) -
        EVALUATE_INTERVIEW_RECOMMENDATION_KEYS.indexOf(fitLevelB)
      );
    });
  }, [items]);

  const wrapCell = (record: TTalentListItem, children: React.ReactNode) => {
    const hasViewed = viewedMap[record.id] ?? !!record.viewed_at;
    const handleOpenChange = async (open: boolean) => {
      if (
        open &&
        !hasViewed &&
        !record.viewed_at &&
        record.job?.invitation_token
      ) {
        await Post(
          `/api/jobs/${record.job?.invitation_token}/talents/${record.id}/viewed`,
          {},
        );
        setViewedMap((prev) => ({ ...prev, [record.id]: true }));
        fetchUnreadTalentsCount();
        onMarkViewed?.();
      }
    };

    return (
      <Popover
        content={
          <TalentPopoverContent
            variant={variant}
            talent={record}
            onUpdateTalent={onUpdateTalent ?? (() => {})}
            onStartCalibrationConversation={onStartCalibrationConversation}
            mode="table"
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

  const pipelineColumns: ColumnsType<TTalentListItem> = [
    {
      title:
        (selectedRowKeys ?? []).length === 0
          ? tKey("candidate_name")
          : `${selectedRowKeys?.length} selected`,
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
      title: tKey("assigned_recruiters"),
      dataIndex: "assigned_recruiters",
      width: 220,
      render: (_: unknown, record: TTalentListItem) => {
        const rows = getAssignedTalentRecruiterRows(record);
        if (!rows.length) {
          return wrapCell(record, "-");
        }
        return wrapCell(
          record,
          <div className={styles.recruiterChipWrap}>
            {rows.map((row) => (
              <Tooltip key={row.staffId} title={row.name}>
                <span className={styles.personChip}>{row.name}</span>
              </Tooltip>
            ))}
          </div>,
        );
      },
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
                  hidden: true,
                },
                ...(record.status !== "rejected"
                  ? [
                      {
                        key: "reject",
                        label: tKey("reject"),
                        danger: true,
                        onClick: () => {
                          setActionRecord(record);
                          setRejectOpen(true);
                        },
                      },
                    ]
                  : []),
              ].filter((item) => !item.hidden);

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
      title: tCandidateList("columns.candidate"),
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
      title: tCandidateList("columns.last_job_title"),
      dataIndex: "job_title",
      width: 200,
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
      title: tCandidateList("columns.last_company"),
      dataIndex: "company",
      width: 200,
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
      title: tCandidateList("columns.applied_for"),
      dataIndex: "applied_job_name",
      width: 200,
      render: (_: unknown, record) =>
        wrapCell(
          record,
          <span className={styles.ellipsis}>{record.job?.name ?? "-"}</span>,
        ),
    },
    {
      title: tKey("assigned_recruiters"),
      dataIndex: "assigned_recruiters",
      width: 220,
      render: (_: unknown, record: TTalentListItem) => {
        const rows = getAssignedTalentRecruiterRows(record);
        if (!rows.length) {
          return wrapCell(record, "-");
        }
        return wrapCell(
          record,
          <div className={styles.recruiterChipWrap}>
            {rows.map((row) => (
              <Tooltip key={row.staffId} title={row.name}>
                <span className={styles.personChip}>{row.name}</span>
              </Tooltip>
            ))}
          </div>,
        );
      },
    },
    {
      title: tCandidateList("columns.experience"),
      dataIndex: "experience",
      width: 160,
      render: (_: unknown, record) => {
        const { exp } = getCandidateCardData(record);
        return wrapCell(record, <span className={styles.ellipsis}>{exp}</span>);
      },
    },
    {
      title: tCandidateList("columns.visa_status"),
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
      title: tCandidateList("columns.current_comp"),
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
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total, range) => (
              <span>
                {range[0]}-{range[1]} of {total} items
              </span>
            ),
          }}
          rowSelection={
            enablePipelineActions
              ? {
                  selectedRowKeys,
                  preserveSelectedRowKeys: true,
                  onChange: (keys) =>
                    onSelectedRowKeysChange?.(keys as number[]),
                  columnTitle: (originNode) => {
                    const pageKeys = sortedTalents.map((talent) => talent.id);
                    const keys = selectedRowKeys ?? [];
                    const allPageSelected =
                      pageKeys.length > 0 &&
                      pageKeys.every((id) => keys.includes(id));

                    return (
                      <div
                        className={styles.selectionCell}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectedRowKeysChange?.(
                            allPageSelected
                              ? keys.filter((k) => !pageKeys.includes(k))
                              : [...new Set([...keys, ...pageKeys])],
                          );
                        }}
                      >
                        <span className={styles.selectionCellVisual}>
                          {originNode}
                        </span>
                      </div>
                    );
                  },
                  renderCell: (_checked, record, _index, originNode) => (
                    <div
                      className={styles.selectionCell}
                      onClick={(e) => {
                        e.stopPropagation();
                        const keys = selectedRowKeys ?? [];
                        const id = record.id;
                        onSelectedRowKeysChange?.(
                          keys.includes(id)
                            ? keys.filter((k) => k !== id)
                            : [...keys, id],
                        );
                      }}
                    >
                      <span className={styles.selectionCellVisual}>
                        {originNode}
                      </span>
                    </div>
                  ),
                }
              : undefined
          }
          onRow={(record) => ({
            onClick: (e) => {
              if (
                (e.target as HTMLElement).closest(".ant-table-selection-column")
              ) {
                return;
              }
              onRowClick(record);
            },
          })}
        />
      </div>

      {enablePipelineActions && actionRecord && (
        <MoveStageModal
          open={moveStageOpen}
          jobId={actionRecord.job?.invitation_token ?? actionRecord.job_id}
          talentId={actionRecord.id}
          allStages={allStages}
          onCancel={() => {
            setMoveStageOpen(false);
            setActionRecord(null);
          }}
          onOk={() => {
            onUpdateTalent?.();
            setMoveStageOpen(false);
            setActionRecord(null);
          }}
        />
      )}

      {enablePipelineActions && (
        <>
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
              jobId={actionRecord.job?.invitation_token ?? actionRecord.job_id}
              talentId={actionRecord.id}
              candidateName={actionRecord.name}
              evaluateResult={actionRecord.parsedEvaluateResult}
              open={rejectOpen}
              successMessage="Application Rejected"
              onOk={({ startCalibration }) => {
                const record = actionRecord;
                const jobId = record.job?.invitation_token;

                setRejectOpen(false);
                setActionRecord(null);
                onUpdateTalent?.();

                if (startCalibration && jobId) {
                  onStartCalibrationConversation({
                    jobId,
                    talentId: record.id,
                    source: "reject_calibration",
                    needConfirm: false,
                  });
                }
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
