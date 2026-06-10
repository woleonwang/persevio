import React from "react";

import styles from "../style.module.less";

type THighlightTextProps = {
  text: string;
  className?: string;
};

const HighlightText: React.FC<THighlightTextProps> = ({ text, className }) => {
  const parts = text.split(/(\{[^}]+\})/g);
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith("{") && part.endsWith("}")) {
          return (
            <span key={index} className={styles.highlightPhrase}>
              {part.slice(1, -1)}
            </span>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
};

export default HighlightText;
