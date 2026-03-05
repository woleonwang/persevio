import { useState } from "react";
import { Button, Dropdown, Modal, Popover, Select, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";

import type { TTalentListItem } from "./types";
import { getStageKey, getDaysInStage } from "./utils";
import { getCandidateCardData } from "./getCandidateCardData";
import EvaluateResultBadge from "@/components/EvaluateResultBadge";
import PopoverContent from "./PopoverContent";
import { PipelineStage } from "../../JobSettings";
import { FUNNEL_COLORS, FUNNEL_BG_COLORS } from "../../JobAnalytics/colors";
import { Post } from "@/utils/request";
import InterviewForm from "@/components/NewTalentDetail/components/InterviewForm";
import TalentEvaluateFeedbackWithReasonModal from "@/components/TalentEvaluateFeedbackWithReasonModal";
import styles from "../style.module.less";
import List from "@/assets/icons/list";

interface IProps {
  allStages: PipelineStage[];
  items: TTalentListItem[];
  onRowClick: (item: TTalentListItem) => void;
  onUpdateTalent: () => void;
}

const ListModeTable = ({
  allStages,
  items,
  onRowClick,
  onUpdateTalent,
}: IProps) => {
  const { t } = useTranslation();
  const tKey = (key: string) => t(`job_details.pipeline_section.${key}`);

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

  const updateTalentStatus = async (
    record: TTalentListItem,
    feedback?: string,
  ) => {
    const { code } = await Post(
      `/api/jobs/${record.job_id}/talents/${record.id}`,
      { status: "rejected", feedback },
    );
    if (code === 0) {
      onUpdateTalent();
      setRejectOpen(false);
      message.success(t("job_details.saveSuccess"));
    }
  };

  const handleMoveStageOk = async () => {
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

  const renderRowPopover = (
    record: TTalentListItem,
    children: React.ReactNode,
  ) => (
    <Popover
      content={
        <PopoverContent talent={record} onUpdateTalent={onUpdateTalent} />
      }
      trigger="hover"
      placement="right"
      mouseEnterDelay={0.5}
    >
      <span className={styles.listTableCellTrigger}>{children}</span>
    </Popover>
  );

  const columns: ColumnsType<TTalentListItem> = [
    {
      title: tKey("candidate_name"),
      dataIndex: "name",
      width: 180,
      render: (_: unknown, record: TTalentListItem) => {
        const { name } = getCandidateCardData(record);
        return renderRowPopover(record, name);
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
        return renderRowPopover(
          record,
          <span
            className={styles.listTableStageBadge}
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
        return renderRowPopover(
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
        return renderRowPopover(
          record,
          <span className={styles.listTableEllipsis} style={{ maxWidth: 300 }}>
            {exp}
          </span>,
        );
      },
      width: 160,
    },
    {
      title: tKey("visa_status"),
      dataIndex: "visa_status",
      render: (_: unknown, record: TTalentListItem) => {
        const { visa } = getCandidateCardData(record);
        return renderRowPopover(
          record,
          <span className={styles.listTableEllipsis} style={{ maxWidth: 300 }}>
            {visa}
          </span>,
        );
      },
      width: 160,
    },
    {
      title: tKey("current_comp"),
      dataIndex: "current_comp",
      render: (_: unknown, record: TTalentListItem) => {
        const { comp } = getCandidateCardData(record);
        return renderRowPopover(
          record,
          <span className={styles.listTableEllipsis} style={{ maxWidth: 300 }}>
            {comp}
          </span>,
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
        return renderRowPopover(record, text);
      },
      width: 140,
    },
    {
      title: tKey("actions"),
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_: unknown, record: TTalentListItem) => {
        const interview = record.interviews?.[0] as
          | { mode?: string; scheduled_at?: string }
          | undefined;
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
  ];

  return (
    <div className={styles.listTableWrap}>
      <div className={styles.listTable}>
        <Table<TTalentListItem>
          className={styles.listAntdTable}
          columns={columns}
          dataSource={items}
          scroll={{ x: "max-content" }}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          onRow={(record) => ({
            onClick: () => onRowClick(record),
          })}
        />
      </div>

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
            interview={actionRecord.interviews?.[0] as TInterview | undefined}
            onClose={() => {
              setInterviewOpen(false);
              setActionRecord(null);
            }}
            onSubmit={() => {
              onUpdateTalent();
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
            onUpdateTalent();
          }}
          onCancel={() => {
            setRejectOpen(false);
            setActionRecord(null);
          }}
        />
      )}
    </div>
  );
};

export default ListModeTable;
