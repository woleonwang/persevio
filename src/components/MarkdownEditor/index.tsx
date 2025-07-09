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
} from "@mdxeditor/editor";
import styles from "./style.module.less";

interface IProps {
  value: string;
  onChange: (value: string) => void;
}

const MarkdownEditor: React.FC<IProps> = (props) => {
  const { value, onChange } = props;
  return (
    <MDXEditor
      contentEditableClassName={styles.mdEditor}
      markdown={value.replaceAll("<br>", ``)}
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
  );
};

export default MarkdownEditor;
