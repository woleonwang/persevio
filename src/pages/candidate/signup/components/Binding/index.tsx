import { useState } from "react";
import { Checkbox, message, Modal } from "antd";
import classnames from "classnames";
import privacyAgreement from "@/utils/privacyAgreement";
import terms from "@/utils/terms";
import Google from "@/assets/google.png";
import Linkedin from "@/assets/linkedin.png";
import logo from "@/assets/logo.png";
import styles from "./style.module.less";
import MarkdownContainer from "@/components/MarkdownContainer";
import { tokenStorage } from "@/utils/storage";

const Binding = () => {
  const [termsType, setTermsType] = useState<"terms" | "privacy">();
  const [isTermsAgreed, setIsTermsAgreed] = useState(false);

  const goToLogin = (type: "google" | "linkedin") => {
    if (!isTermsAgreed) {
      message.warning("Please read and agree to the agreement");
      return;
    }

    window.location.href = `/api/auth/${type}/login?role=candidate&candidate_token=${
      tokenStorage.getToken("candidate") || ""
    }&referrer=${window.location.origin + window.location.pathname}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.body}>
        <div className={styles.buttonWrapper}>
          <div
            className={classnames(styles.logoWrapper, styles.desktopVisible)}
          >
            <img src={logo} />
          </div>
          <div className={styles.listTitle}>
            In the meantime, log onto the Persevio platform to manage your
            entire application process in one place.
          </div>
          <div className={styles.listItem}>
            Track your application status 24/7.
          </div>
          <div className={styles.listItem}>
            Receive instant updates on interview schedules.
          </div>
          <div className={styles.listItem}>
            Get hyper-personalized job recommendations just like this one.
          </div>

          <div className={styles.buttonGroup}>
            <div
              onClick={() => {
                goToLogin("google");
              }}
              className={classnames(styles.button, styles.google)}
            >
              <img src={Google} className={styles.brand} />
              Sign up with Google
            </div>

            <div
              onClick={() => {
                goToLogin("linkedin");
              }}
              className={classnames(styles.button, styles.linkedin)}
            >
              <img src={Linkedin} className={styles.brand} />
              Sign up with LinkedIn
            </div>
          </div>
        </div>
        <div className={styles.termsWrapper}>
          <Checkbox
            checked={isTermsAgreed}
            onChange={(e) => setIsTermsAgreed(e.target.checked)}
          >
            By signing in, you are agreeing to the{" "}
            <span
              className={styles.termsLink}
              onClick={(e) => {
                e.preventDefault();
                setTermsType("terms");
              }}
            >
              Terms of Service
            </span>{" "}
            and{" "}
            <span
              className={styles.termsLink}
              onClick={(e) => {
                e.preventDefault();
                setTermsType("privacy");
              }}
            >
              Privacy Policy
            </span>
          </Checkbox>
        </div>
      </div>
      <Modal
        open={!!termsType}
        onCancel={() => setTermsType(undefined)}
        onOk={() => setTermsType(undefined)}
        title={termsType === "terms" ? "Terms of Service" : "Privacy Policy"}
        centered
        width={"80%"}
        style={{ maxWidth: 1000, maxHeight: "90vh" }}
        cancelButtonProps={{
          style: {
            display: "none",
          },
        }}
      >
        <div style={{ maxHeight: "70vh", overflow: "auto" }}>
          <MarkdownContainer
            content={(termsType === "terms"
              ? terms
              : privacyAgreement
            ).replaceAll("\n", "\n\n")}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Binding;
