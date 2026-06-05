import { readFileSync } from "node:fs";
import { join } from "node:path";

import { renderJobsChatPage } from "./_lib/jobPage.js";

type VercelRequest = {
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  setHeader: (key: string, value: string) => VercelResponse;
  send: (body: string) => void;
};

const getQueryValue = (
  value: string | string[] | undefined,
): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const loadIndexHtml = (): string => {
  const indexPath = join(process.cwd(), "dist", "index.html");
  return readFileSync(indexPath, "utf-8");
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const jobId = getQueryValue(req.query.id);
  const version = getQueryValue(req.query.version) ?? "0";
  const preview = getQueryValue(req.query.preview) === "1";
  const host = getQueryValue(req.headers.host);

  if (!jobId) {
    res.status(400).send("Missing job id");
    return;
  }

  try {
    const indexHtml = loadIndexHtml();
    const { status, html } = await renderJobsChatPage({
      host,
      jobId,
      version,
      preview,
      indexHtml,
    });

    res
      .status(status)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600")
      .send(html);
  } catch (error) {
    console.error("jobs-chat SSR failed:", error);
    res.status(500).send("Failed to render job page");
  }
}
