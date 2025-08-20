import { Empty, Spin } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import classnames from "classnames";

import { Get } from "@/utils/request";
import styles from "./style.module.less";

const CompanyStatus = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"approving" | "rejected">();

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
                {status === "approving" ? "审核中" : "审核未通过"}
              </div>
              <div>
                {status === "approving"
                  ? "您的注册申请还在审核中,请耐心等待。"
                  : "很抱歉，您的账号未能通过审核；您可以联系 admin@persevio.ai 获取帮助。"}
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default CompanyStatus;
