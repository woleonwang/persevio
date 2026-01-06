import { Button, Input, Upload } from "antd";
import { TextAreaProps } from "antd/es/input";
import { UploadChangeParam, UploadFile } from "antd/es/upload";

interface IProps extends TextAreaProps {
  allowFile?: boolean;
}

const TextAreaWithUploader = (props: IProps) => {
  const { allowFile = false, ...restProps } = props;

  const extractFile = (file: UploadChangeParam<UploadFile<any>>) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log(e.target?.result);
      const event = {
        target: {
          value: e.target?.result ?? "",
        },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      restProps?.onChange?.(event);
    };
    reader.readAsText(file.file as unknown as File);
  };

  return (
    <div>
      <Input.TextArea {...restProps} />
      {allowFile && (
        <Upload
          beforeUpload={() => false}
          onChange={(fileInfo) => extractFile(fileInfo)}
          showUploadList={false}
          accept="text/plain"
          multiple={false}
        >
          <Button type="primary" size="small" style={{ marginTop: 12 }}>
            {"Upload File"}
          </Button>
        </Upload>
      )}
    </div>
  );
};

export default TextAreaWithUploader;
