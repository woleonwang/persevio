import { getEvaluateResultLevel } from "@/utils";
import type { TTalentListItem } from "./types";

export function getCandidateCardData(item: TTalentListItem) {
  const basicInfo = item.basicInfo;
  const evaluateResult = item.parsedEvaluateResult;
  const name = item.name || "-";
  const exp = basicInfo?.years_of_experience || "-";
  const visa = evaluateResult?.visa || basicInfo?.visa || "-";
  const comp =
    evaluateResult?.current_compensation ||
    basicInfo?.current_compensation ||
    "-";
  const fitResult = getEvaluateResultLevel(
    evaluateResult?.overall_recommendation?.result || evaluateResult?.result,
  );
  const summary =
    evaluateResult?.thumbnail_summary || evaluateResult?.summary || "";
  return {
    name,
    basicInfo,
    evaluateResult,
    exp,
    visa,
    comp,
    fitResult,
    summary,
  };
}
