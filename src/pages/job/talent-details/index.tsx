import React from "react";
import NewTalentDetail from "@/components/NewTalentDetail";
import { getQuery } from "@/utils";
import AtsTalentDetail from "@/components/AtsTalentDetail";

const TalentDetails: React.FC = () => {
  const isOld = getQuery("old") === "1";
  return isOld ? <NewTalentDetail /> : <AtsTalentDetail />;
};

export default TalentDetails;
