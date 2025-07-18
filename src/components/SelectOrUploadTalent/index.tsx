import { Get, Post, PostFormData } from "@/utils/request";
import { Input, message, Select } from "antd";
import { Button, Upload } from "antd";
import { useEffect, useState } from "react";

interface IProps {
  jobId: number;
  value?: number;
  onChange?: (val: number) => void;
}

type TTalent = {
  id: number;
  name: string;
  parsed_content: string;
};

const SelectOrUploadTalent = (props: IProps) => {
  const { jobId, value, onChange } = props;

  const [talents, setTalents] = useState<TTalent[]>([]);
  const [internalValue, setInternalValue] = useState<number>();

  useEffect(() => {
    fetchTalents();
  }, []);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const fetchTalents = async () => {
    const { code, data } = await Get<{
      talents: TTalent[];
    }>(`/api/jobs/${jobId}/talents`);

    if (code === 0) {
      setTalents(data.talents);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Select
          placeholder="选择候选人"
          options={talents.map((talent) => ({
            value: talent.id,
            label: talent.name,
          }))}
          value={value}
          onChange={(v) => {
            setInternalValue(v);
            onChange?.(v);
          }}
          style={{ width: 200 }}
        />

        <div>Or</div>

        <Upload
          beforeUpload={() => false}
          onChange={async (fileInfo) => {
            const formData = new FormData();
            formData.append("file", fileInfo.file as any);
            const { code, data } = await PostFormData(
              `/api/jobs/${jobId}/upload_resume_for_interview_design`,
              formData
            );
            if (code !== 0) {
              message.error("Upload failed");
              return;
            }

            message.success("Upload succeed");
            const { code: code2, data: data2 } = await Post(
              `/api/jobs/${jobId}/talents`,
              {
                resume: data.resume,
              }
            );
            if (code2 === 0) {
              await fetchTalents();
              setInternalValue(data2.talent_id);
              onChange?.(data2.talent_id);
            }
          }}
          showUploadList={false}
          accept=".docx,.pdf"
          multiple={false}
        >
          <Button type="primary">Upload Resume</Button>
        </Upload>
      </div>

      {internalValue && (
        <div style={{ marginTop: 12 }}>
          <Input.TextArea
            readOnly
            rows={10}
            value={
              talents.find((talent) => talent.id === internalValue)
                ?.parsed_content ?? ""
            }
          />
        </div>
      )}
    </div>
  );
};

export default SelectOrUploadTalent;
