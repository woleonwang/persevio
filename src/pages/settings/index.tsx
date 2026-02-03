import { Button, Form, Input, message, Select, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import classnames from "classnames";
import { Get, Post } from "../../utils/request";
import styles from "./style.module.less";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import globalStore from "@/store/global";
import { tokenStorage } from "../../utils/storage";

const Settings = () => {
  const [form] = Form.useForm();
  const [profile, setProfile] = useState<ISettings>();
  const navigate = useNavigate();
  const { t: originalT, i18n } = useTranslation();
  const [allCompanies, setAllCompanies] = useState<
    {
      label: string;
      title: string;
      options: {
        value: string;
        label: string;
      }[];
    }[]
  >([]);

  const t = (key: string) => {
    return originalT(`settings.${key}`);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchCompanies();
    }
  }, [profile]);

  const fetchSettings = async () => {
    const { code, data } = await Get("/api/settings?with_prompts=1");
    if (code === 0) {
      setProfile(data);
      const formValues: Record<string, string> = {};

      data.prompts.forEach((item: TPrompt) => {
        formValues[item.prompt_type] = item.content;
      });
      form.setFieldsValue(formValues);
    }
  };

  const fetchCompanies = async () => {
    const { code, data } = await Get("/api/all_companies");
    if (code === 0) {
      setAllCompanies(
        (data.companies ?? [])
          .filter((item: any) => (item.staffs ?? []).length > 0)
          .map((company: any) => {
            return {
              label: company.name,
              title: company.name,
              options: company.staffs.map((staff: any) => {
                return {
                  value: staff.id,
                  label: staff.name,
                };
              }),
            };
          })
      );
    }
  };

  const updatePassword = () => {
    form.validateFields().then(async (values) => {
      const { password } = values;
      const { code } = await Post("/api/update_password", {
        password,
      });
      if (code === 0) {
        message.success(t("update_password_success"));
      } else {
        message.error(t("update_password_error"));
      }
    });
  };

  const updatePrompt = async (promptType: string, role: string) => {
    const content = form.getFieldsValue()[promptType];
    const { code } = await Post("/api/update_prompt", {
      prompt_type: promptType,
      content,
      role,
    });
    if (code === 0) {
      message.success("Update prompt succeed");
    } else {
      message.error("Update prompt failed");
    }
  };

  const updateLang = async (lang: string) => {
    const { code } = await Post("/api/update_settings", {
      lang,
    });
    if (code === 0) {
      message.success(t("update_lang_success"));
      if (profile) {
        setProfile({
          ...profile,
          lang,
        });
      }
      i18n.changeLanguage(lang);
      globalStore.setAntdLocale(lang as "zh-CN" | "en-US");
    } else {
      message.error(t("update_lang_success"));
    }
  };

  const loginToStaff = async (staffId: string) => {
    const { code, data } = await Post("/api/login_to_staff", {
      staff_id: parseInt(staffId),
    });
    if (code === 0) {
      tokenStorage.setToken(data.token, "staff");
      window.location.reload();
    } else {
      message.error("login failed");
    }
  };

  const logout = () => {
    tokenStorage.removeToken("staff");
    navigate("/signin");
  };

  const promptTypeLabelMap: Record<string, string> = {
    JOB_REQUIREMENT: "聊职位需求（旧）",
    JOB_REQUIREMENT_ASK_FOR_JD: "询问是否有JD",
    JOB_REQUIREMENT_WITH_JD: "聊职位需求（有JD）",
    JOB_REQUIREMENT_WITHOUT_JD: "聊职位需求（无JD）",
    JOB_DESCRIPTION: "聊职位JD",
    JOB_TARGET_COMPANIES: "聊目标公司",
    JOB_COMPENSATION_DETAILS: "聊薪资待遇",
    JOB_SCREENING_QUESTION: "聊筛选问题",
    JOB_INTERVIEW_PLAN: "聊面试计划",
    JOB_OUTREACH_MESSAGE: "聊触达信息",
    JOB_SOCIAL_MEDIA: "聊社交网络",
    JOB_FAQ: "聊如何吸引候选人",
    // JOB_TALENT_EVALUATE: "候选人评估",
    JOB_CANDIDATE_CHAT: "职位 Chatbot",
    JOB_INTERVIEW_DESIGN: "面试设计",
    JOB_INTERVIEW_FEEDBACK: "面试反馈",
    JOB_REQUIREMENT_GENERATE_STRATEGY: "生成职位需求对话策略",
    CANDIDATE_INTERVIEW_WITH_JOB_CHAT: "注册流程候选人面试（有职位）",
    CANDIDATE_INTERVIEW_WITHOUT_JOB_CHAT: "注册流程候选人面试（无职位）",
    CANDIDATE_RESUME_CHAT: "生成简历",
    CANDIDATE_GENERATE_CAREER_ASPIRATION_CHAT: "生成职业目标文档",
    CANDIDATE_DEEP_CAREER_ASPIRATION_CHAT: "深度聊职业目标",
    CANDIDATE_INTERNAL_EVALUATE_CHAT: "生成内部评估文档",
    // CANDIDATE_RECOMMEND_FOR_JOB_CHAT: "生成推荐报告",
    CANDIDATE_JOB_INTERVIEW_CHAT: "职位内的面试",
    CANDIDATE_JOB_SCREENING: "候选人推荐报告",
    UTILS_MERGE_INTERVIEW_FEEDBACKS: "合并面试反馈",
    UTILS_GENERATE_JRD: "生成 JRD",
    CANDIDATE_NETWORK_PROFILE_CHAT: "候选人需求档案",
    CANDIDATE_GENERATE_PRESCREENING_STRATEGY: "生成prescreening strategy",
  };

  return (
    <div className={styles.container}>
      <div className={styles.block}>
        <div className={styles.title}>{t("profile")}</div>
        <div className={styles.panel}>
          <div className={styles.left}>
            <div className={styles.item}>
              <div className={styles.label}>{t("name")}</div>
              <div>{profile?.staff_name}</div>
            </div>
            <div className={styles.item}>
              <div className={styles.label}>{t("email")}</div>
              <div>{profile?.email}</div>
            </div>
          </div>

          <div className={styles.right}>
            <div className={styles.item}>
              <Button type="default" onClick={() => logout()} size="large">
                {t("logout")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.block}>
        <div className={styles.title}>{t("change_password")}</div>
        <div className={styles.panel} style={{ alignItems: "flex-start" }}>
          <div className={classnames(styles.left, styles.formContainer)}>
            <Form form={form}>
              <Form.Item
                label={t("password")}
                name="password"
                rules={[{ required: true }]}
                colon={false}
              >
                <Input.Password style={{ width: 300 }} size="large" />
              </Form.Item>
            </Form>
          </div>
          <div className={styles.right}>
            <Button
              type="primary"
              onClick={() => updatePassword()}
              size="large"
            >
              {originalT("save")}
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.block}>
        <div className={styles.title}>
          {t("language")}
          <Tooltip title={t("language_tooltip")}>
            <InfoCircleOutlined
              style={{
                marginLeft: 5,
                fontSize: 16,
                position: "relative",
                top: -2,
              }}
            />
          </Tooltip>
        </div>

        <div className={styles.panel}>
          <div className={classnames(styles.left, styles.formContainer)}>
            <div className={styles.label}>{t("language_label")}</div>
            <Select
              style={{ width: 300 }}
              options={[
                {
                  value: "en-US",
                  label: "English",
                },
                {
                  value: "zh-CN",
                  label: "中文",
                },
              ]}
              value={profile?.lang || "en-US"}
              onChange={(lang) => updateLang(lang)}
              size="large"
            />
          </div>
        </div>
      </div>

      {!!profile?.is_admin && (
        <div className={styles.block}>
          <div className={styles.title}>Login as staff of company</div>

          <div className={styles.panel}>
            <div className={classnames(styles.left, styles.formContainer)}>
              <div className={styles.label}>Company</div>
              <Select
                style={{ width: 300 }}
                options={allCompanies}
                onChange={(staffId) => loginToStaff(staffId)}
                showSearch
                optionFilterProp="label"
              />
            </div>
          </div>
        </div>
      )}

      {!!profile?.is_admin && (
        <div className={styles.block}>
          <div className={styles.title}>Customize Prompts</div>

          <Form form={form} layout="vertical">
            {profile.prompts.map((item, index) => {
              return (
                <div className={styles.panel} key={index}>
                  <div
                    className={classnames(styles.left, styles.formContainer)}
                  >
                    <div key={item.prompt_type} style={{ flex: "auto" }}>
                      <Form.Item
                        label={promptTypeLabelMap[item.prompt_type]}
                        name={item.prompt_type}
                      >
                        <Input.TextArea rows={10} style={{ width: "100%" }} />
                      </Form.Item>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          marginTop: 16,
                        }}
                      >
                        <Button
                          type="primary"
                          onClick={() =>
                            updatePrompt(item.prompt_type, item.role)
                          }
                        >
                          {originalT("save")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </Form>
        </div>
      )}
    </div>
  );
};

export default Settings;
