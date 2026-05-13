import React from "react";
import NewTalentDetail from "@/components/NewTalentDetail";
import { getQuery } from "@/utils";
import AtsTalentDetail from "@/components/AtsTalentDetail";
import AtsTalentDetailV2026 from "@/components/AtsTalentDetailV2026";

const TalentDetails: React.FC = () => {
  const isOld = getQuery("old") === "1";
  const isNext = getQuery("next") === "1";
  if (isOld) {
    return <NewTalentDetail />;
  }
  if (isNext) {
    return <AtsTalentDetailV2026 />;
  }
  return <AtsTalentDetail />;
};

export default TalentDetails;
