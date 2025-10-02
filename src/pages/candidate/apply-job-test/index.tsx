import React, { useEffect, useRef, useState } from "react";
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
import { targetsOptions } from "../network-pofile/components/EditableTargets";

const ApplyJobTest: React.FC = () => {
  const [pageState, setPageState] = useState<
    "signin" | "basic" | "targets" | "conversation" | "approve"
  >("conversation");

  const [basicInfo, setBasicInfo] = useState<TBaiscInfo>();
  const [targets, setTargets] = useState<string[]>();
  const [candidate, setCandidate] = useState<ICandidateSettings>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingModalShow, setIsSubmittingModalShow] = useState(false);
  const [isOtherTargetShow, setIsOtherTargetShow] = useState(false);
  const [otherTarget, setOtherTarget] = useState<string>();
  const [loadingText, setLoadingText] = useState<string>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const navigate = useNavigate();
  const { t: originalT, i18n } = useTranslation();
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
      i18n.changeLanguage(candidate.lang ?? "zh-CN");
      // if (!candidate.name) {
      //   setPageState("basic");
      // } else if (!candidate.network_profile_finished_at) {
      //   setPageState("conversation");
      // } else if (candidate.approve_status !== "approved") {
      //   setPageState("approve");
      // } else {
      //   navigate("/candidate/home");
      // }
    } else {
      setPageState("signin");
    }
  };

  const onSubmitBasicInfo = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setIsSubmittingModalShow(true);

    if (basicInfo?.linkedin_profile_url) {
      setLoadingText("Viona 正在获取基本信息...");
      timeoutRef.current = setTimeout(() => {
        setLoadingText("Viona 正在获取工作经历...");
        timeoutRef.current = setTimeout(() => {
          setLoadingText("Viona 正在汇总信息...");
        }, 10000);
      }, 10000);
    } else if (basicInfo?.resume_path) {
      setLoadingText("Viona 正在汇总信息...");
    }

    const params = {
      ...basicInfo,
      targets: [...(targets ?? []), otherTarget].filter(Boolean),
    };
    const { code } = await Post(`/api/candidate/network/basic_info`, params);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (code === 0) {
      message.success("保存成功");
    } else if (code === 10005) {
      message.error("大模型调用失败，请重新提交");
      setIsSubmittingModalShow(false);
    } else {
      message.error("保存失败");
      setIsSubmittingModalShow(false);
    }
    setIsSubmitting(false);
  };

  const isAdmin = checkIsAdmin(candidate);

  if (!pageState) {
    return <></>;
  }

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
            return <Approve />;
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

                <div
                  className={styles.body}
                  style={{ display: pageState === "basic" ? "block" : "none" }}
                >
                  <BasicInfo
                    onFinish={(params) => {
                      setBasicInfo(params);
                      setPageState("targets");
                    }}
                  />
                </div>

                {(() => {
                  if (pageState === "targets") {
                    return (
                      <div className={styles.form}>
                        <div
                          className={classnames(styles.required, styles.title)}
                        >
                          想通过networking来达成什么目标？
                        </div>
                        <div>
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
                              <div className={styles.targetTitle}>
                                {option.title}
                              </div>
                              <div className={styles.description}>
                                <img
                                  src={VionaAvatar}
                                  className={styles.avatar}
                                />
                                {option.description}
                              </div>
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
                                rows={10}
                              />
                            </div>
                          ) : (
                            <div
                              className={styles.addOtherTarget}
                              onClick={() => setIsOtherTargetShow(true)}
                            >
                              + 添加其它目标
                            </div>
                          )}
                        </div>

                        <div className={styles.footer}>
                          <div
                            className={styles.back}
                            onClick={() => setPageState("basic")}
                          >
                            {"< 上一步"}
                          </div>
                          <Button
                            type="primary"
                            onClick={() => onSubmitBasicInfo()}
                            size="large"
                            style={{ width: "200px" }}
                            loading={isSubmitting}
                            disabled={!canSubmitTargets}
                          >
                            下一步
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  if (pageState === "conversation") {
                    return (
                      <div className={styles.conversation}>
                        <CandidateChat
                          chatType="profile"
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
      {isSubmittingModalShow && (
        <Spin
          fullscreen
          indicator={<></>}
          tip={
            <div className={styles.loadingTip}>
              <div className={styles.waiting}>
                <img src={VionaAvatar} />
                <div>
                  非常感谢您的分享。
                  {!basicInfo?.work_experience
                    ? `Viona 正在努力了解您的基本情况，大概需要${
                        !!basicInfo?.linkedin_profile_url ? "1~2分钟" : "30秒"
                      }
                  。请稍后...`
                    : ""}
                </div>
              </div>
              <div>
                <p>
                  我已经有一些初步的连接思路，为了确保我100%理解您的需求，并能将您以最佳方式介绍给对方，
                  <b>接下来我希望能与您进行一次约15分钟的简短沟通</b>。
                </p>
                <p>
                  <b>这能让我更深入地了解您的独特背景和期望</b>
                  ，同时也是对我人脉圈朋友们的负责，
                  <b>确保每一次推荐对双方都是高质量且相关的</b>。
                </p>
                <p>在接下来的对话过程中，您可以随时开始，暂停，重新开始。</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <Button
                  type="primary"
                  onClick={() => {
                    setIsSubmittingModalShow(false);
                    setPageState("conversation");
                  }}
                  style={{ width: "300px" }}
                  disabled={isSubmitting}
                  size="large"
                >
                  {isSubmitting ? loadingText : "开始对话"}
                </Button>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
};

export default ApplyJobTest;
