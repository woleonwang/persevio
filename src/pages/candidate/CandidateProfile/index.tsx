import MarkdownContainer from "@/components/MarkdownContainer";
import { parseMarkdown } from "@/utils";
import { Get } from "@/utils/request";
import { useEffect, useState } from "react";

const CandidateProfile = () => {
  const [resume, setResume] = useState("");

  useEffect(() => {
    fetchResume();
  }, []);

  const fetchResume = async () => {
    const { code, data } = await Get("/api/candidate/docs/llm_resume");
    if (code === 0) {
      setResume(parseMarkdown(data.content));
    }
  };

  return (
    <div>
      <MarkdownContainer content={resume} />
    </div>
  );
};

export default CandidateProfile;
