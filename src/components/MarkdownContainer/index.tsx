import classnames from "classnames";
import styles from "./style.module.less";
import Markdown, { Options } from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
interface IProps extends Options {
  id?: string;
  onClick?: () => void;
  content: string;
}

const MarkdownContainer = (props: IProps) => {
  const { content, onClick, id, components, ...restProps } = props;

  if (!content) {
    return null;
  }

  return (
    <div
      className={classnames(styles.markdownContainer)}
      onClick={onClick}
      id={id}
    >
      <Markdown
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...anchorProps }) => (
            <a
              {...anchorProps}
              target="_blank"
              rel={anchorProps.rel ?? "noopener noreferrer"}
            />
          ),
          ...components,
        }}
        {...restProps}
      >
        {content
          .replaceAll(
            "|\n|",
            `|
  |`
          )
          .replace(/```markdown\s*([\s\S]*?)\s*```/g, (_, code) => code.trim())}
      </Markdown>
    </div>
  );
};

export default MarkdownContainer;
