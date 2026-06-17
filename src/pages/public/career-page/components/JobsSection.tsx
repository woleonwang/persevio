import { Input, Select } from "antd";
import { useEffect, useRef, useState } from "react";
import {
  CAREER_PAGE_SIZE,
  formatPostedTime,
  getJobChatbotUrl,
  getJobLocationLabel,
  getJobRoleTypeLabel,
} from "../utils";
import styles from "./jobsSection.module.less";
import Icon from "@/components/Icon";
import Search from "@/assets/icons/search";
import Down from "@/assets/icons/down";

type TProps = {
  jobs: ICareerPageJob[];
  domain: string;
};

const WORKPLACE_OPTIONS = ["On-site", "Hybrid", "Remote"];

const JobsSection = ({ jobs, domain }: TProps) => {
  const [search, setSearch] = useState("");
  const [workplace, setWorkplace] = useState<string>();
  const [location, setLocation] = useState<string>();
  const [visibleCount, setVisibleCount] = useState(CAREER_PAGE_SIZE);
  const jobListRef = useRef<HTMLDivElement>(null);

  const locationOptions = Array.from(
    new Set(
      jobs.map((job) => getJobLocationLabel(job.basic_info)).filter(Boolean),
    ),
  )
    .sort()
    .map((value) => ({ label: value, value }));

  const filteredJobs = jobs
    .filter((job) => {
      const jobWorkplace = getJobRoleTypeLabel(job.basic_info);
      const jobLocation = getJobLocationLabel(job.basic_info);
      const searchNeedle = search.trim().toLowerCase();

      if (searchNeedle) {
        const haystack = [job.name, jobWorkplace, jobLocation]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(searchNeedle)) return false;
      }

      if (workplace && jobWorkplace !== workplace) return false;
      if (location && jobLocation !== location) return false;
      return true;
    })
    .sort((a, b) => {
      const aTime = a.posted_at ? new Date(a.posted_at).getTime() : 0;
      const bTime = b.posted_at ? new Date(b.posted_at).getTime() : 0;
      return bTime - aTime;
    });

  const visibleJobs = filteredJobs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredJobs.length;

  useEffect(() => {
    setVisibleCount(CAREER_PAGE_SIZE);
  }, [search, workplace, location]);

  useEffect(() => {
    const jobList = jobListRef.current;
    if (
      !jobList ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          jobList.classList.add("jobsRevealReady");
          requestAnimationFrame(() => {
            requestAnimationFrame(() => jobList.classList.add("isVisible"));
          });
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(jobList);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="jobs" aria-label="Job openings">
      <div className="jobsInner">
        <h2 className="jobsTitle">Job Openings</h2>

        <div className={styles.jobsControls}>
          <Input
            allowClear
            size="large"
            className={styles.searchInput}
            placeholder="Search jobs..."
            value={search}
            prefix={<Icon icon={<Search />} className={styles.searchIcon} />}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            allowClear
            size="large"
            className={styles.filterSelect}
            placeholder="Workplace type"
            value={workplace}
            options={WORKPLACE_OPTIONS.map((value) => ({
              label: value,
              value,
            }))}
            onChange={setWorkplace}
          />
          <Select
            allowClear
            showSearch
            size="large"
            className={styles.filterSelect}
            placeholder="Location"
            value={location}
            options={locationOptions}
            optionFilterProp="label"
            onChange={setLocation}
          />
        </div>

        <hr className="jobsDivider" />

        <div className="jobList" id="job-list" ref={jobListRef}>
          {visibleJobs.map((job) => {
            const jobWorkplace = getJobRoleTypeLabel(job.basic_info);
            const jobLocation = getJobLocationLabel(job.basic_info);

            return (
              <article
                key={job.id}
                className="jobCard"
                onClick={() => {
                  window.open(
                    getJobChatbotUrl(domain, job.candidate_uuid, job.version),
                    "_blank",
                    "noopener",
                  );
                }}
              >
                <div className="jobCardMain">
                  <h3 className="jobCardTitle">{job.name}</h3>
                  <p className="jobCardTime">
                    {formatPostedTime(job.posted_at)}
                  </p>
                </div>
                <div className="jobCardMeta">
                  <span className="jobWorkplace">{jobWorkplace}</span>
                  <span className="jobLocation">{jobLocation}</span>
                </div>
              </article>
            );
          })}

          {filteredJobs.length === 0 ? (
            <div className="jobListEmpty">
              No job openings match the current search and filter state.
            </div>
          ) : null}
        </div>

        {hasMore ? (
          <button
            className="showMore"
            type="button"
            onClick={() => setVisibleCount((count) => count + CAREER_PAGE_SIZE)}
          >
            <span>Show more</span>
            <Icon icon={<Down />} className={styles.showMoreArrow} />
          </button>
        ) : null}
      </div>
    </section>
  );
};

export default JobsSection;
