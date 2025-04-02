import classnames from "classnames";
import styles from "./style.module.less";
import Markdown, { Options } from "react-markdown";
import rehypeRaw from "rehype-raw";

interface IProps extends Options {
  content: string;
}
const MarkdownContainer = (props: IProps) => {
  const { content, ...restProps } = props;
  return (
    <div className={classnames(styles.markdownContainer)}>
      <Markdown rehypePlugins={[rehypeRaw]} {...restProps}>
        {content}
      </Markdown>
    </div>
  );
};

export default MarkdownContainer;
