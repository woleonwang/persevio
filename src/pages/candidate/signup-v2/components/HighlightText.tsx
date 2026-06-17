import React from "react";
import classnames from "classnames";
import styles from "../style.module.less";
import MarkdownContainer from "@/components/MarkdownContainer";

type THighlightTextProps = {
  text: string;
  className?: string;
};

const HighlightText: React.FC<THighlightTextProps> = ({ text, className }) => {
  return (
    <span className={classnames(styles.highlightPhrase, className)}>
      <MarkdownContainer content={text} />
    </span>
  );
};

export default HighlightText;
