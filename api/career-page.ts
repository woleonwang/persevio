import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  parseCareerSubdomainFromHost,
  renderCareerPage,
} from "./_lib/careerPage.js";

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
  const host = getQueryValue(req.headers.host);
  const subdomainFromQuery = getQueryValue(req.query.subdomain);
  const subdomain =
    subdomainFromQuery || parseCareerSubdomainFromHost(host);

  if (!subdomain) {
    res.status(400).send("Missing career page subdomain");
    return;
  }

  try {
    const indexHtml = loadIndexHtml();
    const { status, html } = await renderCareerPage({
      host,
      subdomain,
      indexHtml,
    });

    res
      .status(status)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600")
      .send(html);
  } catch (error) {
    console.error("career-page SSR failed:", error);
    res.status(500).send("Failed to render career page");
  }
}
