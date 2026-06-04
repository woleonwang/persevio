import { parseJSON, parseJSONArray } from "@/utils";
import { Get } from "@/utils/request";
import { message } from "antd";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

const useTalent = (options: { skipViewedAt?: boolean } = {}) => {
  const { skipViewedAt = false } = options;
  const { talentId: talentIdStr, jobId } = useParams<{
    talentId: string;
    jobId: string;
  }>();
  const talentId = parseInt(talentIdStr ?? "0");

  const [talent, setTalent] = useState<TTalent>();
  const [interviews, setInterviews] = useState<TInterviewWithFeedback[]>([]);

  useEffect(() => {
    if (!jobId) return;
    void fetchTalent();
  }, [talentIdStr, jobId]);

  const fetchTalent = async () => {
    if (!jobId) return;

    const query = skipViewedAt ? "?skip_viewed_at=1" : "";
    const { code, data } = await Get(
      `/api/jobs/${jobId}/talents/${talentId}${query}`,
    );

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

  const updateTalent = (patch: Partial<TTalent>) => {
    setTalent((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  return { talent, interviews, fetchTalent, updateTalent, jobId };
};

export default useTalent;
