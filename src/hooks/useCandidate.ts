import { Get } from "@/utils/request";
import { useEffect, useState } from "react";
const useCandidate = () => {
  const [candidate, setCandidate] = useState<ICandidateSettings>();

  useEffect(() => {
    fetchCandidate();
  }, []);

  const fetchCandidate = async () => {
    const { code, data } = await Get(`/api/candidate/settings`);

    if (code === 0) {
      const candidate: ICandidateSettings = data.candidate ?? data;
      setCandidate(candidate);
    }
  };

  return { candidate, fetchCandidate };
};

export default useCandidate;
