import React, { useState } from "react";
import { useNavigate } from "react-router";
import SignContainer from "@/components/SignContainer";
import { useTranslation } from "react-i18next";
import OAuth from "./components/OAuth";
import Register from "./components/Register";
import BasicInfo from "./components/BasicInfo";
import CompanyInfo from "./components/CompanyInfo";
import RecruitmentRequirement from "./components/RecruitmentRequirement";
import Waiting from "./components/Waiting";
import { set } from "mobx";

type TStatus =
  | "oauth"
  | "register"
  | "basicInfo"
  | "companyInfo"
  | "recruitmentRequirement"
  | "waiting";

const Signup: React.FC = () => {
  const [status, setStatus] = useState<TStatus>("oauth");
  const { t } = useTranslation();

  const navigate = useNavigate();

  return (
    <SignContainer>
      {status === "oauth" ? (
        <OAuth onWithEmail={() => setStatus("register")} />
      ) : status === "register" ? (
        <Register onNext={() => setStatus("basicInfo")} />
      ) : status === "basicInfo" ? (
        <BasicInfo />
      ) : status === "companyInfo" ? (
        <CompanyInfo />
      ) : status === "recruitmentRequirement" ? (
        <RecruitmentRequirement />
      ) : status === "waiting" ? (
        <Waiting />
      ) : null}
    </SignContainer>
  );
};

export default Signup;
