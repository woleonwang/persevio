import classnames from "classnames";
import styles from "./style.module.less";
import Markdown, { Options } from "react-markdown";
import rehypeRaw from "rehype-raw";

interface IProps extends Options {
  onClick?: () => void;
  content: string;
}
const MarkdownContainer = (props: IProps) => {
  const { content, onClick, ...restProps } = props;
  return (
    <div className={classnames(styles.markdownContainer)} onClick={onClick}>
      <Markdown rehypePlugins={[rehypeRaw]} {...restProps}>
        {content}
      </Markdown>
    </div>
  );
};

export default MarkdownContainer;
