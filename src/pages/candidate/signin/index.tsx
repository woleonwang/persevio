import React, { Fragment, useEffect, useState } from "react";
import { Alert, Button, Input, message, Empty, Spin } from "antd";
import classnames from "classnames";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { CheckCircleFilled, DoubleRightOutlined } from "@ant-design/icons";

import { Get, Post } from "@/utils/request";
import CandidateChat from "@/components/CandidateChat";
import OAuth from "./components/OAuth";
import BasicInfo, { TBaiscInfo } from "./components/BasicInfo";

import logo from "@/assets/logo.png";
import styles from "./style.module.less";
import VionaAvatar from "@/assets/viona-avatar.png";

const CandidateSignIn: React.FC = () => {
  const [pageState, setPageState] = useState<
    "signin" | "basic" | "interests" | "targets" | "conversation" | "approve"
  >();

  const [basicInfo, setBasicInfo] = useState<TBaiscInfo>();
  const [interests, setInterests] = useState<string>();
  const [targets, setTargets] = useState<string>();
  const [candidate, setCandidate] = useState<ICandidateSettings>();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } else {
      message.error("保存失败");
    }
    setIsSubmitting(false);
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
            <img
              src={logo}
              className={styles.banner}
              onClick={() => navigate("/")}
            />
            {pageState === "conversation" && (
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
            return (
              <Empty
                style={{ marginTop: 100 }}
                description={
                  candidate?.approve_status === "rejected"
                    ? "您的申请已拒绝"
                    : "Viona正在帮您做匹配的准备，请耐心等待"
                }
              />
            );
          } else {
            const stepConfigs = [
              {
                key: "basic",
                title: "基本信息",
              },
              {
                key: "interests",
                title: "感兴趣的主题/领域",
              },
              {
                key: "targets",
                title: "链接目标",
              },
              {
                key: "conversation",
                title: "确认感兴趣的人物画像",
              },
            ];

            const currentStepIndex = stepConfigs.findIndex(
              (step) => step.key === pageState
            );

            return (
              <>
                <div className={styles.stepContainer}>
                  {stepConfigs.map((step, index) => {
                    const status =
                      index === currentStepIndex
                        ? "active"
                        : index < currentStepIndex
                        ? "completed"
                        : "pending";
                    return (
                      <Fragment key={step.key}>
                        {index > 0 && (
                          <div
                            className={classnames(
                              styles.symbol,
                              styles[status]
                            )}
                          >
                            <DoubleRightOutlined />
                          </div>
                        )}
                        <div className={styles.stepWrapper}>
                          {status === "completed" ? (
                            <CheckCircleFilled
                              className={classnames(
                                styles.index,
                                styles[status]
                              )}
                            />
                          ) : (
                            <div
                              className={classnames(
                                styles.index,
                                styles.number,
                                styles[status]
                              )}
                            >
                              {index + 1}
                            </div>
                          )}
                          <div
                            className={classnames(styles.step, styles[status])}
                          >
                            {step.title}
                          </div>
                        </div>
                      </Fragment>
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
                            setPageState("interests");
                          }}
                        />
                      </div>
                    );
                  }

                  if (pageState === "interests") {
                    return (
                      <div className={styles.form}>
                        <div
                          className={classnames(styles.required, styles.title)}
                        >
                          目前正在探索的领域，或者感兴趣的主题
                        </div>
                        <div className={styles.formBg}>
                          <div className={styles.hint}>
                            <div>
                              您可以添加多个感兴趣的领域，以帮助Viona了解您的需求。示例：
                            </div>
                            <ol>
                              <li>
                                我正在学习如何为AI智能体构建和扩展评估体系的最佳实践。
                              </li>
                              <li>
                                我正在研究新一代的生息稳定币，想搞懂它们底层的运行机制和潜在风险。
                              </li>
                              <li>
                                我最近在琢磨，要不要开一个自己的Newsletter，聊聊‘面向普通消费者的金融科技’这个话题。很想和已经‘下场’玩过的人聊聊，看看起步时会踩哪些坑。
                              </li>
                              <li>
                                AI时代什么样的人才或者能力才是有持久价值的。
                              </li>
                            </ol>
                          </div>
                          <Input.TextArea
                            value={interests}
                            onChange={(e) => setInterests(e.target.value)}
                            rows={8}
                            style={{ padding: 16 }}
                          />
                        </div>
                        <Button
                          disabled={!interests}
                          type="primary"
                          onClick={() => setPageState("targets")}
                          style={{ width: "100%", marginTop: 16 }}
                          size="large"
                        >
                          下一步
                        </Button>
                      </div>
                    );
                  }

                  if (pageState === "targets") {
                    return (
                      <div className={styles.form}>
                        <div className={styles.title}>
                          想通过networking来达成什么目标？
                        </div>
                        <div className={styles.formBg}>
                          <div className={styles.hint}>
                            <div>
                              您可以添加多个意向目标，以帮助Viona了解您的需求。目标示例：
                            </div>
                            <ol>
                              <li>
                                我正在为我的开发者工具创业公司进行种子轮融资，希望能认识在这个领域有成功投资经验的风险投资人。
                              </li>
                              <li>
                                我最近刚搬到新加坡，希望能认识一些在fintech行业的朋友，拓展一些专业人脉。
                              </li>
                              <li>
                                我正在为我的团队招聘一名资深全栈工程师，要求有TypeScript和AWS的实战经验。
                              </li>
                              <li>
                                我正在为我的B2B
                                SaaS新产品寻找3-5名种子用户。理想的用户是在50-200人规模的科技公司担任销售总监。
                              </li>
                            </ol>
                          </div>
                          <Input.TextArea
                            rows={8}
                            value={targets}
                            onChange={(e) => setTargets(e.target.value)}
                            style={{ padding: 16 }}
                          />
                        </div>

                        <Button
                          type="primary"
                          onClick={() => onSubmitBasicInfo()}
                          style={{ width: "100%", marginTop: 16 }}
                          size="large"
                          loading={isSubmitting}
                        >
                          下一步
                        </Button>
                      </div>
                    );
                  }

                  if (pageState === "conversation") {
                    return (
                      <div className={styles.conversation}>
                        <CandidateChat chatType="network_profile" />
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
