import React, { useState } from "react";
import {
  RightOutlined,
  MessageOutlined,
  SafetyOutlined,
  StarOutlined,
} from "@ant-design/icons";
import Logo from "@/assets/logo.png";
import { Button } from "antd";
import { getQuery } from "@/utils";
import { useNavigate } from "react-router";
import { Get } from "@/utils/request";

const LinkedinApply: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const handleNavigateToJob = async () => {
    const jobId = getQuery("id");
    if (!jobId) {
      return;
    }
    const { code } = await Get(`/api/public/jobs/${jobId}`);
    if (code === 0) {
      navigate(`/jobs/${jobId}`);
    } else {
      navigate(`/jobs/${jobId}`);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
        color: "#0f172a",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Compact Navigation */}
      <nav
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: "768px",
            margin: "0 auto",
            padding: "0 24px",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <img
            src={Logo}
            alt="Logo"
            style={{ height: "40px", width: "auto" }}
          />
        </div>
      </nav>

      {/* Main Content - Centered Single Column */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "40px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "768px",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "32px",
          }}
        >
          {/* SECTION: Intro (Left Aligned, Larger) */}
          <section style={{ textAlign: "left", marginBottom: "40px" }}>
            <h1
              style={{
                fontSize: "clamp(24px, 4vw, 30px)",
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: "16px",
                lineHeight: 1.25,
              }}
            >
              Thank you for your interest for this role, follow the instructions
              below to start the application process
            </h1>
            <p
              style={{
                color: "#475569",
                fontSize: "18px",
                lineHeight: 1.75,
                maxWidth: "768px",
              }}
            >
              You clicked{" "}
              <span style={{ fontWeight: 600, color: "#0f172a" }}>apply</span>{" "}
              on a job board—this role is managed by Persevio, an AI-powered
              recruitment platform, on behalf of the employer.
            </p>
          </section>

          {/* SECTION: Next steps */}
          <section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                backgroundColor: "#f1f5f9",
                padding: "16px 24px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Next steps
              </h2>
            </div>
            <div>
              {/* Step 1 */}
              <div
                style={{
                  padding: "24px",
                  display: "flex",
                  gap: "20px",
                  alignItems: "flex-start",
                  backgroundColor:
                    hoveredStep === 1
                      ? "rgba(239, 246, 255, 0.3)"
                      : "transparent",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={() => setHoveredStep(1)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: 700,
                    marginTop: "2px",
                  }}
                >
                  1
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    color: "#334155",
                    lineHeight: 1.75,
                    flex: 1,
                  }}
                >
                  Go to the{" "}
                  <button
                    onClick={handleNavigateToJob}
                    style={{
                      color: "#2563eb",
                      fontWeight: 600,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "2px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = "none";
                    }}
                  >
                    job page <RightOutlined style={{ fontSize: 16 }} />
                  </button>{" "}
                  to see the complete job details
                </div>
              </div>

              {/* Step 2 */}
              <div
                style={{
                  padding: "24px",
                  display: "flex",
                  gap: "20px",
                  alignItems: "flex-start",
                  backgroundColor:
                    hoveredStep === 2
                      ? "rgba(239, 246, 255, 0.3)"
                      : "transparent",
                  transition: "background-color 0.2s",
                  borderTop: "1px solid #f1f5f9",
                }}
                onMouseEnter={() => setHoveredStep(2)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: hoveredStep === 2 ? "#dbeafe" : "#f1f5f9",
                    color: hoveredStep === 2 ? "#2563eb" : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: 700,
                    marginTop: "2px",
                    transition: "background-color 0.2s, color 0.2s",
                  }}
                >
                  2
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    color: "#334155",
                    lineHeight: 1.75,
                  }}
                >
                  Ask Viona, our AI recruiter, anything about the role or
                  company
                </div>
              </div>

              {/* Step 3 */}
              <div
                style={{
                  padding: "24px",
                  display: "flex",
                  gap: "20px",
                  alignItems: "flex-start",
                  backgroundColor:
                    hoveredStep === 3
                      ? "rgba(239, 246, 255, 0.3)"
                      : "transparent",
                  transition: "background-color 0.2s",
                  borderTop: "1px solid #f1f5f9",
                }}
                onMouseEnter={() => setHoveredStep(3)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: hoveredStep === 3 ? "#dbeafe" : "#f1f5f9",
                    color: hoveredStep === 3 ? "#2563eb" : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: 700,
                    marginTop: "2px",
                    transition: "background-color 0.2s, color 0.2s",
                  }}
                >
                  3
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    color: "#334155",
                    lineHeight: 1.75,
                  }}
                >
                  Click "I am interested" to start your application
                </div>
              </div>

              {/* Step 4 */}
              <div
                style={{
                  padding: "24px",
                  display: "flex",
                  gap: "20px",
                  alignItems: "flex-start",
                  backgroundColor:
                    hoveredStep === 4
                      ? "rgba(239, 246, 255, 0.3)"
                      : "transparent",
                  transition: "background-color 0.2s",
                  borderTop: "1px solid #f1f5f9",
                }}
                onMouseEnter={() => setHoveredStep(4)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: hoveredStep === 4 ? "#dbeafe" : "#f1f5f9",
                    color: hoveredStep === 4 ? "#2563eb" : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: 700,
                    marginTop: "2px",
                    transition: "background-color 0.2s, color 0.2s",
                  }}
                >
                  4
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    color: "#334155",
                    lineHeight: 1.75,
                  }}
                >
                  Complete a Discovery Chat with Viona so she can prepare your
                  application
                </div>
              </div>
            </div>
            <div
              style={{
                padding: "24px",
                backgroundColor: "#f1f5f9",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <Button
                onClick={handleNavigateToJob}
                block
                style={{ fontSize: "16px", padding: "16px 0" }}
                icon={<RightOutlined style={{ fontSize: 18 }} />}
                type="primary"
                size="large"
              >
                Go to Job Page
              </Button>
            </div>
          </section>

          {/* SECTION: About Discovery Chat */}
          <section
            style={{
              background: "linear-gradient(to bottom right, #eff6ff, #ffffff)",
              borderRadius: "16px",
              padding: "clamp(24px, 4vw, 32px)",
              border: "1px solid #dbeafe",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <MessageOutlined style={{ fontSize: 24, color: "#2563eb" }} />
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                About the Discovery Chat
              </h2>
            </div>
            <p
              style={{
                fontSize: "clamp(16px, 2vw, 18px)",
                color: "#334155",
                marginBottom: "24px",
                lineHeight: 1.75,
              }}
            >
              After submitting your resume, Viona will invite you to a discovery
              chat. This isn't a formal interview—it's a conversation to
              understand who you are beyond your resume.
            </p>

            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.6)",
                borderRadius: "12px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#0f172a",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "8px",
                }}
              >
                What you get out of the Discovery Chat:
              </h3>
              <ul
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <li
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    fontSize: "16px",
                    color: "#475569",
                  }}
                >
                  <span style={{ color: "#3b82f6", marginTop: "6px" }}>•</span>
                  <span>
                    Viona uses what she learns to represent you in the strongest
                    possible light, giving you the best chance of landing an
                    interview
                  </span>
                </li>
                <li
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    fontSize: "16px",
                    color: "#475569",
                  }}
                >
                  <span style={{ color: "#3b82f6", marginTop: "6px" }}>•</span>
                  <span>
                    Beyond this role, you'll receive personalized job
                    recommendations matched to your background in the future.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* SECTION: About Persevio */}
          <section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "clamp(24px, 4vw, 32px)",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <StarOutlined style={{ fontSize: 24, color: "#0f172a" }} />
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                About Persevio
              </h2>
            </div>
            <p
              style={{
                fontSize: "clamp(16px, 2vw, 18px)",
                color: "#475569",
                lineHeight: 1.75,
              }}
            >
              On most job boards, your application disappears into a pile and
              you never hear back. Persevio works differently. Viona reviews
              your application immediately and prepares a personalized case for
              you—which means you get in front of the employer in hours, not
              weeks.
            </p>
          </section>

          {/* SECTION: This is a real opportunity */}
          <section
            style={{
              backgroundColor: "#0f172a",
              borderRadius: "16px",
              padding: "clamp(24px, 4vw, 32px)",
              color: "#ffffff",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <SafetyOutlined style={{ fontSize: 24, color: "#60a5fa" }} />
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#ffffff",
                }}
              >
                This is a real opportunity
              </h2>
            </div>
            <p
              style={{
                fontSize: "clamp(16px, 2vw, 18px)",
                color: "#cbd5e1",
                lineHeight: 1.75,
                opacity: 0.9,
              }}
            >
              Before any role goes live on Persevio, employers have to have a
              deep conversation with Viona to help her understand what they're
              looking for — not just what's written in a job description. This
              process ensures every role on our platform is serious and actively
              hiring.
            </p>
          </section>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer
        style={{
          padding: "32px 0",
          textAlign: "center",
          fontSize: "14px",
          color: "#94a3b8",
        }}
      >
        &copy; {new Date().getFullYear()} Persevio
      </footer>
    </div>
  );
};

export default LinkedinApply;
