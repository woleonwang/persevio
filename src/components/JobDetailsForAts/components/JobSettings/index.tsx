import { Get, Post } from "@/utils/request";
import { Button, message, Select } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface IProps {
  jobId: number;
}

type TAdminJob = {
  id: number;
  job_id: number;
  admin_id: number;
};

type THunter = {
  id: number;
  name: string;
};
const JobSettings = (props: IProps) => {
  const { jobId } = props;
  const [hunters, setHunters] = useState<THunter[]>([]);
  const [selectedHunters, setSelectedHunters] = useState<number[]>([]);

  useEffect(() => {
    fetchJobSettings();
    fetchAdmins();
  }, [jobId]);

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`job_details.${key}`);

  const fetchJobSettings = async () => {
    const { code, data } = await Get(`/api/admin/jobs/${jobId}/settings`);
    if (code === 0) {
      setSelectedHunters(
        (data.admin_jobs ?? []).map((job: TAdminJob) => job.admin_id)
      );
    }
  };

  const fetchAdmins = async () => {
    const { code, data } = await Get("/api/admin/hunters");
    if (code === 0) {
      setHunters(data.hunters);
    }
  };

  const distributeHunter = async () => {
    const { code } = await Post(`/api/admin/jobs/${jobId}/hunters`, {
      hunter_ids: selectedHunters,
    });
    if (code === 0) {
      message.success(t("saveSuccess"));
    }
  };

  return (
    <div>
      <div>
        <div>{t("assignHunters")}</div>
        <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
          <Select
            mode="multiple"
            options={hunters.map((hunter) => ({
              value: hunter.id,
              label: hunter.name,
            }))}
            value={selectedHunters}
            onChange={(value) => {
              setSelectedHunters(value);
            }}
            style={{ width: 400 }}
          />
          <Button
            type="primary"
            onClick={() => {
              distributeHunter();
            }}
          >
            {t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JobSettings;
