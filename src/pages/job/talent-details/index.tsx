import React from "react";
import NewTalentDetail from "@/components/NewTalentDetail";
import { getQuery } from "@/utils";
import AtsTalentDetail from "@/components/AtsTalentDetail";
import AtsTalentDetailV2026 from "@/components/AtsTalentDetailV2026";
import { observer } from "mobx-react-lite";

const TalentDetails: React.FC = () => {
  const isOld = getQuery("old") === "1";
  if (isOld) {
    return <NewTalentDetail />;
  }

  const next = getQuery("next");
  if (next === "1") {
    return <AtsTalentDetailV2026 />;
  }
  if (next === "0") {
    return <AtsTalentDetail />;
  }

  return <AtsTalentDetailV2026 />;
};

export default observer(TalentDetails);
