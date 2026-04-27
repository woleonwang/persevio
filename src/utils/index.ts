import { Modal, ModalFuncProps } from "antd";
import html2pdf from "html2pdf.js";
import logo from "@/assets/logo.png";

export const copy = async (text: string) => {
  await navigator.clipboard.writeText(text);
};

export const parseJSON = (jsonString?: string) => {
  if (!jsonString) return {};

  const startIndex = jsonString.indexOf("{");
  const lastIndex = jsonString.lastIndexOf("}");
  try {
    return JSON.parse(jsonString.slice(startIndex, lastIndex + 1));
  } catch (error) {
    // console.log("parse json error:", jsonString);
    return {};
  }
};

export const parseJSONArray = (jsonString?: string) => {
  if (!jsonString) return [];
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return [];
  }
};

export const parseMarkdown = (markdownString?: string) => {
  if (!markdownString) return "";

  return markdownString.includes("```markdown")
    ? markdownString.replace(/^.*```markdown/s, "").replace(/```$/, "")
    : markdownString;
};

// normalize string fields extracted from resume; treat "N.A." placeholders as empty
export const normalizeTalentField = (value?: string): string => {
  const s = (value ?? "").trim();
  if (s === "N.A." || s === "N.A") return "";
  return s;
};

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === "development";
};

export const parseJd = (originalJd: string) => {
  return originalJd.replaceAll(/<chatbot-delete>.*<\/chatbot-delete>/g, "");
};

export const formatInterviewMode = (mode: "ONSITE" | "ONLINE") => {
  return mode === "ONSITE" ? "现场面试" : "远程面试";
};

import { storage, StorageKey } from "./storage";
import type { TTalentDetailFrom } from "./consts";

export const checkJobDotStatus = (jobId: number, type: string): boolean => {
  const dotStatus = storage.get<Record<number, Record<string, number>>>(
    StorageKey.JOB_DOT,
    {},
  ) as Record<number, Record<string, number>>;
  return !!dotStatus[jobId]?.[type];
};

export const setJobDotStatus = (jobId: number, type: string) => {
  const dotStatus = storage.get<Record<number, Record<string, number>>>(
    StorageKey.JOB_DOT,
    {},
  ) as Record<number, Record<string, number>>;
  dotStatus[jobId] = dotStatus[jobId] ?? {};
  dotStatus[jobId][type] = Date.now();
  storage.set(StorageKey.JOB_DOT, dotStatus);
};

export const getQuery = (key: string): string => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(key) ?? "";
};

export const addQuery = (key: string, value: string) => {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.append(key, value);
  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}?${urlParams.toString()}`,
  );
};

export const deleteQuery = (key: string) => {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.delete(key);
  const query = urlParams.toString();
  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}`,
  );
};

