import { getBackendUrl, getSiteOrigin } from "./backend.js";
import {
  escapeHtml,
  injectSeoIntoIndexHtml,
  markdownToSimpleHtml,
  stripMarkdown,
  truncate,
} from "./html.js";

type TJobBasicInfo = {
  location?: { city: string }[];
  role_type?: string;
};

type TJobDescriptionJson = {
  company_introduction?: string;
  job_description?: string;
  basic_requirements?: string;
  bonus_points?: string;
};

type TCompany = {
  logo: string;
  name: string;
};

type TJob = {
  id: number;
  name: string;
  job_description: string;
  job_description_json: string;
  basic_info: string;
  posted_at?: string;
};

type TPublicJobResponse = {
  code: number;
  data?: {
    job: TJob;
    company: TCompany;
  };
};

const ROLE_TYPE_LABELS: Record<string, string> = {
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

const getCompanyLogoUrl = (origin: string, logo: string): string => {
  if (!logo) return "";
  if (logo === "persevio") {
    return `${origin}/company-logo/persevio.png`;
  }
  if (logo.startsWith("http")) {
    return logo;
  }
  return `${origin}/api/logo/${logo}`;
};

const parseJson = <T>(value: string | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const buildJobBodyHtml = (options: {
  job: TJob;
  company: TCompany;
  origin: string;
}): string => {
  const { job, company, origin } = options;
  const basicInfo = parseJson<TJobBasicInfo>(job.basic_info, {});
  const jobDescriptionJson = parseJson<TJobDescriptionJson>(
    job.job_description_json,
    {},
  );

  const locations = basicInfo.location?.map((item) => item.city).join(", ");
  const roleType = basicInfo.role_type
    ? (ROLE_TYPE_LABELS[basicInfo.role_type] ?? basicInfo.role_type)
    : "";

  const logoUrl = getCompanyLogoUrl(origin, company.logo);
  const logoHtml = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(company.name)}" width="64" height="64" />`
    : "";

  const attributes: string[] = [];
  if (locations) attributes.push(`<li>Location: ${escapeHtml(locations)}</li>`);
  if (roleType) attributes.push(`<li>Role type: ${escapeHtml(roleType)}</li>`);

  const companyIntro = jobDescriptionJson.company_introduction
    ? `
      <section>
        <h2>${escapeHtml(company.name)}</h2>
        ${markdownToSimpleHtml(jobDescriptionJson.company_introduction)}
      </section>
    `
    : "";

  const postedAtHtml = job.posted_at
    ? `<p><small>Updated at ${escapeHtml(job.posted_at)}</small></p>`
    : "";

  return `
    <main class="jobsChatSeo">
      <style>
        .jobsChatSeo {
          max-width: 960px;
          margin: 0 auto;
          padding: 24px 20px 48px;
          color: #1f1f1f;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          line-height: 1.6;
          opacity: 0;
        }
        .jobsChatSeo h1 {
          margin: 0 0 8px;
          font-size: 32px;
          line-height: 1.25;
        }
        .jobsChatSeo h2 {
          margin: 24px 0 12px;
          font-size: 20px;
        }
        .jobsChatSeo .jobsChatSeoHeader {
          display: flex;
          gap: 16px;
          align-items: center;
          margin-bottom: 24px;
        }
        .jobsChatSeo .jobsChatSeoCompany {
          color: #666;
          font-size: 18px;
          margin-bottom: 12px;
        }
        .jobsChatSeo ul {
          margin: 0;
          padding-left: 20px;
          color: #444;
        }
        .jobsChatSeo p {
          margin: 0 0 12px;
        }
      </style>
      <header class="jobsChatSeoHeader">
        ${logoHtml}
        <div>
          <h1>${escapeHtml(job.name)}</h1>
          <div class="jobsChatSeoCompany">${escapeHtml(company.name)}</div>
          ${attributes.length ? `<ul>${attributes.join("")}</ul>` : ""}
        </div>
      </header>
      ${companyIntro}
      <section>
        <h2>Job Description</h2>
        ${markdownToSimpleHtml(job.job_description)}
      </section>
      ${postedAtHtml}
    </main>
  `;
};

const buildDescription = (job: TJob, company: TCompany): string => {
  const jobDescriptionJson = parseJson<TJobDescriptionJson>(
    job.job_description_json,
    {},
  );
  const source =
    jobDescriptionJson.job_description ||
    job.job_description ||
    jobDescriptionJson.company_introduction ||
    "";

  const plainText = stripMarkdown(source);
  const fallback = `${job.name} at ${company.name}`;
  return truncate(plainText || fallback, 160);
};

export const fetchPublicJob = async (
  host: string | undefined,
  jobId: string,
  version: string,
): Promise<TPublicJobResponse> => {
  const backendUrl = getBackendUrl(host);
  const response = await fetch(
    `${backendUrl}/public/jobs/${jobId}?version=${version}`,
  );

  if (!response.ok) {
    return { code: -1 };
  }

  return (await response.json()) as TPublicJobResponse;
};

export const renderJobsChatPage = async (options: {
  host: string | undefined;
  jobId: string;
  version: string;
  preview: boolean;
  indexHtml: string;
}): Promise<{ status: number; html: string }> => {
  const { host, jobId, version, preview, indexHtml } = options;
  const origin = getSiteOrigin(host);
  const canonicalUrl = `${origin}/jobs/${jobId}/chat`;
  const result = await fetchPublicJob(host, jobId, version);

  if (result.code !== 0 || !result.data) {
    const title = "Job Not Found | Persevio";
    const html = injectSeoIntoIndexHtml(indexHtml, {
      title,
      description: "This job is no longer available.",
      canonicalUrl,
      noindex: true,
      bodyHtml:
        '<main class="jobsChatSeo"><h1>Job Not Found</h1><p>This job is no longer available.</p></main>',
    });

    return { status: 404, html };
  }

  const { job, company } = result.data;
  const title = `${job.name} - ${company.name} | Persevio`;
  const description = buildDescription(job, company);
  const bodyHtml = buildJobBodyHtml({ job, company, origin });

  const html = injectSeoIntoIndexHtml(indexHtml, {
    title,
    description,
    canonicalUrl,
    noindex: preview,
    bodyHtml,
  });

  return { status: 200, html };
};
