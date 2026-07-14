import { useEffect, useRef, useState } from "react";
import { Progress } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import styles from "./style.module.less";

const TICK_MS = 200;
const MAX_WHILE_WAITING = 90;
const ACCELERATE_MS = 300;

interface IProps {
  /** true 时加速冲到 100%，完成后触发 onComplete */
  status?: boolean;
  onComplete?: () => void;
}

const JdProgressCard = (props: IProps) => {
  const { status = false, onComplete } = props;
  const { t: originalT } = useTranslation();
  const [percent, setPercent] = useState(0);
  const percentRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    if (status) return;

    const timer = setInterval(() => {
      const next = Math.min(percentRef.current + 0.2, MAX_WHILE_WAITING);
      percentRef.current = next;
      setPercent(next);
    }, TICK_MS);

    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (!status || hasCompletedRef.current) return;

    const startPercent = percentRef.current;
    if (startPercent >= 100) {
      hasCompletedRef.current = true;
      onCompleteRef.current?.();
      return;
    }

    let rafId = 0;
    const startedAt = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / ACCELERATE_MS);
      const value = startPercent + (100 - startPercent) * progress;
      percentRef.current = value;
      setPercent(value);
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
        return;
      }
      hasCompletedRef.current = true;
      onCompleteRef.current?.();
    };
    rafId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(rafId);
  }, [status]);

  return (
    <div
      className={styles.jdProgressCard}
      aria-label={originalT("chat.jd_progress_aria")}
    >
      <p className={styles.jdProgressLabel}>
        <CheckCircleFilled className={styles.checkIcon} />
        <span
          dangerouslySetInnerHTML={{
            __html: originalT("chat.jd_progress_label"),
          }}
        />
      </p>
      <Progress
        className={styles.jdProgressBar}
        percent={percent}
        showInfo={false}
        strokeColor={{
          "0%": "#6bc6ff",
          "100%": "#3682fe",
        }}
        trailColor="#eaeaea"
        size={{ height: 8 }}
      />
    </div>
  );
};

export default JdProgressCard;
