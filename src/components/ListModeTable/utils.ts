import { getEvaluateResultLevel } from "@/utils";

export function getCandidateCardData(item: TTalentListItem) {
  const basicInfo = item.basicInfo;
  const evaluateResult = item.parsedEvaluateResult;
  const name = item.name || "-";
  const exp = basicInfo?.years_of_experience || "-";
  const location = basicInfo?.location || "-";
  const visa = evaluateResult?.visa || basicInfo?.visa || "-";
  const comp =
    evaluateResult?.current_compensation ||
    basicInfo?.current_compensation ||
    "-";
  const fitResult = getEvaluateResultLevel(evaluateResult);
  const summary =
    evaluateResult?.thumbnail_summary || evaluateResult?.summary || "";
  return {
    name,
    basicInfo,
    evaluateResult,
    exp,
    location,
    visa,
    comp,
    fitResult,
    summary,
  };
}
