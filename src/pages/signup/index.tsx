import React, { useEffect, useState } from "react";
import { Spin } from "antd";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Get } from "@/utils/request";
import { parseJSON } from "@/utils";
import Step from "@/components/Step";
import SignContainer from "@/components/SignContainer";

import OAuth from "./components/OAuth";
import Register from "./components/Register";
import BasicInfo from "./components/BasicInfo";
import CompanyInfo from "./components/CompanyInfo";
import RecruitmentRequirement from "./components/RecruitmentRequirement";
import Waiting from "./components/Waiting";

import logo from "@/assets/logo.png";
import styles from "./style.module.less";

type TStatus =
  | "oauth"
  | "register"
  | "basicInfo"
  | "companyInfo"
  | "recruitmentRequirement"
  | "waiting";

const Signup: React.FC = () => {
  const [status, setStatus] = useState<TStatus>();
  const [staff, setStaff] = useState<ISettings>();

  const { t: originalT } = useTranslation();
  const t = (key: string) => {
    return originalT(`signup.${key}`);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const { code, data } = await Get("/api/settings");
    if (code === 0) {
      const parsedSettings: ISettings = {
        ...data,
        company_recruitment_requirements: parseJSON(
          data.company_recruitment_requirements_json
        ),
      };
      setStaff(parsedSettings);
      if (!status) {
        if (data.company_status === "approved") {
          navigate("/app/entry/create-job");
        } else if (
          !!parsedSettings.company_recruitment_requirements?.role_type
        ) {
          setStatus("waiting");
        } else if (!!parsedSettings.company_name) {
          setStatus("recruitmentRequirement");
        } else if (!!parsedSettings.staff_name) {
          setStatus("companyInfo");
        } else {
          setStatus("basicInfo");
        }
      }
    } else {
      setStatus("oauth");
    }
  };

  const navigate = useNavigate();

  if (!status) {
    return <Spin />;
  }

  return status === "oauth" || status === "register" ? (
    <SignContainer
      title={
        status === "oauth" ? "Sign up for an account" : "Sign up with email"
      }
    >
      {status === "oauth" ? (
        <OAuth onWithEmail={() => setStatus("register")} />
      ) : (
        <Register onNext={() => setStatus("basicInfo")} />
      )}
    </SignContainer>
  ) : (
    <div className={styles.container}>
      <div className={styles.header}>
        <img src={logo} alt="logo" />
      </div>

      {status === "basicInfo" ||
      status === "companyInfo" ||
      status === "recruitmentRequirement" ? (
        <div className={styles.content}>
          <Step
            stepCount={3}
            currentIndex={
              status === "basicInfo" ? 0 : status === "companyInfo" ? 1 : 2
            }
          />
          <div className={styles.title}>
            {status === "basicInfo"
              ? t("basic_info_title")
              : status === "companyInfo"
              ? t("company_info_title")
              : t("recruitment_requirement_title")}
          </div>
          <div className={styles.form}>
            {status === "basicInfo" ? (
              <BasicInfo
                onNext={() => {
                  fetchStaff();
                  setStatus("companyInfo");
                }}
                initialValues={{
                  name: staff?.staff_name,
                  position: staff?.position,
                  phone: {
                    countryCode: staff?.country_code,
                    phoneNumber: staff?.phone,
                  },
                }}
              />
            ) : status === "companyInfo" ? (
              <CompanyInfo
                onPrev={() => setStatus("basicInfo")}
                onNext={() => {
                  fetchStaff();
                  setStatus("recruitmentRequirement");
                }}
                initialValues={{
                  name: staff?.company_name,
                  website: staff?.company_website,
                  size: staff?.company_size,
                }}
              />
            ) : (
              <RecruitmentRequirement
                onPrev={() => setStatus("companyInfo")}
                onNext={() => {
                  fetchStaff();
                  setStatus("waiting");
                }}
                initialValues={{
                  role_type: staff?.company_recruitment_requirements?.role_type,
                  headcount_number:
                    staff?.company_recruitment_requirements?.headcount_number,
                }}
              />
            )}
          </div>
        </div>
      ) : (
        <Waiting status={staff?.company_status || "approving"} />
      )}
    </div>
  );
};

export default Signup;
