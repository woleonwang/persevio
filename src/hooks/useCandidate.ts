import { Get } from "@/utils/request";
import { useEffect, useState } from "react";
const useCandidate = (options: { withDoc?: boolean } = {}) => {
  const { withDoc = false } = options;
  const [candidate, setCandidate] = useState<ICandidateSettings>();
  const [inited, setInited] = useState(false);

  useEffect(() => {
    fetchCandidate();
  }, []);

  const fetchCandidate = async () => {
    const { code, data } = await Get(
      `/api/candidate/settings${withDoc ? "?with_doc=1" : ""}`
    );

    if (code === 0) {
      const candidate: ICandidateSettings = data.candidate ?? data;
      setCandidate(candidate);
    }
    setInited(true);
  };

  return { candidate, fetchCandidate, inited };
};

export default useCandidate;
