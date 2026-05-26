import { useEffect, useMemo, useState } from "react";
import { Modal, Select, message } from "antd";
import { useTranslation } from "react-i18next";

import { Post } from "@/utils/request";

import styles from "./style.module.less";

export type MoveStageOption = {
  id: string;
  name: string;
  isDefault?: boolean;
};

interface IProps {
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
  jobId: string | number;
  talentId?: number;
  talentIds?: number[];
  allStages: MoveStageOption[];
}

const MoveStageModal = ({
  open,
  onCancel,
  onOk,
  jobId,
  talentId,
  talentIds,
  allStages,
}: IProps) => {
  const { t } = useTranslation();
  const tKey = (key: string, options?: Record<string, unknown>) =>
    t(`job_details.pipeline_section.${key}`, options);

  const [selectedStageId, setSelectedStageId] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      setSelectedStageId(undefined);
    }
  }, [open]);

  const stageOptions = useMemo(() => {
    const customStages = allStages.filter((stage) => !stage.isDefault);
    return customStages.length > 0
      ? customStages
      : allStages.filter((stage) => stage.id !== "rejected");
  }, [allStages]);

  const handleOk = async () => {
    if (!selectedStageId) return;

    const isBatch = !!talentIds?.length;
    const { code, data } = isBatch
      ? await Post(`/api/jobs/${jobId}/talents/batch/stage`, {
          talent_ids: talentIds,
          stage_id: selectedStageId,
        })
      : await Post(`/api/jobs/${jobId}/talents/${talentId}/stage`, {
          stage_id: selectedStageId,
        });

    if (code === 0) {
      if (isBatch) {
        message.success(
          tKey("batch_move_stage_success", { count: data?.success_count ?? 0 }),
        );
      } else {
        message.success(t("save_success"));
      }
      onOk();
    } else {
      message.error(t("save_failed"));
    }
  };

  return (
    <Modal
      title={tKey("move_stage_modal_title")}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
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
          options={stageOptions.map((stage) => ({
            value: stage.id,
            label: stage.name,
          }))}
        />
      </div>
    </Modal>
  );
};

export default MoveStageModal;
