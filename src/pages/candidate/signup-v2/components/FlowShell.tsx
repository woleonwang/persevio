import { Button } from "antd";
import type { ButtonProps } from "antd";
import { useNavigate } from "react-router";

import logo from "@/assets/logo.png";

import JobHeader from "./JobHeader";
import ProgressDots from "./ProgressDots";
import styles from "../style.module.less";

type TSignupButtonProps = Pick<
  ButtonProps,
  | "children"
  | "onClick"
  | "disabled"
  | "loading"
  | "style"
  | "className"
  | "htmlType"
>;

export const SignupPrimaryButton: React.FC<TSignupButtonProps> = (props) => (
  <Button
    type="primary"
    size="large"
    block
    className={styles.primaryButton}
    {...props}
  />
);

export const FlowShellFooterButton = SignupPrimaryButton;

type TFlowShellProps = {
  currentStep: number;
  jobTitle?: string;
  companyName?: string;
  companyLogo?: string;
  showProgress?: boolean;
  showJobHeader?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
};

const FlowShell: React.FC<TFlowShellProps> = ({
  currentStep,
  jobTitle,
  companyName,
  companyLogo,
  showProgress = true,
  showJobHeader = true,
  children,
  footer,
  wide,
}) => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <header className={styles.stickyHeader}>
        <img
          src={logo}
          alt="Persevio"
          className={styles.logo}
          onClick={() => navigate("/")}
        />
        {showProgress && (
          <div className={styles.headerCenter}>
            <ProgressDots current={currentStep} />
            <span className={styles.stepLabel}>
              {currentStep}/6
            </span>
          </div>
        )}
      </header>

      {showJobHeader && jobTitle && companyName && (
        <div className={styles.mobileVisible} style={{ padding: "12px 16px 0" }}>
          <JobHeader
            jobTitle={jobTitle}
            companyName={companyName}
            companyLogo={companyLogo}
          />
        </div>
      )}

      <main className={styles.main}>
        <div
          className={`${styles.contentColumn} ${wide ? styles.contentColumnWide : ""}`}
        >
          {showJobHeader && jobTitle && companyName && (
            <div className={styles.desktopVisible}>
              <JobHeader
                jobTitle={jobTitle}
                companyName={companyName}
                companyLogo={companyLogo}
              />
            </div>
          )}
          {children}
          {footer && <div className={styles.footerBar}>{footer}</div>}
        </div>
      </main>
    </div>
  );
};

export default FlowShell;
