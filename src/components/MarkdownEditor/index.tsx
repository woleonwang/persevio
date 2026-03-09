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
import React, { useEffect, useRef } from "react";

export type { MDXEditorMethods };

interface IProps {
  value?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}

const MarkdownEditor = React.forwardRef<MDXEditorMethods, IProps>(
  (props, ref) => {
    const { value = "", onChange = () => {}, style = {} } = props;
    const internalRef = useRef<MDXEditorMethods | null>(null);

    useEffect(() => {
      internalRef.current?.setMarkdown(
        value
          .replaceAll("<br>", "<br/>")
          .replace(/```markdown\s*([\s\S]*?)\s*```/g, (_, code) => code.trim())
          .replace(/(?<!\\)</g, "\\<")
      );
    }, [value]);

    return (
      <div style={style} className={styles.mdEditorContainer}>
        <MDXEditor
          ref={(r) => {
            internalRef.current = r;
            if (typeof ref === "function") {
              ref(r);
            } else if (ref != null) {
              (ref as React.MutableRefObject<MDXEditorMethods | null>).current = r;
            }
          }}
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
  }
);

MarkdownEditor.displayName = "MarkdownEditor";

export default MarkdownEditor;
