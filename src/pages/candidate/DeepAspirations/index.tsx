import CandidateChat from "@/components/CandidateChat";
import MarkdownContainer from "@/components/MarkdownContainer";
import { parseMarkdown } from "@/utils";
import { Get } from "@/utils/request";
import { useEffect, useState } from "react";

const DeepAspirations = () => {
  const [aspirationsContent, setAspirationsContent] = useState("");

  useEffect(() => {
    fetchAspirations();
  }, []);

  const fetchAspirations = async () => {
    const { code, data } = await Get(
      "/api/candidate/docs/initial_career_aspiration"
    );
    if (code === 0) {
      setAspirationsContent(parseMarkdown(data.content));
    }
  };

  return (
    <div>
      <CandidateChat chatType="deep_aspirations" />
    </div>
  );
};

export default DeepAspirations;