export const updateQuery = (key: string, value: string) => {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set(key, value);
  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}?${urlParams.toString()}`,
  );
};

export const backOrDirect = (navigate: any, path: string) => {
  if (window.history.length > 1) {
    navigate(-1);
  } else {
    navigate(path);
  }
};

export const buildTalentDetailUrl = (
  jobId: number | string,
  talentId: number | string,
  from?: TTalentDetailFrom,
) => {
  const basePath = `/app/jobs/${jobId}/standard-board/talents/${talentId}`;
  return from ? `${basePath}?from=${from}` : basePath;
};

export const checkIsAdmin = (candidate?: ICandidateSettings) => {
  return (
    candidate &&
    [
      "marvinwang001@gmail.com",
      "laihuan15620@gmail.com",
      "jackytgx@gmail.com",
    ].includes(candidate.email)
  );
};

export const confirmModal = (modalParams: ModalFuncProps) => {
  Modal.confirm({
    icon: null,
    centered: true,
    ...modalParams,
  });
};

export const infoModal = (modalParams: ModalFuncProps) => {
  Modal.info({
    icon: null,
    centered: true,
    ...modalParams,
  });
};

export const downloadText = ({
  name,
  content,
}: {
  name: string;
  content: string;
}) => {
  // 创建 blob 并下载
  const blob = new Blob([content], {
    type: "text/plain;charset=utf-8",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

export const downloadMarkdownAsPDF = async ({
  name,
  element,
  options,
}: {
  name: string;
  element: HTMLElement;
  options?: {
    skipWrapper?: boolean;
    skipAutoSplit?: boolean;
  };
}) => {
  const skipWrapper = options?.skipWrapper ?? false;
  const skipAutoSplit = options?.skipAutoSplit ?? false;
  try {
    // 创建一个临时的包装容器
    const wrapper = document.createElement("div");
    wrapper.className = "persevio-pdf-wrapper";
    wrapper.style.width = "190mm";

    if (!skipWrapper) {
      // 创建 logo 容器
      const logoContainer = document.createElement("div");
      logoContainer.style.paddingBottom = "20px";
      logoContainer.style.borderBottom = "1px solid #e8e8e8";
      logoContainer.style.marginBottom = "20px";

      // 创建 logo 图片元素
      const logoImg = document.createElement("img");
      logoImg.src = logo;
      logoImg.style.maxWidth = "200px";
      logoImg.style.height = "auto";

      // 等待 logo 图片加载完成
      await new Promise<void>((resolve, reject) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = () => reject(new Error("Failed to load logo"));
        // 如果图片已经在缓存中，可能不会触发 onload
        if (logoImg.complete) {
          resolve();
        }
      });

      // 组装结构
      logoContainer.appendChild(logoImg);
      wrapper.appendChild(logoContainer);
    }

    // 克隆原始元素并添加到包装容器
    const clonedElement = element.cloneNode(true) as HTMLElement;
    wrapper.appendChild(clonedElement);

    // 将包装容器添加到 DOM（但不可见）
    document.body.appendChild(wrapper);

    const wrapperHeight = wrapper.offsetHeight;

    const opt: html2pdf.Options = {
      margin: [10, 10, 10, 10],
      filename: `${name}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: "mm",
        format: [210, Math.ceil(wrapperHeight * 0.27)],
        orientation: "portrait",
      },
      pagebreak: {
        mode: skipAutoSplit ? "css" : "avoid-all",
      },
    };

    await html2pdf()
      .set(opt as any)
      .from(wrapper)
      .save();

    // 清理：移除临时包装容器
    document.body.removeChild(wrapper);
  } catch (error) {
    console.error(error);
  }
};

export const formatSeconds = (seconds: number) => {
  return `${
    seconds / 60 < 10
      ? `0${Math.floor(seconds / 60)}`
      : Math.floor(seconds / 60)
  }:${
    seconds % 60 < 10
      ? `0${Math.floor(seconds % 60)}`
      : Math.floor(seconds % 60)
  }`;
};

export const getJobApplyStatus = (jobApply?: IJobApplyListItem) => {
  if (!jobApply) {
    return "chat";
  }
  if (jobApply.interviews && jobApply.interviews.length > 0) {
    return jobApply.interviews[0].scheduled_at
      ? "interview_scheduled"
      : "interview_created";
  }

  if (jobApply.talent_status === "accepted") {
    return "accepted";
  }
  if (jobApply.talent_status === "rejected") {
    return "rejected";
  }
  if (jobApply.interview_finished_at) {
    return "screening";
  }
  return "chat";
};

export const getJobChatbotUrl = (
  jobId: number,
  version: string,
  sourceChannel?: string,
) => {
  const query =
    sourceChannel != null && sourceChannel !== ""
      ? `?source_channel=${encodeURIComponent(sourceChannel)}`
      : "";
  return `${window.origin}/jobs/${jobId}/chat${
    version === "0" ? "" : `/${version}`
  }${query}`;
};

export const isTempAccount = (candidate: { email: string }) => {
  return candidate.email.endsWith("@persevio.ai");
};

