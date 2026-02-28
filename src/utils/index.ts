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

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === "development";
};

export const getImgSrc = (originalUrl: string) => {
  return originalUrl.startsWith("http")
    ? originalUrl
    : `/api/logo/${originalUrl}`;
};

export const parseJd = (originalJd: string) => {
  return originalJd.replaceAll(/<chatbot-delete>.*<\/chatbot-delete>/g, "");
};

export const formatInterviewMode = (mode: "ONSITE" | "ONLINE") => {
  return mode === "ONSITE" ? "现场面试" : "远程面试";
};

import { storage, StorageKey } from "./storage";

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
}: {
  name: string;
  element: HTMLElement;
}) => {
  try {
    // 创建一个临时的包装容器
    const wrapper = document.createElement("div");
    wrapper.className = "persevio-pdf-wrapper";
    wrapper.style.width = "190mm";

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

    // 克隆原始元素并添加到包装容器
    const clonedElement = element.cloneNode(true) as HTMLElement;
    wrapper.appendChild(clonedElement);

    // 将包装容器添加到 DOM（但不可见）
    document.body.appendChild(wrapper);

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
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: {
        mode: "avoid-all",
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
  return `${window.origin}/jobs/${jobId}/chat${
    version === "0" ? "" : `/${version}`
  }${sourceChannel ? `?source_channel=${sourceChannel}` : ""}`;
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
  result?: string,
): TEvaluateResultLevel => {
  if (!result) return "maybe";

  const resultOptions = [
    "ideal_candidate",
    "good_fit",
    "ideal_candidate_with_caveat",
    "good_fit_with_caveat",
    "maybe",
    "not_a_fit",
  ];

  return resultOptions.includes(result)
    ? (result as TEvaluateResultLevel)
    : "maybe";
};

export const SOURCING_CHANNEL_KEYS = [
  "system",
  "linkedin",
  "jobstreet",
  "mycareersfuture",
];

export const getSourcingChannel = (sourcingChannel?: string) => {
  const sc =
    sourcingChannel && SOURCING_CHANNEL_KEYS.includes(sourcingChannel)
      ? sourcingChannel
      : "system";
  return sc === "customer" ? "linkedin" : sc;
};
