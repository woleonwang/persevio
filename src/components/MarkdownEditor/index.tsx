import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  headingsPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  MDXEditor,
  quotePlugin,
  Separator,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
  tablePlugin,
  MDXEditorMethods,
} from "@mdxeditor/editor";
import styles from "./style.module.less";
import { useEffect, useRef } from "react";

interface IProps {
  value?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}

const MarkdownEditor: React.FC<IProps> = (props) => {
  const { value = "", onChange = () => {}, style = {} } = props;
  const markdownRef = useRef<MDXEditorMethods>(null);

  useEffect(() => {
    markdownRef.current?.setMarkdown(
      value
        .replaceAll("<br>", "<br/>")
        .replace(/```markdown\s*([\s\S]*?)\s*```/g, (_, code) => code.trim())
    );
  }, [value]);

  return (
    <div style={style}>
      <MDXEditor
        ref={markdownRef}
        contentEditableClassName={styles.mdEditor}
        markdown={""}
        onChange={(md) => onChange(md)}
        plugins={[
          headingsPlugin(),
          quotePlugin(),
          listsPlugin(),
          thematicBreakPlugin(),
          linkPlugin(),
          tablePlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <BoldItalicUnderlineToggles />
                <ListsToggle options={["bullet", "number"]} />
                <Separator />
                <BlockTypeSelect />
              </>
            ),
          }),
        ]}
      />
    </div>
  );
};

export default MarkdownEditor;
