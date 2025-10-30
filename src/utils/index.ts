import { Modal, ModalFuncProps } from "antd";

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
    console.log("parse json error:", jsonString);
    return {};
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

export const checkJobDotStatus = (jobId: number, type: string): boolean => {
  const dotStatus = JSON.parse(localStorage.getItem(`job_dot`) ?? "{}");
  return !!dotStatus[jobId]?.[type];
};

export const setJobDotStatus = (jobId: number, type: string) => {
  const dotStatus = JSON.parse(localStorage.getItem(`job_dot`) ?? "{}");
  dotStatus[jobId] = dotStatus[jobId] ?? {};
  dotStatus[jobId][type] = Date.now();
  localStorage.setItem(`job_dot`, JSON.stringify(dotStatus));
};

export const getQuery = (key: string): string => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(key) ?? "";
};

export const deleteQuery = (key: string) => {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.delete(key);
  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}?${urlParams.toString()}`
  );
};

export const updateQuery = (key: string, value: string) => {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set(key, value);
  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}?${urlParams.toString()}`
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
