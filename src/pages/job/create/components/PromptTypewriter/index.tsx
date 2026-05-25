import { Fragment, useEffect, useMemo, useState } from "react";
import classnames from "classnames";

import styles from "./style.module.less";

type TPromptSegment = {
  text: string;
  emphasis?: boolean;
};

type PromptTypewriterProps = {
  segments: TPromptSegment[];
};

type TAnimatedChar = {
  char: string;
  emphasis: boolean;
};

const PromptTypewriter = ({ segments }: PromptTypewriterProps) => {
  const [visibleCount, setVisibleCount] = useState(0);

  const chars = useMemo(() => {
    const result: TAnimatedChar[] = [];
    segments.forEach((segment) => {
      Array.from(segment.text).forEach((char) => {
        result.push({ char, emphasis: !!segment.emphasis });
      });
    });
    return result;
  }, []);

  useEffect(() => {
    let index = 0;
    let timer = 0;

    const revealNext = () => {
      index += 1;
      setVisibleCount(index);
      const currentChar = chars[index - 1]?.char ?? " ";
      const delay = currentChar === " " ? 12 : 26;

      if (index < chars.length) {
        timer = window.setTimeout(revealNext, delay);
      }
    };

    timer = window.setTimeout(revealNext, 280);
    return () => window.clearTimeout(timer);
  }, []);

  const isTyping = visibleCount < chars.length;

  return (
    <p className={classnames(styles.promptText, isTyping && styles.isTyping)}>
      {chars.map((item, index) => {
        const charClassName = classnames(
          styles.typewriterChar,
          index < visibleCount && styles.isVisible,
        );

        const charNode = item.emphasis ? (
          <strong className={charClassName}>{item.char}</strong>
        ) : (
          <span className={charClassName}>{item.char}</span>
        );

        return (
          <Fragment key={index}>
            {charNode}
            {isTyping && index === visibleCount - 1 && (
              <span className={styles.typewriterCaret} aria-hidden />
            )}
          </Fragment>
        );
      })}
    </p>
  );
};

export default PromptTypewriter;