export const getDocumentType = (key: string): string => {
  const words = key.split("-");
  const documentType = words
    .slice(0, words.length - 1)
    .join("-") as TEditableDocumentType;
  return documentType;
};

export const getEvaluateResultLevel = (
  report?: TReport,
): TInterviewRecommendation => {
  return report?.overall_recommendation?.interview_recommendation ?? "maybe";
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string");
  }
  if (typeof value === "string" && value.trim()) {
    return [value];
  }
  return [];
};

export const normalizeReport = (report: any): TReport => {
  const normalizedReport: TReport = {
    ...report,
  };

  const strengths = report.strengths ?? report.strength;
  normalizedReport.strengths = toStringArray(
    Array.isArray(strengths)
      ? strengths.map((item: { content?: string }) => item?.content)
      : Array.isArray(strengths)
        ? strengths.map((item: { content?: string }) => item?.content)
        : [],
  ).map((content) => ({ content }));

  const gaps = report.gaps ?? report.gap;
  normalizedReport.gaps = toStringArray(
    Array.isArray(gaps)
      ? gaps.map((item: { content?: string }) => item?.content)
      : Array.isArray(gaps)
        ? gaps.map((item: { content?: string }) => item?.content)
        : [],
  ).map((content) => ({ content }));

  const profileSnapshotFromObject = (() => {
    const snapshot = report.profile_snapshot;
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
      return [];
    }
    const result: { title: string; details: string | string[] }[] = [];
    const pushItem = (title: string, details?: string | string[]) => {
      if (!details) return;
      result.push({ title, details });
    };
    const snapshotObj = snapshot as {
      total_years_of_experience?: string;
      career_trajectory?: string;
      location_trajectory?: string;
      domain_expertise?: string[];
      work_environments?: string[];
      tenure?: {
        average?: string;
        longest?: string;
        shortest?: string;
        gaps?: string;
        interpretation?: string | null;
      };
      education?: string[];
      highlights?: string[] | null;
      flags?: string[] | null;
    };
    pushItem(
      "Total Years of Experience",
      snapshotObj.total_years_of_experience?.toString(),
    );
    pushItem("Career Trajectory", snapshotObj.career_trajectory);
    pushItem("Location Trajectory", snapshotObj.location_trajectory);
    pushItem("Domain Expertise", toStringArray(snapshotObj.domain_expertise));
    pushItem("Work Environments", toStringArray(snapshotObj.work_environments));
    const tenure = snapshotObj.tenure;
    if (tenure && typeof tenure === "object") {
      const tenureLines = [
        tenure.average ? `Average: ${tenure.average}` : "",
        tenure.longest ? `Longest: ${tenure.longest}` : "",
        tenure.shortest ? `Shortest: ${tenure.shortest}` : "",
        tenure.gaps ? `Gaps: ${tenure.gaps}` : "",
        tenure.interpretation ? `Interpretation: ${tenure.interpretation}` : "",
      ].filter(Boolean);
      pushItem("Tenure", tenureLines);
    }
    pushItem("Education", toStringArray(snapshotObj.education));
    pushItem("Highlights", toStringArray(snapshotObj.highlights));
    pushItem("Flags", toStringArray(snapshotObj.flags));
    return result;
  })();

  const snapshots = report.profile_snapshot ?? report.snapshots;
  normalizedReport.profile_snapshot = Array.isArray(snapshots)
    ? snapshots.map(
        (item: { title?: string; details?: string; content?: string }) => ({
          title: item?.title ?? "",
          details:
            ((item?.details as string) || (item?.content as string)) ?? "",
        }),
      )
    : profileSnapshotFromObject;

  const potentialGaps = (() => {
    const value = report.potential_gaps ?? report.gap;
    if (Array.isArray(value)) {
      return value.map((item: { title?: string; details?: string }) => ({
        title: item?.title ?? "",
        details: item?.details ?? "",
      }));
    }
    if (value && typeof value === "object") {
      const structural = toStringArray(
        (value.structural ?? []).map(
          (item: { title?: string; details?: string }) =>
            `${item?.title ?? ""}: ${item?.details ?? ""}`.trim(),
        ),
      ).map((text) => ({ title: "Structural", details: text }));
      const learnable = toStringArray(
        (value.learnable ?? []).map(
          (item: { title?: string; details?: string }) =>
            `${item?.title ?? ""}: ${item?.details ?? ""}`.trim(),
        ),
      ).map((text) => ({ title: "Learnable", details: text }));
      return [...structural, ...learnable];
    }
    return [];
  })();
  normalizedReport.potential_gaps = potentialGaps;

  const aiTopicsCoveredRaw = report.ai_interview_summary?.topics_covered;
  const topicsCovered =
    aiTopicsCoveredRaw &&
    typeof aiTopicsCoveredRaw === "object" &&
    !Array.isArray(aiTopicsCoveredRaw)
      ? {
          narrative: aiTopicsCoveredRaw.narrative ?? "",
          topics: toStringArray(aiTopicsCoveredRaw.topics),
        }
      : {
          narrative: "",
          topics: toStringArray(aiTopicsCoveredRaw),
        };
  if (!normalizedReport.ai_interview_summary) {
    normalizedReport.ai_interview_summary = {};
  }
  normalizedReport.ai_interview_summary.topics_covered = topicsCovered;

  const requirements = Array.isArray(report.requirements)
    ? report.requirements.map((item: any) => ({
        ...item,
        assessment: item.assessment ?? item.assessment_type ?? "",
      }))
    : [];
  normalizedReport.requirements = requirements;

  const normalizedOverallRecommendation = report.overall_recommendation
    ? {
        ...report.overall_recommendation,
        interview_recommendation:
          report.overall_recommendation?.interview_recommendation ??
          {
            ideal_candidate: "absolutely",
            good_fit: "yes",
            ideal_candidate_with_caveat: "yes_but",
            good_fit_with_caveat: "maybe",
            maybe: "maybe",
            not_a_fit: "no",
          }[
            (report.overall_recommendation?.result ||
              report.result ||
              "maybe") as string
          ],
      }
    : undefined;
  normalizedReport.overall_recommendation = normalizedOverallRecommendation;

  normalizedReport.areas_to_probe_further =
    report.areas_to_probe_further ?? report.areas_to_probe_futher ?? [];
  return normalizedReport;
};

