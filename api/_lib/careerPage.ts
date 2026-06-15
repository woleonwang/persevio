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

type TPublicCareerPageCompany = {
  name: string;
  logo: string;
  website: string;
};

type TPublicCareerPageData = {
  page_title: string;
  introduction: string;
  company: TPublicCareerPageCompany;
  career_page_url: string;
  career_page_suffix: string;
  domain: string;
};

type TPublicCareerPageResponse = {
  code: number;
  data?: TPublicCareerPageData;
};

type TCareerPageJob = {
  id: number;
  candidate_uuid: string;
  name: string;
  posted_at?: string;
  version: number;
  basic_info: string;
};

type TPublicCareerPageJobsResponse = {
  code: number;
  data?: {
    jobs: TCareerPageJob[];
  };
};

const ROLE_TYPE_LABELS: Record<string, string> = {
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

const CAREER_HOST_PATTERN =
  /^([a-z_-]+)\.careers(?:-dev)?\.persevio\.ai$/i;

export const parseCareerSubdomainFromHost = (
  host: string | undefined,
): string | null => {
  if (!host) return null;
  const hostname = host.split(":")[0];
  const match = hostname.match(CAREER_HOST_PATTERN);
  return match ? match[1] : null;
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

const getJobChatbotUrl = (
  domain: string,
  candidateUuid: string,
  version: number,
): string => {
  const base = domain.startsWith("http") ? domain : `https://${domain}`;
  const versionPath = version === 0 ? "" : `/${version}`;
  return `${base.replace(/\/$/, "")}/jobs/${candidateUuid}/chat${versionPath}`;
};

const buildJobItemHtml = (options: {
  job: TCareerPageJob;
  domain: string;
}): string => {
  const { job, domain } = options;
  const basicInfo = parseJson<TJobBasicInfo>(job.basic_info, {});
  const locations = basicInfo.location?.map((item) => item.city).join(", ");
  const roleType = basicInfo.role_type
    ? (ROLE_TYPE_LABELS[basicInfo.role_type] ?? basicInfo.role_type)
    : "";
  const jobUrl = getJobChatbotUrl(domain, job.candidate_uuid, job.version);
  const postedAtHtml = job.posted_at
    ? `<time datetime="${escapeHtml(job.posted_at)}">${escapeHtml(job.posted_at)}</time>`
    : "";

  return `
    <article class="careerPageSeoJob">
      <h3><a href="${escapeHtml(jobUrl)}">${escapeHtml(job.name)}</a></h3>
      ${postedAtHtml ? `<p>${postedAtHtml}</p>` : ""}
      <p>
        ${roleType ? `<span>${escapeHtml(roleType)}</span>` : ""}
        ${locations ? `<span>${escapeHtml(locations)}</span>` : ""}
      </p>
    </article>
  `;
};

const buildCareerPageBodyHtml = (options: {
  page: TPublicCareerPageData;
  jobs: TCareerPageJob[];
  origin: string;
}): string => {
  const { page, jobs, origin } = options;
  const { company } = page;
  const logoUrl = getCompanyLogoUrl(origin, company.logo);
  const logoHtml = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(company.name)}" width="176" height="45" />`
    : "";

  const websiteHtml = company.website
    ? `<a href="${escapeHtml(company.website)}" rel="noopener noreferrer">${escapeHtml(company.name)}</a>`
    : escapeHtml(company.name);

  const jobsHtml = jobs.length
    ? jobs
        .map((job) => buildJobItemHtml({ job, domain: page.domain }))
        .join("")
    : "<p>No open positions at the moment.</p>";

  return `
    <main class="careerPageSeo">
      <style>
        .careerPageSeo {
          max-width: 960px;
          margin: 0 auto;
          padding: 24px 20px 48px;
          color: #1f1f1f;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          line-height: 1.6;
          opacity: 0;
        }
        .careerPageSeo h1,
        .careerPageSeo h2,
        .careerPageSeo h3 {
          margin: 0 0 12px;
        }
        .careerPageSeo h1 {
          font-size: 32px;
          line-height: 1.25;
        }
        .careerPageSeo h2 {
          margin-top: 32px;
          font-size: 24px;
        }
        .careerPageSeoHeader {
          display: flex;
          gap: 16px;
          align-items: center;
          margin-bottom: 24px;
        }
        .careerPageSeoJob {
          padding: 16px 0;
          border-top: 1px solid #eee;
        }
        .careerPageSeoJob h3 {
          font-size: 20px;
        }
        .careerPageSeoJob a {
          color: #3682fe;
          text-decoration: none;
        }
        .careerPageSeoJob p {
          margin: 0 0 8px;
          color: #666;
        }
        .careerPageSeoJob span + span::before {
          content: " · ";
        }
      </style>
      <header class="careerPageSeoHeader">
        ${logoHtml}
        <div>${websiteHtml}</div>
      </header>
      <section>
        <h1>About Us</h1>
        ${markdownToSimpleHtml(page.introduction)}
      </section>
      <section>
        <h2>Job Openings</h2>
        ${jobsHtml}
      </section>
    </main>
  `;
};

const buildDescription = (page: TPublicCareerPageData): string => {
  const plainText = stripMarkdown(page.introduction);
  const fallback = `${page.company.name} career opportunities`;
  return truncate(plainText || fallback, 160);
};

export const fetchPublicCareerPage = async (
  host: string | undefined,
  subdomain: string,
): Promise<TPublicCareerPageResponse> => {
  const backendUrl = getBackendUrl(host);
  const response = await fetch(
    `${backendUrl}/public/career_pages/${encodeURIComponent(subdomain)}`,
  );

  if (!response.ok) {
    return { code: -1 };
  }

  return (await response.json()) as TPublicCareerPageResponse;
};

export const fetchPublicCareerPageJobs = async (
  host: string | undefined,
  subdomain: string,
): Promise<TPublicCareerPageJobsResponse> => {
  const backendUrl = getBackendUrl(host);
  const response = await fetch(
    `${backendUrl}/public/career_pages/${encodeURIComponent(subdomain)}/jobs`,
  );

  if (!response.ok) {
    return { code: -1 };
  }

  return (await response.json()) as TPublicCareerPageJobsResponse;
};

export const renderCareerPage = async (options: {
  host: string | undefined;
  subdomain: string;
  indexHtml: string;
}): Promise<{ status: number; html: string }> => {
  const { host, subdomain, indexHtml } = options;
  const origin = getSiteOrigin(host);

  const [pageResult, jobsResult] = await Promise.all([
    fetchPublicCareerPage(host, subdomain),
    fetchPublicCareerPageJobs(host, subdomain),
  ]);

  if (pageResult.code !== 0 || !pageResult.data) {
    const title = "Career Page Not Found | Persevio";
    const html = injectSeoIntoIndexHtml(indexHtml, {
      title,
      description: "This career page is not available.",
      canonicalUrl: origin,
      noindex: true,
      bodyHtml:
        '<main class="careerPageSeo"><h1>Career page not found</h1><p>This career page is not available.</p></main>',
    });

    return { status: 404, html };
  }

  const page = pageResult.data;
  const jobs = jobsResult.data?.jobs ?? [];
  const title = page.page_title;
  const description = buildDescription(page);
  const canonicalUrl = page.career_page_url || origin;
  const bodyHtml = buildCareerPageBodyHtml({ page, jobs, origin });

  const html = injectSeoIntoIndexHtml(indexHtml, {
    title,
    description,
    canonicalUrl,
    noindex: false,
    bodyHtml,
  });

  return { status: 200, html };
};
