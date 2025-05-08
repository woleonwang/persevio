import { Button } from "antd";
import { Get } from "@/utils/request";
import styles from "./style.module.less";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

const Settings = () => {
  const [profile, setProfile] = useState<ICandidateSettings>();
  const navigate = useNavigate();
  const { t: originalT } = useTranslation();

  const t = (key: string) => {
    return originalT(`settings.${key}`);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { code, data } = await Get("/api/candidate/settings");
    if (code === 0) {
      setProfile(data.candidate);
    }
  };

  // const updateLang = async (lang: string) => {
  //   const { code } = await Post("/api/candidate/language", {
  //     lang,
  //   });
  //   if (code === 0) {
  //     message.success(t("update_lang_success"));
  //     if (profile) {
  //       setProfile({
  //         ...profile,
  //         lang,
  //       });
  //     }
  //     i18n.changeLanguage(lang);
  //   } else {
  //     message.error(t("update_lang_success"));
  //   }
  // };

  const logout = () => {
    localStorage.removeItem("candidate_token");
    navigate("/signin-candidate");
  };

  return (
    <div className={styles.container}>
      <div className={styles.block}>
        <div className={styles.title}>{t("profile")}</div>
        <div className={styles.item}>
          <div className={styles.label}>{t("name")}:</div>
          <div>{profile?.name}</div>
        </div>
        <div className={styles.item}>
          <div className={styles.label}>{t("email")}:</div>
          <div>{profile?.email}</div>
        </div>
        <div className={styles.item}>
          <Button type="primary" onClick={() => logout()}>
            {t("logout")}
          </Button>
        </div>
      </div>

      {/* <div className={styles.block}>
        <div className={styles.title}>{t("change_password")}</div>
        <Form form={form}>
          <Form.Item
            label={t("password")}
            name="password"
            rules={[{ required: true }]}
          >
            <Input.Password style={{ width: 300 }} />
          </Form.Item>
          <Button type="primary" onClick={() => updatePassword()}>
            {originalT("save")}
          </Button>
        </Form>
      </div>

      <div className={styles.block}>
        <div className={styles.title}>{t("language")}</div>

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
          value={profile?.lang}
          onChange={(lang) => updateLang(lang)}
        />
      </div> */}
    </div>
  );
};

export default Settings;
