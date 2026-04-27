import { useDraggable } from "@dnd-kit/core";
import { Popover, Tooltip } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

import {
  getCandidateCardData,
  getEvaluateResultLevel,
  getSourcingChannel,
  SOURCING_CHANNEL_KEYS,
} from "@/utils";
import styles from "../style.module.less";
import TalentPopoverContent from "@/components/TalentPopoverContent";
import { useTranslation } from "react-i18next";
import { Post } from "@/utils/request";
import globalStore from "@/store/global";
import { LogisticsFitKnownKeys } from "@/utils/consts";

interface IProps {
  item: TTalentListItem;
  isDraggable: boolean;
  disabledPopover?: boolean;
  onCardClick: (item: TTalentListItem) => void;
  onUpdateTalent: () => void;
  onViewed?: (talentId: number) => void;
}

const DraggableCard = ({
  item,
  isDraggable,
  disabledPopover,
  onCardClick,
  onUpdateTalent,
  onViewed,
}: IProps) => {
  const { fetchUnreadTalentsCount } = globalStore;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: { item },
    disabled: !isDraggable,
  });

  const [popoverOpen, setPopoverOpen] = useState(false);

  const { t } = useTranslation();

  const { name, exp, visa, comp, location, evaluateResult } =
    getCandidateCardData(item);
  const sourceChannel = getSourcingChannel(item.source_channel);
  const isDefaultSource = SOURCING_CHANNEL_KEYS.includes(sourceChannel as any);
  const sourceLabel = isDefaultSource
    ? t(`sourcing_channel.${sourceChannel}`)
    : sourceChannel;

  const fitResult = getEvaluateResultLevel(evaluateResult);
  const interviewLabel = t(`job_talents.evaluate_result_options.${fitResult}`);
  const interviewLevelClassMap: Record<TInterviewRecommendation, string> = {
    absolutely: styles.absolutely,
    yes: styles.yes,
    yes_but: styles.yesBut,
    maybe: styles.maybe,
    no: styles.no,
  };
  const interviewLevelClass = interviewLevelClassMap[fitResult] ?? styles.maybe;
  const interviewThemeClassMap: Record<
    "absolutely" | "yes" | "yes_but" | "maybe" | "no",
    string
  > = {
    absolutely: styles.themeAbsolutely,
    yes: styles.themeYes,
    yes_but: styles.themeYesBut,
    maybe: styles.themeMaybe,
    no: styles.themeNo,
  };
  const interviewThemeClass =
    interviewThemeClassMap[fitResult] ?? styles.themeMaybe;

  const skillsLevel = evaluateResult?.overall_recommendation?.skills_fit?.level;
  const skillsText = skillsLevel
    ? t(`job_talents.skills_fit_options.${skillsLevel}`)
    : "-";

  const logisticsRaw =
    evaluateResult?.overall_recommendation?.logistics_fit?.level;
  const logisticsList = Array.isArray(logisticsRaw)
    ? logisticsRaw
    : logisticsRaw
      ? [logisticsRaw]
      : [];
  const logisticsText =
    logisticsList.length > 0
      ? logisticsList
          .map((level) =>
            LogisticsFitKnownKeys.includes(level as TLogisticsFitKey)
              ? t(`job_talents.logistics_fit_options.${level}`)
              : level,
          )
          .join(", ")
      : "-";
  const lastActivity = item.created_at;
  const lastActivityStr = lastActivity
    ? (() => {
        const d = dayjs(lastActivity);
        const diffDays = dayjs().diff(d, "day");
        if (diffDays < 1) return d.format("HH:mm");
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.format("MMM D");
      })()
    : "-";

  useEffect(() => {
    if (disabledPopover) {
      setPopoverOpen(false);
    }
  }, [disabledPopover]);

  const handleOpenChange = async (open: boolean) => {
    if (open && (disabledPopover || isDragging)) return;

    setPopoverOpen(open);
    if (open && !item.viewed_at) {
      await Post(`/api/jobs/${item.job_id}/talents/${item.id}/viewed`, {});
      onViewed?.(item.id);
      fetchUnreadTalentsCount();
    }
  };

  return (
    <Popover
      content={
        <TalentPopoverContent
          variant="pipeline"
          talent={item}
          onUpdateTalent={onUpdateTalent}
        />
      }
      trigger="hover"
      placement="right"
      mouseEnterDelay={0.5}
      open={!disabledPopover && popoverOpen && !isDragging}
      onOpenChange={handleOpenChange}
    >
      <div
        ref={setNodeRef}
        className={`${styles.candidateCard} ${
          isDraggable ? styles.candidateCardDraggable : ""
        }`}
        style={{ opacity: isDragging ? 0.5 : 1 }}
        onClick={() => onCardClick(item)}
        {...(isDraggable ? { ...attributes, ...listeners } : {})}
      >
        <div className={styles.cardHeader}>
          <div className={styles.cardNameWrap}>{name}</div>
          {!item.viewed_at && <span className={styles.newBadge}>NEW!</span>}
        </div>
        <div className={`${styles.interviewSection} ${interviewThemeClass}`}>
          <div className={styles.interviewRow}>
            <span className={styles.interviewLabel}>Interview?</span>
            <Tooltip title={interviewLabel}>
              <span
                className={`${styles.interviewValue} ${interviewLevelClass}`}
              >
                {interviewLabel}
              </span>
            </Tooltip>
          </div>
          <div className={styles.secondaryRow}>
            <span className={styles.secondaryLabel}>Skills</span>
            <Tooltip title={skillsText}>
              <span className={styles.valueEllipsis}>{skillsText}</span>
            </Tooltip>
          </div>
          <div className={styles.secondaryRow}>
            <span className={styles.secondaryLabel}>Logistics</span>
            <Tooltip title={logisticsText}>
              <span className={styles.valueEllipsis}>{logisticsText}</span>
            </Tooltip>
          </div>
        </div>
        <div className={styles.cardDivider} />
        <div className={styles.cardBody}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Exp</span>
            <span className={styles.infoValue}>{exp}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Location</span>
            <span className={styles.infoValue}>{location}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Visa</span>
            <span className={styles.infoValue}>{visa}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Comp</span>
            <span className={styles.infoValue}>{comp}</span>
          </div>
        </div>
        <div className={styles.cardDivider} />
        <div className={styles.cardFooter}>
          <span className={styles.sourceLink}>{sourceLabel}</span>
          <span className={styles.activityTime}>{lastActivityStr}</span>
        </div>
        {/* {summary && <div className={styles.cardSummary}>{summary}</div>} */}
      </div>
    </Popover>
  );
};

export default DraggableCard;
