import { useEffect, useState } from "react";
import { Get } from "@/utils/request";
import CareerNav from "./components/CareerNav";
import HeroSection from "./components/HeroSection";
import JobsSection from "./components/JobsSection";
import CareerFooter from "./components/CareerFooter";
import { parseCareerSubdomain } from "./utils";
import styles from "./aboutMarkdown.module.less";
import "./careerPageStyles.less";

type TProps = {
  subdomain: string;
};

const PublicCareerPage = ({ subdomain }: TProps) => {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [page, setPage] = useState<IPublicCareerPage | null>(null);
  const [jobs, setJobs] = useState<ICareerPageJob[]>([]);

  useEffect(() => {
    document.title = page?.page_title ?? "Careers";
  }, [page?.page_title]);

  useEffect(() => {
    fetchCareerPage();
  }, []);

  const fetchCareerPage = async () => {
    setLoading(true);
    setNotFound(false);

    const [pageResult, jobsResult] = await Promise.all([
      Get<IPublicCareerPage>(`/api/public/career_pages/${subdomain}`),
      Get<{ jobs: ICareerPageJob[] }>(
        `/api/public/career_pages/${subdomain}/jobs`,
      ),
    ]);

    setLoading(false);

    if (pageResult.code !== 0 || !pageResult.data) {
      setNotFound(true);
      document.title = "Career page not found";
      return;
    }

    setPage(pageResult.data);
    document.title = pageResult.data.page_title;

    if (jobsResult.code === 0 && jobsResult.data?.jobs) {
      setJobs(jobsResult.data.jobs);
    } else {
      setJobs([]);
    }
  };

  if (loading) {
    return <div className={styles.loadingWrap}>Loading...</div>;
  }

  if (notFound || !page) {
    return <div className={styles.notFoundWrap}>Career page not found</div>;
  }

  return (
    <div className="careerPage">
      <CareerNav
        logo={page.company.logo}
        companyName={page.company.name}
        website={page.company.website}
        domain={page.domain}
      />

      <div className="pageShell">
        <HeroSection introduction={page.introduction} />

        <JobsSection jobs={jobs} domain={page.domain} />

        <CareerFooter />
      </div>
    </div>
  );
};

export const CareerPageEntry = () => {
  const subdomain = parseCareerSubdomain();

  if (!subdomain) {
    return null;
  }

  return <PublicCareerPage subdomain={subdomain} />;
};
