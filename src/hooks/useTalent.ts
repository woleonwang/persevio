import { parseJSON } from "@/utils";
import { Get } from "@/utils/request";
import { message } from "antd";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

const useTalent = () => {
  const { talentId: talentIdStr, jobId: jobIdStr } = useParams<{
    talentId: string;
    jobId: string;
  }>();
  const talentId = parseInt(talentIdStr ?? "0");
  const jobId = parseInt(jobIdStr ?? "0");

  const [talent, setTalent] = useState<TTalent>();

  useEffect(() => {
    fetchTalent();
  }, []);

  const fetchTalent = async () => {
    const { code, data } = await Get(
      `/api/public/jobs/${jobId}/talents/${talentId}`
    );

    if (code === 0) {
      const talent = data.talent;
      setTalent({
        ...talent,
        evaluate_result: parseJSON(talent.evaluate_result),
      });
    } else {
      message.error("Get talent failed");
    }
  };

  return { talent, fetchTalent };
};

export default useTalent;
