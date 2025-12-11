import Input, { TextAreaProps } from "antd/es/input";
import { AudioOutlined, LoadingOutlined } from "@ant-design/icons";
import { Button } from "antd";

import useAssemblyOffline from "@/hooks/useAssemblyOffline";
import Pause from "@/assets/icons/pause";
import classnames from "classnames";

import styles from "./style.module.less";

interface IProps extends Omit<TextAreaProps, "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
}
const TextAreaWithVoice: React.FC<IProps> = (props) => {
  const { value, onChange, ...restProps } = props;

  const {
    startTranscription,
    endTranscription,
    isRecording,
    volumeHistory,
    isTranscribing,
  } = useAssemblyOffline({
    onFinish: (result) => {
      onChange?.((value ?? "") + result);
    },
    disableShortcuts: true,
  });

  return (
    <div className={styles.container}>
      <Input.TextArea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        {...restProps}
        rows={restProps.rows ?? 6}
        className={styles.textArea}
      />
      <div className={styles.voiceContainer}>
        {(isRecording || isTranscribing) && (
          <div
            className={classnames(styles.volumeHistoryContainer, {
              [styles.active]: isRecording,
            })}
          >
            {volumeHistory.map((volume, index) => {
              return (
                <div
                  key={index}
                  className={styles.volumeHistoryItem}
                  style={{
                    height: 4 + Math.min(30, volume * 75),
                  }}
                />
              );
            })}
          </div>
        )}
        {isRecording ? (
          <Button
            className={styles.voiceButton}
            icon={<Pause />}
            onClick={() => endTranscription()}
            size="large"
            type="primary"
          />
        ) : isTranscribing ? (
          <Button
            className={styles.voiceButton}
            icon={<LoadingOutlined spin />}
            size="large"
          />
        ) : (
          <Button
            className={styles.voiceButton}
            icon={<AudioOutlined />}
            onClick={() => startTranscription()}
            size="large"
          />
        )}
      </div>
    </div>
  );
};

export default TextAreaWithVoice;
