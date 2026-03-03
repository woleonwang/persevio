import { Popover, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";

import type { TTalentListItem } from "./types";
import { getStageKey, getDaysInStage } from "./utils";
import { getCandidateCardData } from "./getCandidateCardData";
import EvaluateResultBadge from "@/components/EvaluateResultBadge";
import PopoverContent from "./PopoverContent";
import { PipelineStage } from "../../JobSettings";
import { FUNNEL_COLORS, FUNNEL_BG_COLORS } from "../../JobAnalytics/colors";
import styles from "../style.module.less";

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

  const columns: ColumnsType<TTalentListItem> = [
    {
      title: tKey("candidate_name"),
      dataIndex: "name",
      width: 180,
      render: (_: unknown, record: TTalentListItem) => {
        const { name } = getCandidateCardData(record);
        return (
          <Popover
            content={
              <PopoverContent talent={record} onUpdateTalent={onUpdateTalent} />
            }
            trigger="hover"
            placement="right"
            mouseEnterDelay={0.5}
          >
            <span>{name}</span>
          </Popover>
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
        return (
          <span
            className={styles.listTableStageBadge}
            style={{
              backgroundColor: bgColor,
              color: textColor,
              borderColor: textColor,
            }}
          >
            {stageLabel}
          </span>
        );
      },
      width: 140,
    },
    {
      title: tKey("overall_fit"),
      dataIndex: "fit",
      render: (_: unknown, record: TTalentListItem) => {
        const { fitResult } = getCandidateCardData(record);
        return (
          <div style={{ width: "fit-content" }}>
            <EvaluateResultBadge result={fitResult} size="small" />
          </div>
        );
      },
      width: 160,
    },
    {
      title: tKey("experience"),
      dataIndex: "experience",
      render: (_: unknown, record: TTalentListItem) => {
        const { exp } = getCandidateCardData(record);
        return (
          <span className={styles.listTableEllipsis} style={{ maxWidth: 300 }}>
            {exp}
          </span>
        );
      },
      width: 160,
    },
    {
      title: tKey("visa_status"),
      dataIndex: "visa_status",
      render: (_: unknown, record: TTalentListItem) => {
        const { visa } = getCandidateCardData(record);
        return (
          <span className={styles.listTableEllipsis} style={{ maxWidth: 300 }}>
            {visa}
          </span>
        );
      },
      width: 160,
    },
    {
      title: tKey("current_comp"),
      dataIndex: "current_comp",
      render: (_: unknown, record: TTalentListItem) => {
        const { comp } = getCandidateCardData(record);
        return (
          <span className={styles.listTableEllipsis} style={{ maxWidth: 300 }}>
            {comp}
          </span>
        );
      },
      width: 160,
    },
    {
      title: tKey("days_in_stage"),
      dataIndex: "days_in_stage",
      render: (_: unknown, record: TTalentListItem) => {
        const daysInStageValue = getDaysInStage(record);
        return daysInStageValue != null ? daysInStageValue.toFixed(1) : "--";
      },
      width: 140,
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
          pagination={false}
          onRow={(record) => ({
            onClick: () => onRowClick(record),
          })}
        />
      </div>
    </div>
  );
};

export default ListModeTable;
