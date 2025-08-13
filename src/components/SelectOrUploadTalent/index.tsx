import { Get, Post, PostFormData } from "@/utils/request";
import { Input, message, Select } from "antd";
import { Button, Upload } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface IProps {
  jobId: number;
  value?: number;
  onChange?: (val: number) => void;
}

const SelectOrUploadTalent = (props: IProps) => {
  const { jobId, value, onChange } = props;
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`talent.${key}`);

  const [talents, setTalents] = useState<TTalent[]>([]);
  const [internalValue, setInternalValue] = useState<number>();
  const [isUploading, setIsUploading] = useState(false);

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
          placeholder={t("select_candidate")}
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

        <div>{t("or")}</div>

        <Upload
          beforeUpload={() => false}
          onChange={async (fileInfo) => {
            if (isUploading) return;

            const formData = new FormData();
            formData.append("file", fileInfo.file as any);

            setIsUploading(true);
            const { code, data } = await PostFormData(
              `/api/jobs/${jobId}/upload_resume_for_interview_design`,
              formData
            );

            if (code !== 0) {
              message.error(t("upload_failed"));
              setIsUploading(false);
              return;
            }

            const { talent_name: talentName, resume } = data;
            const { code: code3, data: data3 } = await Get(
              `/api/jobs/${jobId}/talents/check_name?name=${talentName}`
            );
            if (code3 !== 0) {
              message.error(t("upload_failed"));
              setIsUploading(false);
              return;
            }

            if (
              data3.is_exists &&
              !confirm(t("candidate_exists_confirm").replace("{{name}}", talentName))
            ) {
              setIsUploading(false);
              return;
            }

            const { code: code2, data: data2 } = await Post(
              `/api/jobs/${jobId}/talents`,
              {
                resume: resume,
                name: talentName,
              }
            );
            if (code2 === 0) {
              await fetchTalents();
              setInternalValue(data2.talent_id);
              onChange?.(data2.talent_id);
              message.success(t("upload_succeed"));
            }

            setIsUploading(false);
          }}
          showUploadList={false}
          accept=".docx,.doc,.pdf"
          multiple={false}
        >
          <Button type="primary" loading={isUploading} disabled={isUploading}>
            {t("upload_resume")}
          </Button>
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
