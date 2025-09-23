import React, { useEffect, useState } from "react";
import { Button, Input, message, Spin } from "antd";
import classnames from "classnames";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { Get, Post } from "@/utils/request";
import CandidateChat from "@/components/CandidateChat";
import OAuth from "./components/OAuth";
import BasicInfo, { TBaiscInfo } from "./components/BasicInfo";

import logo from "@/assets/logo.png";
import styles from "./style.module.less";
import VionaAvatar from "@/assets/viona-avatar.png";
import { checkIsAdmin } from "@/utils";
import Approve from "./components/Approve";

const CandidateSignIn: React.FC = () => {
  const [pageState, setPageState] = useState<
    "signin" | "basic" | "targets" | "conversation" | "approve"
  >();

  const [basicInfo, setBasicInfo] = useState<TBaiscInfo>();
  const [targets, setTargets] = useState<string[]>();
  const [candidate, setCandidate] = useState<ICandidateSettings>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtherTargetShow, setIsOtherTargetShow] = useState(false);
  const [otherTarget, setOtherTarget] = useState<string>();

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
      } else if (candidate.approve_status !== "approved") {
        setPageState("approve");
      } else {
        navigate("/candidate/home");
      }
    } else {
      setPageState("signin");
    }

    setPageState("targets");
  };

  const onSubmitBasicInfo = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const params = {
      ...basicInfo,
      interests,
      targets,
    };
    const { code } = await Post(`/api/candidate/network/basic_info`, params);
    if (code === 0) {
      message.success("保存成功");
      setPageState("conversation");
    } else if (code === 10005) {
      message.error("大模型调用失败，请重新提交");
    } else {
      message.error("保存失败");
    }
    setIsSubmitting(false);
  };

  const isAdmin = checkIsAdmin(candidate);

  if (!pageState) {
    return <></>;
  }

  const targetsOptions = [
    {
      key: "explore_new_job_opportunities",
      title: "探索新的职业机会",
      description:
        "我可以帮您链接到您感兴趣的公司的人选或者直接给您推荐合适的工作机会。",
    },

    {
      key: "i_am_hiring",
      title: "我正在招聘",
      description: "我可以给您推荐潜在合适的候选人。",
    },

    {
      key: "consult_with_others",
      title: "向他人发起咨询/学习",
      description: "我可以把您链接到相关的专家。",
    },
    {
      key: "seek_funding",
      title: "寻求融资",
      description: "我可以把您链接到潜在的投资人或者相关的人员。",
    },
    {
      key: "seek_investment_target",
      title: "寻求投资标",
      description: "我可以根据您的要求把您链接到合适的投资标。",
    },
    {
      key: "become_expert_network_expert",
      title: "成为专家网络的专家",
      description: "您可以加入我们的专家网络，向别人提供付费的或者免费的咨询。",
    },
  ];

  const canSubmitTargets = (targets ?? []).length > 0 || !!otherTarget;

  return (
    <div
      className={classnames(styles.container, {
        [styles.mobile]: pageState === "signin",
      })}
    >
      {/* <Alert
        message={"可以在PC端进行下一步操作，体验更加流畅的职位申请流程。"}
        type="warning"
        showIcon
        closable
        className={styles.mobileVisible}
      /> */}
      {pageState !== "signin" && pageState !== "approve" && (
        <>
          <div className={styles.header}>
            <img
              src={logo}
              className={styles.banner}
              onClick={() => navigate("/")}
            />
            {pageState === "conversation" && isAdmin && (
              <Button
                type="primary"
                onClick={async () => {
                  if (confirm("确定要重置到基本信息页面么？")) {
                    const { code } = await Post(
                      "/api/candidate/network/reset_name"
                    );
                    if (code === 0) {
                      message.success("重置成功");
                      location.reload();
                    } else {
                      message.error("重置失败");
                    }
                  }
                }}
                style={{ position: "absolute", right: 20 }}
              >
                重置注册
              </Button>
            )}
          </div>
        </>
      )}
      <div className={styles.main}>
        {(() => {
          if (pageState === "signin") {
            return <OAuth />;
          } else if (pageState === "approve") {
            return <Approve status={candidate?.approve_status ?? ""} />;
          } else {
            const currentIndex =
              pageState === "basic" ? 0 : pageState === "targets" ? 1 : 2;

            return (
              <>
                <div className={styles.stepContainer}>
                  {new Array(3).fill(0).map((_, index) => {
                    return (
                      <div
                        key={index}
                        className={classnames(styles.step, {
                          [styles.active]: index <= currentIndex,
                        })}
                      />
                    );
                  })}
                </div>
                {(() => {
                  if (pageState === "basic") {
                    return (
                      <div className={styles.body}>
                        <BasicInfo
                          onFinish={(params) => {
                            setBasicInfo(params);
                            setPageState("targets");
                          }}
                        />
                      </div>
                    );
                  }

                  if (pageState === "targets") {
                    return (
                      <div className={styles.form}>
                        <div
                          className={classnames(styles.required, styles.title)}
                        >
                          想通过networking来达成什么目标？
                        </div>
                        <div className={styles.formBg}>
                          {targetsOptions.map((option) => (
                            <div
                              key={option.key}
                              className={classnames(styles.targetOption, {
                                [styles.active]: targets?.includes(option.key),
                              })}
                              onClick={() =>
                                setTargets(
                                  targets?.includes(option.key)
                                    ? targets?.filter(
                                        (key) => key !== option.key
                                      )
                                    : [...(targets ?? []), option.key]
                                )
                              }
                            >
                              <div>{option.title}</div>
                              <div>{option.description}</div>
                            </div>
                          ))}
                          {isOtherTargetShow ? (
                            <div>
                              <Input.TextArea
                                placeholder={`您可以添加多个意向目标，以帮助Viona了解您的需求。目标示例:
1.我正在为我的开发者工具创业公司进行种子轮融资，希望能认识在这个领域有成功投资经验的风险投资人。
2.我最近刚搬到新加坡，希望能认识一些在fintech行业的朋友，拓展一些专业人脉。
3.我正在为我的团队招聘一名资深全栈工程师，要求有TypeScript和AWS的实战经验。
4.我正在为我的B2B SaaS新产品寻找3-5名种子用户。理想的用户是在50-200人规模的科技公司担任销售总监。
5.我刚来新加坡工作，想找喜欢打网球的朋友业余一起打网球。`}
                                value={otherTarget}
                                onChange={(e) => setOtherTarget(e.target.value)}
                              />
                            </div>
                          ) : (
                            <div onClick={() => setIsOtherTargetShow(true)}>
                              + 添加其它目标
                            </div>
                          )}
                        </div>

                        <Button
                          type="primary"
                          onClick={() => onSubmitBasicInfo()}
                          style={{ width: "100%", marginTop: 16 }}
                          size="large"
                          loading={isSubmitting}
                          disabled={!canSubmitTargets}
                        >
                          下一步
                        </Button>
                      </div>
                    );
                  }

                  if (pageState === "conversation") {
                    return (
                      <div className={styles.conversation}>
                        <CandidateChat
                          chatType="network_profile"
                          onFinish={async () => {
                            if (!confirm("确定要完成对话吗？")) return;

                            const { code } = await Post(
                              `/api/candidate/network/finish_profile_conversation`
                            );

                            if (code === 0) {
                              setPageState("approve");
                            } else {
                              message.error("完成对话失败");
                            }
                          }}
                          candidate={candidate}
                        />
                      </div>
                    );
                  }
                })()}
              </>
            );
          }
        })()}
      </div>
      {isSubmitting && !basicInfo?.work_experience && (
        <Spin
          fullscreen
          indicator={<></>}
          tip={
            <div className={styles.loadingTip}>
              <img src={VionaAvatar} />
              <div>
                Viona 正在努力了解您的基本情况，大概需要
                {!!basicInfo?.linkedin_profile_url ? "1~2分钟" : "30秒"}
                。请稍后...
              </div>
            </div>
          }
        />
      )}
    </div>
  );
};

export default CandidateSignIn;
