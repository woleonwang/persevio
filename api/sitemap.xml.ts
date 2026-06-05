import { getBackendUrl, getSiteOrigin } from "./_lib/backend.js";

type VercelRequest = {
  headers: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  setHeader: (key: string, value: string) => VercelResponse;
  send: (body: string) => void;
};

type TPublicJob = {
  id: number;
  posted_at?: string;
  updated_at?: string;
};

type TPublicJobsResponse = {
  code: number;
  data?: {
    jobs: TPublicJob[];
  };
};

const getHeaderValue = (
  value: string | string[] | undefined,
): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const host = getHeaderValue(req.headers.host);
  const origin = getSiteOrigin(host);
  const backendUrl = getBackendUrl(host);

  try {
    const response = await fetch(`${backendUrl}/public/jobs`);
    if (!response.ok) {
      res.status(502).send("Failed to fetch public jobs");
      return;
    }

    const result = (await response.json()) as TPublicJobsResponse;
    const jobs = result.data?.jobs ?? [];

    const urls = jobs
      .map((job) => {
        const lastmod = job.updated_at || job.posted_at;
        const lastmodTag = lastmod
          ? `<lastmod>${escapeXml(lastmod)}</lastmod>`
          : "";

        return `
    <url>
      <loc>${escapeXml(`${origin}/jobs/${job.id}/chat`)}</loc>
      ${lastmodTag}
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`;
      })
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`;

    res
      .status(200)
      .setHeader("Content-Type", "application/xml; charset=utf-8")
      .setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400")
      .send(xml);
  } catch (error) {
    console.error("sitemap generation failed:", error);
    res.status(500).send("Failed to generate sitemap");
  }
}
