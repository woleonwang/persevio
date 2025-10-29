import { Empty, Spin } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import classnames from "classnames";
import { useTranslation } from "react-i18next";

import { Get } from "@/utils/request";
import styles from "./style.module.less";

const CompanyStatus = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"approving" | "rejected">();
  const { t: originalT } = useTranslation();

  const t = (key: string) => {
    return originalT(`company.status.${key}`);
  };

  useEffect(() => {
    (async () => {
      const { code, data } = await Get("/api/settings");
      if (code === 0) {
        if (data.company_status === "approved") {
          navigate("/app/entry/create-job");
        } else {
          setStatus(data.company_status);
        }
      }
    })();
  }, []);

  if (!status) {
    return <Spin />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.empty}>
        <Empty
          description={
            <div>
              <div className={classnames(styles[status], styles.title)}>
                {status === "approving"
                  ? t("approving_title")
                  : t("rejected_title")}
              </div>
              <div>
                {status === "approving"
                  ? t("approving_message")
                  : t("rejected_message")}
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default CompanyStatus;
