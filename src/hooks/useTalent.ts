import { parseJSON, parseJSONArray } from "@/utils";
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
  const [interviews, setInterviews] = useState<TInterviewWithFeedback[]>([]);

  useEffect(() => {
    fetchTalent();
  }, [talentIdStr]);

  const fetchTalent = async () => {
    const { code, data } = await Get(`/api/jobs/${jobId}/talents/${talentId}`);

    if (code === 0) {
      const talent = data.talent;
      setTalent({
        ...talent,
        raw_evaluate_result: talent.evaluate_result,
        evaluate_result: parseJSON(talent.evaluate_result),
      });
      setInterviews(
        (data.interviews ?? []).map((item: any) => {
          return {
            ...item,
            time_slots: parseJSONArray(item.time_slots),
          };
        }),
      );
    } else {
      message.error("Get talent failed");
    }
  };

  return { talent, interviews, fetchTalent };
};

export default useTalent;
