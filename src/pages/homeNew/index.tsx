import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import classnames from "classnames";
import { useTranslation } from "react-i18next";
import { Button, Dropdown } from "antd";
import { RightOutlined } from "@ant-design/icons";

import { Get } from "@/utils/request";
import PublicJobCard from "@/components/PublicJobCard";
import { parseJSON } from "@/utils";
import Icon from "@/components/Icon";
import ArrowRight from "@/assets/icons/arrow-right";

import logo from "@/assets/logo.png";
import bannerVideo from "@/assets/banner-1.mp4";
import bannerTalk1 from "@/assets/banner-talk-1.png";
import bannerTalk3 from "@/assets/banner-talk-3.png";
import bannerTalk4 from "@/assets/banner-talk-4.png";
import howItWorks1 from "@/assets/how-it-works-1.png";
import howItWorks2 from "@/assets/how-it-works-2.png";
import howItWorks3 from "@/assets/how-it-works-3.png";
import howItWorksVideo1 from "@/assets/videos/how-it-works-1.mp4";
import howItWorksVideo2 from "@/assets/videos/how-it-works-2.mp4";
import howItWorksVideo3 from "@/assets/videos/how-it-works-3.mp4";
import different1 from "@/assets/different-1.png";
import different2 from "@/assets/different-2.png";
import different3 from "@/assets/different-3.png";
import different1detail from "@/assets/different-1-detail.png";
import different2detail from "@/assets/different-2-detail.png";
import different3detail from "@/assets/different-3-detail.png";

import styles from "./style.module.less";

// const menusConfigs = {
//   candidates: "/",
//   employers: "/employers",
// };

const Speeches = [
  [
    {
      text: "“Most platforms just match keywords. Viona understood the context of my experience and my soft skills. She helped me articulate my value in a way that got me straight to the interview stage with the hiring manager.”",
      author: "Marvin",
      position: "Technical Team Lead",
      width: 900,
    },
    {
      text: "“The most efficient hiring process of my life. From the first chat with Viona to the final offer took less than 10 days.”",
      author: "Mingjie",
      position: "Software Engineer",
      width: 600,
    },
    {
      text: "“I was skeptical about AI, but Viona asked deeper questions than most human recruiters. She understood my career pivot instantly and matched me with a role that I truly wanted.”",
      author: "Sean",
      position: "Head of Sales",
      width: 920,
    },
    {
      text: "“Viona’s recommendation was shockingly accurate and personalized.”",
      author: "Jin",
      position: "Trader",
      width: 464,
    },
  ],
  [
    {
      text: "“One conversation with Viona and she immediately sent me jobs I was actually interested in. So much better than endless scrolling on job boards.”",
      author: "Kashif",
      position: "HR manager",
      width: 700,
    },
    {
      text: "“Viona didn’t just passively listen; she challenged me to dig deeper. She actually helped me uncover core strengths I hadn't realized were my biggest assets.”",
      author: "Lai",
      position: "Product Manager",
      width: 900,
    },
    {
      text: "“Viona acted as my advocate from the very start, focusing entirely on how to champion my profile and highlight my best self to employers.”",
      author: "Yang",
      position: "Community Manager",
      width: 600,
    },
    {
      text: "“I loved that I could chat with Viona late at night, just lying on my couch. It didn't feel like a high-pressure interview, just a relaxed conversation, and she handled all the prep work for my application automatically.”",
      author: "Lim",
      position: "Data Engineer",
      width: 900,
    },
  ],
];

