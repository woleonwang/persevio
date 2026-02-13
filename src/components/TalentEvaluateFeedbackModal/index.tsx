import { Modal } from "antd";
import TextAreaWithVoice from "../TextAreaWithVoice";
import { useEffect, useState } from "react";

interface IProps {
  open: boolean;
  onOk: (reason: string) => void;
  onCancel: () => void;
}

const TalentEvaluateFeedbackModal = (props: IProps) => {
  const { open, onOk, onCancel } = props;

  const [value, setValue] = useState<string>("");

  useEffect(() => {
    if (open) {
      setValue("");
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={() => onOk(value)}
      width={800}
      centered
      title="What should we know to better source/screen candidates for this role?"
      okButtonProps={{
        disabled: !value,
      }}
      okText="NEXT"
      destroyOnClose
    >
      <div style={{ marginTop: 32 }}>
        <TextAreaWithVoice
          value={value}
          onChange={setValue}
          placeholder="For example, our assessment is not accurate/the role is evolved and you'd like to adjust or update the job requirements/ or anything at all."
        />
      </div>
    </Modal>
  );
};

export default TalentEvaluateFeedbackModal;
