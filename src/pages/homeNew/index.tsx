import styles from "./style.module.less";
import logo from "@/assets/logo.png";
import bannerVideo from "@/assets/banner-video.mp4";
import { useNavigate } from "react-router";
import classnames from "classnames";
import { useTranslation } from "react-i18next";
import { Button } from "antd";
import bannerTalk1 from "@/assets/banner-talk-1.png";
import bannerTalk2 from "@/assets/banner-talk-2.png";
import bannerTalk3 from "@/assets/banner-talk-3.png";
import bannerTalk4 from "@/assets/banner-talk-4.png";

const menusConfigs = {
  candidates: "/",
  employers: "/employers",
};

const Speeches = [
  [
    {
      text: "“Serra closed 20 interviews in the first week. We were going to hire an additional recruiter but didn't end up having to. Now all we have to do is interview candidates.“",
      author: "Nick Patrick",
      position: "CEO & Co-Founder at Radar",
      width: 816,
    },
    {
      text: "“Serra closed 20 interviews in the first week.”",
      author: "Nick Patrick",
      position: "CEO & Co-Founder at Radar",
      width: 464,
    },
  ],
  [
    {
      text: "“Serra closed 20 interviews in the first week.”",
      author: "Nick Patrick",
      position: "CEO & Co-Founder at Radar",
      width: 464,
    },
    {
      text: "“I've seen candidates get more than 10 offers in a single day, and they were all from Viona. I've also seen candidates get offers from companies they never even applied to. It's truly magic.“",
      author: "Nick Patrick",
      position: "CEO & Co-Founder at Radar",
      width: 816,
    },
  ],
];
const HomeNew = () => {
  const isActive = (key: "candidates" | "employers"): boolean => {
    const path = window.location.pathname;
    return menusConfigs[key] === path;
  };

  const { t } = useTranslation();
  const originalT = (key: string) => t(`home_header.${key}`);

  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        <div className={styles.header}>
          <img src={logo} className={styles.logo} />
          <div className={styles.bannderMenuGroup}>
            <div
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
            </div>
          </div>
          <Button
            type="primary"
            className={styles.joinBtn}
            onClick={() => navigate("/signin")}
          >
            <span>{originalT("login_register")}</span>
            <span>→</span>
          </Button>
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
            <Button
              type="primary"
              size="large"
              className={styles.ctaButton}
              onClick={() => navigate("/signin")}
            >
              Chat with Viona now
            </Button>
          </div>
          <div className={styles.heroIllustration}>
            {/* Placeholder for 3D character illustration */}
            <video
              src={bannerVideo}
              autoPlay
              loop
              className={styles.bannerVideo}
              muted
            />
          </div>
          <img
            src={bannerTalk1}
            className={classnames(styles.bannerTalk, styles.bannerTalk1)}
          />
          <img
            src={bannerTalk2}
            className={classnames(styles.bannerTalk, styles.bannerTalk2)}
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
        <div className={styles.testimonialHighlight}>
          <p className={styles.highlightText}>
            Join thousands of candidates that discovered their ideal role with
            the help from Viona
          </p>
        </div>
      </div>

      {/* How It Works Section */}
      <div className={styles.howItWorksSection}>
        <h2 className={styles.sectionTitle}>
          Here's How I Help You Discover Your Perfect Role.
        </h2>
        <div className={styles.stepsContainer}>
          <div className={styles.step}>
            <div className={styles.stepIconWrapper}>
              <div className={styles.stepIcon}>💬</div>
            </div>
            <h3 className={styles.stepTitle}>First, we talk</h3>
            <p className={styles.stepDescription}>
              I'll spend 15 minutes getting to know your real story - your wins,
              what drives you, where you want to grow. Not just what's on your
              resume.
            </p>
            <div className={styles.stepVisual}>
              {/* Placeholder for laptop screen with chat interface */}
              <div className={styles.placeholderImage}>Chat Interface</div>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepIconWrapper}>
              <div className={styles.stepIcon}>💼</div>
            </div>
            <h3 className={styles.stepTitle}>I also know the real job</h3>
            <p className={styles.stepDescription}>
              Every employer has to explain their role to me in detail before
              I'll help them. I know what they actually need, not just what the
              JD says.
            </p>
            <div className={styles.stepVisual}>
              {/* Placeholder for laptop screen with job form */}
              <div className={styles.placeholderImage}>Job Form</div>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepIconWrapper}>
              <div className={styles.stepIcon}>✨</div>
            </div>
            <h3 className={styles.stepTitle}>Then, magic happens</h3>
            <p className={styles.stepDescription}>
              I match based on true fit - your goals with their needs, your
              personality with their culture, your potential with their growth.
            </p>
            <div className={styles.stepVisual}>
              {/* Placeholder for laptop screen with match success */}
              <div className={styles.placeholderImage}>Match Success</div>
            </div>
          </div>
        </div>
      </div>

      {/* Reinvent Job Search Section */}
      <div className={styles.reinventSection}>
        <h2 className={styles.sectionTitle}>Reinvent Job Search with Viona.</h2>
        <div className={styles.reinventContent}>
          <div className={styles.reinventCards}>
            <div className={styles.reinventCard}>
              <div className={styles.reinventIcon}>🌐</div>
              <h3 className={styles.reinventCardTitle}>
                Your Personalized Shortlist
              </h3>
            </div>
            <div className={styles.reinventCard}>
              <div className={styles.reinventIcon}>⏩</div>
              <h3 className={styles.reinventCardTitle}>
                Skip the Redundant Screens
              </h3>
            </div>
            <div className={styles.reinventCard}>
              <div className={styles.reinventIcon}>🔒</div>
              <h3 className={styles.reinventCardTitle}>
                Complete Privacy Until You're Ready
              </h3>
            </div>
          </div>
          <div className={styles.reinventForm}>
            {/* Placeholder for job requirement form */}
            <div className={styles.placeholderImage}>Job Requirement Form</div>
          </div>
        </div>
      </div>

      {/* Recommended Jobs Section */}
      <div className={styles.jobsSection}>
        <h2 className={styles.sectionTitle}>Recommended Jobs.</h2>
        <div className={styles.jobsList}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.jobCard}>
              <div className={styles.jobLogo}>
                {/* Placeholder for company logo */}
                <div className={styles.placeholderLogo}>Logo</div>
              </div>
              <div className={styles.jobInfo}>
                <h3 className={styles.jobTitle}>Product Lead</h3>
                <div className={styles.jobMeta}>
                  <span className={styles.jobType}>Hybrid</span>
                  <span className={styles.jobTime}>1 day ago</span>
                </div>
                <div className={styles.jobTags}>
                  <span className={styles.jobTag}>Singapore</span>
                  <span className={styles.jobTag}>Remote</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button className={styles.moreJobsButton}>More Jobs</button>
      </div>

      {/* Bottom CTA Section */}
      <div className={styles.bottomCtaSection}>
        <h2 className={styles.ctaTitle}>Ready to meet your AI Career Agent?</h2>
        <button
          className={styles.ctaButton}
          onClick={() => navigate("/signin")}
        >
          Apply Now
        </button>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <img src={logo} className={styles.footerLogo} alt="Persevio" />
          <div className={styles.footerLinks}>
            <div className={styles.footerColumn}>
              <h4 className={styles.footerTitle}>Products</h4>
              <a href="#" className={styles.footerLink}>
                Privacy Policy
              </a>
            </div>
            <div className={styles.footerColumn}>
              <h4 className={styles.footerTitle}>Company</h4>
              <a href="#" className={styles.footerLink}>
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
