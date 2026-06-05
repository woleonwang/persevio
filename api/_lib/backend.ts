export const getBackendUrl = (host: string | undefined): string => {
  if (process.env.API_BACKEND_URL) {
    return process.env.API_BACKEND_URL.replace(/\/$/, "");
  }
  if (host?.includes("dev.persevio.ai")) {
    return "http://43.98.198.100:10809";
  }
  if (host?.includes("persevio.ai")) {
    return "http://47.236.233.206:10808";
  }
  return "http://localhost:10808";
};

export const getSiteOrigin = (host: string | undefined): string => {
  if (host) {
    return `https://${host}`;
  }
  return "https://www.persevio.ai";
};
