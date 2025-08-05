import classnames from "classnames";
import styles from "./style.module.less";
import Markdown, { Options } from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
interface IProps extends Options {
  onClick?: () => void;
  content: string;
}

const MarkdownContainer = (props: IProps) => {
  const { content, onClick, ...restProps } = props;

  if (!content) {
    return null;
  }

  return (
    <div className={classnames(styles.markdownContainer)} onClick={onClick}>
      <Markdown
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm]}
        {...restProps}
      >
        {content.replaceAll(
          "|\n|",
          `|
  |`
        )}
      </Markdown>
    </div>
  );
};

export default MarkdownContainer;
