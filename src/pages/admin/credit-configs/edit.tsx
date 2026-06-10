import { Breadcrumb, Button, Space, Spin, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useParams } from "react-router";

import { Get, Post } from "@/utils/request";
import ConfigEditForm from "./components/ConfigEditForm";
import styles from "./style.module.less";
import type {
  ICreditConfig,
  ICreditConfigFields,
  ICompanyOption,
} from "./types";
import {
  buildNewCustomFields,
  getDefaultFields,
  isNameTaken,
  parseCreditConfigFields,
  stringifyCreditConfigFields,
  validateCreditConfigFields,
} from "./utils";

const CreditConfigEditPage = () => {
  const { id } = useParams();
  const { pathname } = useLocation();
  const isNew = id === "new" || pathname.endsWith("/credit-configs/new");
  const navigate = useNavigate();
  const { t: originalT } = useTranslation();
  const t = (key: string, options?: Record<string, unknown>) =>
    originalT(`admin_credit_configs.${key}`, options);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<ICreditConfig[]>([]);
  const [companies, setCompanies] = useState<ICompanyOption[]>([]);
  const [configType, setConfigType] = useState<"default" | "custom">("custom");
  const [name, setName] = useState("");
  const [companyIds, setCompanyIds] = useState<number[]>([]);
  const [fields, setFields] = useState<ICreditConfigFields>(
    buildNewCustomFields(),
  );

  const defaultFields = useMemo(() => getDefaultFields(configs), [configs]);
  const companyOptions = useMemo(
    () => companies.map((item) => ({ label: item.name, value: item.id })),
    [companies],
  );

  useEffect(() => {
    let cancelled = false;

    const loadPageData = async () => {
      setLoading(true);
      try {
        const [configListRes, companyRes] = await Promise.all([
          Get<{ configs: ICreditConfig[] }>("/api/admin/credit_configs"),
          Get<{ companies: ICompanyOption[] }>("/api/admin/companies/options"),
        ]);

        if (cancelled) {
          return;
        }

        if (companyRes.code === 0) {
          setCompanies(companyRes.data.companies);
        }

        if (configListRes.code !== 0) {
          message.error(originalT("admin_credit_configs.messages.fetchFailed"));
          return;
        }

        setConfigs(configListRes.data.configs);

        if (isNew) {
          setConfigType("custom");
          return;
        }

        const detailRes = await Get<ICreditConfig>(
          `/api/admin/credit_configs/${id}`,
        );
        if (cancelled) {
          return;
        }
        if (detailRes.code !== 0) {
          message.error(originalT("admin_credit_configs.messages.fetchFailed"));
          navigate("/admin/credit-configs");
          return;
        }

        const detail = detailRes.data;
        const parsedFields = parseCreditConfigFields(detail.fields_json);
        setConfigType(detail.type);
        setName(detail.name);
        setCompanyIds(detail.company_ids);
        setFields(parsedFields);
      } catch {
        if (!cancelled) {
          message.error(originalT("admin_credit_configs.messages.fetchFailed"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPageData();

    return () => {
      cancelled = true;
    };
  }, [id, isNew, navigate, originalT]);

  const handleSave = async () => {
    if (configType === "custom" && !name.trim()) {
      message.error(t("validation.nameRequired"));
      return;
    }
    if (
      configType === "custom" &&
      isNameTaken(name, configs, isNew ? undefined : Number(id))
    ) {
      message.error(t("validation.nameExists"));
      return;
    }

    const validationError = validateCreditConfigFields(
      fields,
      configType === "custom",
    );
    if (validationError) {
      message.error(validationError);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        fields_json: stringifyCreditConfigFields(fields),
        company_ids: configType === "custom" ? companyIds : [],
      };
      const response = isNew
        ? await Post<{ id: number }>("/api/admin/credit_configs", payload)
        : await Post<{ id: number }>(
            `/api/admin/credit_configs/${id}`,
            payload,
          );

      if (response.code === 0) {
        message.success(t("messages.saveSuccess"));
        navigate("/admin/credit-configs");
      } else {
        message.error(t("messages.saveFailed"));
      }
    } catch {
      message.error(t("messages.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/credit-configs");
  };

  return (
    <div className={styles.editPage}>
      <div className={styles.editHeader}>
        <div className={styles.breadcrumbBlock}>
          <Breadcrumb
            items={[
              {
                title: <Link to="/admin/credit-configs">{t("pageTitle")}</Link>,
              },
              { title: isNew ? t("newPageTitle") : name || t("editPageTitle") },
            ]}
          />
          <div className={styles.pageTitle}>
            {isNew ? t("newPageTitle") : `${t("editPageTitle")}: ${name}`}
          </div>
        </div>
        <Space>
          <Button onClick={handleCancel}>{t("actions.cancel")}</Button>
          <Button
            type="primary"
            loading={saving || loading}
            onClick={handleSave}
          >
            {t("actions.save")}
          </Button>
        </Space>
      </div>

      <div className={styles.editScroll}>
        <Spin spinning={loading}>
          <ConfigEditForm
            isCustom={configType === "custom"}
            name={name}
            companyIds={companyIds}
            fields={fields}
            defaultFields={defaultFields}
            companyOptions={companyOptions}
            onNameChange={setName}
            onCompanyIdsChange={setCompanyIds}
            onFieldsChange={setFields}
          />
        </Spin>
      </div>
    </div>
  );
};

export default CreditConfigEditPage;
