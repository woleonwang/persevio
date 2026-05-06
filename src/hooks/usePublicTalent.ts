import { parseJSON } from "@/utils";
import { Get } from "@/utils/request";
import { message } from "antd";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

const usePublicTalent = () => {
  const { talentId: talentIdStr, jobId } = useParams<{
    talentId: string;
    jobId: string;
  }>();
  const talentId = parseInt(talentIdStr ?? "0");

  const [talent, setTalent] = useState<TTalent>();

  useEffect(() => {
    if (!jobId) return;
    void fetchTalent();
  }, [jobId, talentId]);

  const fetchTalent = async () => {
    if (!jobId) return;

    const { code, data } = await Get(
      `/api/public/jobs/${jobId}/talents/${talentId}`,
    );

    if (code === 0) {
      const talent = data.talent;
      setTalent({
        ...talent,
        raw_evaluate_result: talent.evaluate_result,
        evaluate_result: parseJSON(talent.evaluate_result),
      });
    } else {
      message.error("Get talent failed");
    }
  };

  return { talent, fetchTalent };
};

export default usePublicTalent;
