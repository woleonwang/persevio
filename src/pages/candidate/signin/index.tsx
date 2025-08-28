import React, { useEffect, useState } from "react";
import { Alert, Button, Input, message } from "antd";
import classnames from "classnames";
import { Get, Post } from "@/utils/request";

import logo from "@/assets/logo.png";
import styles from "./style.module.less";
import OAuth from "./components/OAuth";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import BasicInfo, { TBaiscInfo } from "./components/BasicInfo";
import CandidateChat from "@/components/CandidateChat";

const CandidateSignIn: React.FC = () => {
  const [pageState, setPageState] = useState<
    | "signin"
    | "basic"
    | "interests"
    | "targets"
    | "personalities"
    | "conversation"
  >();
  const [candidate, setCandidate] = useState<ICandidateSettings>();

  const [basicInfo, setBasicInfo] = useState<TBaiscInfo>();
  const [interests, setInterests] = useState<string>();
  const [targets, setTargets] = useState<string>();
  const [personalities, setPersonalities] = useState<string>();

  const navigate = useNavigate();
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`candidate_sign.${key}`);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    const code = urlParams.get("code");
    if (error === "google_login_failed" && code === "10001") {
      message.error(t("email_exists"));
    }

    const tokenFromUrl = urlParams.get("token");
    if (tokenFromUrl) {
      urlParams.delete("token");
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${
          urlParams.toString() ? `?${urlParams.toString()}` : ""
        }`
      );

      localStorage.setItem("candidate_token", tokenFromUrl);
    }

    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { code, data } = await Get(`/api/candidate/settings`);
    if (code === 0) {
      const candidate: ICandidateSettings = data.candidate;
      setCandidate(candidate);

      if (!candidate.name) {
        setPageState("basic");
      } else if (!candidate.network_profile_finished_at) {
        setPageState("conversation");
      } else {
        navigate("/candidate/home");
      }
    } else {
      setPageState("signin");
    }
  };

  const onSubmitBasicInfo = async () => {
    const params = {
      ...basicInfo,
      interests,
      targets,
      personalities,
    };
    const { code } = await Post(`/api/candidate/network/basic_info`, params);
    if (code === 0) {
      message.success("保存成功");
    } else {
      message.error("保存失败");
    }
  };

  return (
    <div
      className={classnames(styles.container, {
        [styles.mobile]: pageState === "signin",
      })}
    >
      <Alert
        message={"可以在PC端进行下一步操作，体验更加流畅的职位申请流程。"}
        type="warning"
        showIcon
        closable
        className={styles.mobileVisible}
      />
      {pageState !== "signin" && (
        <>
          <div className={styles.header}>
            <img src={logo} className={styles.banner} />
          </div>
        </>
      )}
      <div className={styles.main}>
        {(() => {
          if (pageState === "signin") {
            return <OAuth />;
          }

          if (pageState === "basic") {
            return (
              <BasicInfo
                onFinish={(params) => {
                  setBasicInfo(params);
                  setPageState("interests");
                }}
              />
            );
          }

          if (pageState === "interests") {
            return (
              <div>
                <div className={styles.required}>
                  目前正在探索的领域，或者感兴趣的主题
                </div>
                <Input.TextArea
                  placeholder="请输入"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                />
                <Button
                  disabled={!interests}
                  type="primary"
                  onClick={() => setPageState("targets")}
                >
                  下一步
                </Button>
              </div>
            );
          }

          if (pageState === "targets") {
            return (
              <div>
                <div>想通过networking来达成什么目标？</div>
                <Input.TextArea
                  placeholder={`
                    您可以添加多个意向目标，以帮助Viona了解您的需求。目标示例：
                    我想要找人学习怎么构建AI Agent的Eval系统
                    我需要为我的初创企业寻找另外的5个pilot user
                    融资
                    没有具体目标，认识AI行业里的新朋友
                    正在考虑下一步的职业规划，想跟相关的朋友沟通沟通。
                    招人
                    寻找投资标的`}
                  value={targets}
                  onChange={(e) => setTargets(e.target.value)}
                />
                <Button
                  type="primary"
                  onClick={() => setPageState("personalities")}
                >
                  下一步
                </Button>
              </div>
            );
          }

          if (pageState === "personalities") {
            return (
              <div>
                <div>更希望与哪一类明确的对象进行交流？</div>
                <Input.TextArea
                  placeholder="请输入"
                  value={personalities}
                  onChange={(e) => setPersonalities(e.target.value)}
                />
                <Button
                  type="primary"
                  onClick={() => {
                    onSubmitBasicInfo();
                    setPageState("conversation");
                  }}
                >
                  下一步
                </Button>
              </div>
            );
          }

          if (pageState === "conversation") {
            return (
              <div>
                <CandidateChat chatType="network_profile" />
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
};

export default CandidateSignIn;