/** 候选人卡片/搜索：合并 basicInfo 与 evaluate 侧字段 */
export type TCandidateCardSource = {
  name?: string;
  basicInfo?: TExtractBasicInfo;
  parsedEvaluateResult?: TReport;
};

export const getCandidateCardData = (item: TCandidateCardSource) => {
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
  const expectedCompensation =
    evaluateResult?.expected_compensation ||
    basicInfo?.expected_compensation ||
    "-";
  const fitResult = getEvaluateResultLevel(evaluateResult);
  const summaryText =
    typeof evaluateResult?.summary === "string"
      ? evaluateResult.summary
      : evaluateResult?.summary?.description || "";
  const summary = evaluateResult?.thumbnail_summary || summaryText;
  return {
    name,
    basicInfo,
    evaluateResult,
    exp,
    location,
    visa,
    comp,
    expectedCompensation,
    fitResult,
    summary,
  };
};

export const DEFAULT_TRACKING_SOURCES = [
  "direct",
  "linkedin",
  "jobstreet",
  "mycareersfuture",
  "persevio",
  "email_inbound",
] as const;

export const SOURCING_CHANNEL_KEYS = [...DEFAULT_TRACKING_SOURCES];

export const getSourcingChannel = (sc: string = "persevio"): string => {
  if (sc === "customer") return "direct";
  if (sc === "system" || sc === "delivery" || sc === "") return "persevio";
  return sc;
};

export const getCompanyLogo = (logo: string = "") => {
  if (logo === "persevio") {
    return "/company-logo/persevio.png";
  }
  return logo.startsWith("http") ? logo : `/api/logo/${logo}`;
};