interface JobPosting extends TJobBasicInfo {
  id: number;
  name: string;
  company_name: string;
  company_logo: string;
  posted_at: string;
  version: number;
}
const HomeNew = () => {
  const [hoverStep, setHoverStep] = useState<number>(0);
  const [jobs, setJobs] = useState<JobPosting[]>([]);

  useEffect(() => {
    getJobs();
  }, []);

  const getJobs = async () => {
    const { code, data } = await Get("/api/public/jobs");
    if (code !== 0) {
      return;
    }

    const jobs: JobPosting[] = data.jobs;

    const { code: code2, data: data2 } = await Get(
      "/api/public/system_config/recommended_job_ids"
    );
    if (code2 !== 0 || !data2.value) {
      return;
    }

    const indexJobIds = JSON.parse(data2.value);
    setJobs(
      jobs
        .filter((job) => indexJobIds.includes(job.id))
        .map((job: any) => {
          return {
            ...job,
            ...parseJSON(job.basic_info),
          };
        })
    );
  };

  // const isActive = (key: "candidates" | "employers"): boolean => {
  //   const path = window.location.pathname;
  //   return menusConfigs[key] === path;
  // };

  const { t } = useTranslation();
  const originalT = (key: string) => t(`home_header.${key}`);

  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        <video
          src={bannerVideo}
          autoPlay
          loop
          className={styles.bannerVideo}
          muted
        />
        <div className={styles.header}>
          <img src={logo} className={styles.logo} />
          <div className={styles.bannderMenuGroup}>
            {/* <div
              className={classnames({
                [styles.active]: isActive("candidates"),
              })}
              onClick={() => navigate(menusConfigs["candidates"])}
            >
              {originalT("candidates")}
            </div>
            <div
              className={classnames({ [styles.active]: isActive("employers") })}
              onClick={() => navigate(menusConfigs["employers"])}
            >
              {originalT("employers")}
            </div> */}
          </div>
          <Dropdown
            menu={{
              items: [
                {
                  key: "candidate",
                  label: originalT("jobseeker"),
                  onClick: () => navigate("/signup-candidate"),
                },
                {
                  key: "recruiter",
                  label: originalT("recruit"),
                  onClick: () => navigate("/signup"),
                },
              ],
            }}
            placement="bottomRight"
            trigger={["hover"]}
          >
            <Button type="primary" className={styles.joinBtn}>
              <span>{originalT("login_register")}</span>
            </Button>
          </Dropdown>
        </div>
        <div className={styles.heroSectionContent}>
          <div className={styles.heroContent}>
            <div className={styles.heroTitle}>
              Curious what better jobs are out there?{" "}
              <span className={styles.heroTitleHighlight}>Talk to Viona.</span>
            </div>
            <div className={styles.heroSubtitle}>
              Have a conversation with Viona about your career goals. She'll
              deliver hand-picked opportunities that match who you truly are.
            </div>
            <div>
              <Button
                type="primary"
                size="large"
                className={styles.ctaButton}
                onClick={() => navigate("/signup-candidate")}
              >
                Chat with Viona now
              </Button>

              <Button
                type="default"
                size="large"
                className={classnames(styles.ctaButton, styles.staff)}
                onClick={() => navigate("/signup")}
              >
                Hiring? Talk to Viona too
              </Button>
            </div>
          </div>

          <img
            src={bannerTalk1}
            className={classnames(styles.bannerTalk, styles.bannerTalk1)}
          />
          <img
            src={bannerTalk3}
            className={classnames(styles.bannerTalk, styles.bannerTalk3)}
          />
          <img
            src={bannerTalk4}
            className={classnames(styles.bannerTalk, styles.bannerTalk4)}
          />
        </div>
      </div>

      {/* Testimonials Section */}
      <div className={styles.testimonialsSection}>
        <div className={styles.testimonialWrapper}>
          <div className={styles.title}>
            Join thousands of candidates that discovered their ideal role with
            the help from Viona.
          </div>
        </div>
        <div>
          {Speeches.map((speechItems, index) => (
            <div
              key={index}
              className={classnames(styles.testimonialRow, {
                [styles.testimonialRowReverse]: index % 2 === 1,
              })}
            >
              <div className={styles.testimonialRowInner}>
                {[...speechItems, ...speechItems].map((item, innerIndex) => (
                  <div
                    key={innerIndex}
                    className={styles.testimonialCard}
                    style={{ width: item.width }}
                  >
                    <div className={styles.testimonialQuote}>{item.text}</div>
                    <div>
                      <div className={styles.testimonialAuthor}>
                        {item.author}
                      </div>
                      <div className={styles.testimonialPosition}>
                        {item.position}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className={styles.howItWorksSection}>
        <div className={styles.sectionTitle}>
          Here's How I Help You Discover Your Perfect Role.
        </div>
        <div className={styles.sectionHint}>
          I do things differently. I have deep conversations - with both you and
          employers - to create matches that actually make sense.
        </div>
        <div className={styles.stepsContainer}>
          <div className={styles.step}>
            <div className={styles.stepContent}>
              <img src={howItWorks1} className={styles.stepIcon} />
              <div className={styles.stepTitle}>First, we talk</div>
              <div className={styles.stepDescription}>
                I'll spend 15 minutes getting to know your real story - your
                wins, what drives you, where you want to grow. Not just what's
                on your resume.
              </div>
            </div>
            <video
              src={howItWorksVideo1}
              autoPlay
              loop
              muted
              className={styles.stepVisual}
            />
          </div>

          <div className={styles.step}>
            <video
              src={howItWorksVideo2}
              autoPlay
              loop
              muted
              className={styles.stepVisual}
            />
            <div className={styles.stepContent}>
              <img src={howItWorks2} className={styles.stepIcon} />
              <div className={styles.stepTitle}>I also know the real job</div>
              <div className={styles.stepDescription}>
                Every employer has to explain their role to me in detail before
                I'll help them. I know what they actually need, not just what
                the JD says.
              </div>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepContent}>
              <img src={howItWorks3} className={styles.stepIcon} />
              <div className={styles.stepTitle}>Then, magic happens</div>
              <div className={styles.stepDescription}>
                I match based on true fit - your goals with their needs, your
                personality with their culture, your potential with their
                growth.
              </div>
            </div>
            <video
              src={howItWorksVideo3}
              autoPlay
              loop
              muted
              className={styles.stepVisual}
            />
          </div>
        </div>
      </div>

      {/* Reinvent Job Search Section */}
      <div className={styles.reinventSection}>
        <div className={styles.reinventSectionContent}>
          <div className={styles.sectionTitle}>
            Reinvent Job Search with Viona
          </div>
          <div className={styles.sectionDescription}>
            I do things differently. I have deep conversations - with both you
            and employers - to create matches that actually make sense.
          </div>
          <div className={styles.reinventContent}>
            <div className={styles.reinventCards}>
              <div
                className={classnames(styles.reinventCard, {
                  [styles.hover]: hoverStep === 0,
                })}
                onMouseEnter={() => setHoverStep(0)}
              >
                <img src={different1} className={styles.reinventIcon} />
                <div className={styles.reinventCardTitle}>
                  Your Personalized Shortlist
                </div>
                <div className={styles.reinventCardDescription}>
                  No one wants to sift through hundreds of irrelevant job pos I
                  only show you roles that match your specific goals and
                  experience.
                </div>
              </div>
              <div
                className={classnames(styles.reinventCard, {
                  [styles.hover]: hoverStep === 1,
                })}
                onMouseEnter={() => setHoverStep(1)}
              >
                <img src={different2} className={styles.reinventIcon} />
                <div className={styles.reinventCardTitle}>
                  Skip the Redundant Screens
                </div>
                <div className={styles.reinventCardDescription}>
                  Since I've already had an in-depth conversation with you,
                  employers trust my assessment. Jump straight to meaningful
                  interviews.
                </div>
              </div>
              <div
                className={classnames(styles.reinventCard, {
                  [styles.hover]: hoverStep === 2,
                })}
                onMouseEnter={() => setHoverStep(2)}
              >
                <img src={different3} className={styles.reinventIcon} />
                <div className={styles.reinventCardTitle}>
                  Complete Privacy Until You're Ready
                </div>
                <div className={styles.reinventCardDescription}>
                  Your profile stays 100% confidential. No recruiter spam. You
                  control when and how employers can contact you.
                </div>
              </div>
            </div>
            <img
              src={
                [different1detail, different2detail, different3detail][
                  hoverStep
                ]
              }
              className={styles.reinventDetail}
            />
          </div>
        </div>
      </div>

      {/* Recommended Jobs Section */}
      <div className={styles.jobsSection}>
        <div className={styles.sectionTitle}>Recommended Jobs</div>
        <div className={styles.jobsList}>
          {jobs.map((job) => (
            <PublicJobCard job={job} key={job.id} />
          ))}
        </div>
        <Button
          size="large"
          block
          className={styles.moreJobsButton}
          onClick={() => navigate("/jobs")}
        >
          More <RightOutlined />
        </Button>
      </div>

      {/* Bottom CTA Section */}
      <div className={styles.bottomCtaSection}>
        <div className={styles.bottomCtaSectionBg}>
          <div className={styles.bottomCtaSectionContent}>
            <div className={styles.ctaTitle}>
              Ready to meet your AI Career Agent?
            </div>
            <div style={{ textAlign: "center" }}>
              <Button
                onClick={() => navigate("/signup-candidate")}
                size="large"
                className={styles.ctaButton}
              >
                Speak with Viona now
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <img src={logo} className={styles.footerLogo} alt="Persevio" />
          <div className={styles.footerLinks}>
            <div className={styles.footerColumn}>
              <h4 className={styles.footerTitle}>Products</h4>
              <a href="#" className={styles.footerLink}>
                Persevio
              </a>
            </div>
            <div className={styles.footerColumn}>
              <h4 className={styles.footerTitle}>Company</h4>
              <a href="#" className={styles.footerLink}>
                About us
              </a>
              <a href="/privacy-policy" className={styles.footerLink}>
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
        <div className={styles.footerCopyright}>
          © {new Date().getFullYear()} Persevio. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default HomeNew;
