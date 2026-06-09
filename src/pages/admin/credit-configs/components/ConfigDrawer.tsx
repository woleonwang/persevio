import { DeleteOutlined, EditOutlined, CopyOutlined } from "@ant-design/icons";
import {
  Button,
  Descriptions,
  Drawer,
  Popconfirm,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Delete, Get } from "@/utils/request";
import { CREDIT_CONFIG_SERVICE_KEYS } from "../constants";
import type { ICreditConfig, ICreditConfigAuditLog } from "../types";
import {
  buildHistoryChangeItems,
  formatValidityLabel,
  getDefaultFields,
  getResolvedFields,
  parseCreditConfigFields,
} from "../utils";
import styles from "../style.module.less";

type ConfigDrawerProps = {
  open: boolean;
  config: ICreditConfig | null;
  configs: ICreditConfig[];
  companyMap: Record<number, string>;
  staffNameMap: Record<number, string>;
  onClose: () => void;
  onDuplicate: (config: ICreditConfig) => void;
  onDeleted: () => void;
};

const ConfigDrawer = ({
  open,
  config,
  configs,
  companyMap,
  staffNameMap,
  onClose,
  onDuplicate,
  onDeleted,
}: ConfigDrawerProps) => {
  const { t: originalT } = useTranslation();
  const t = (key: string, options?: Record<string, unknown>) =>
    originalT(`admin_credit_configs.${key}`, options);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("configuration");
  const [history, setHistory] = useState<ICreditConfigAuditLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const defaultFields = useMemo(() => getDefaultFields(configs), [configs]);

  useEffect(() => {
    if (!open || !config) {
      return;
    }
    setActiveTab("configuration");
    fetchHistory(config.id);
  }, [open, config?.id]);

  const fetchHistory = async (configId: number) => {
    setHistoryLoading(true);
    try {
      const { code, data } = await Get<{ history: ICreditConfigAuditLog[] }>(
        `/api/admin/credit_configs/${configId}/history`,
      );
      if (code === 0) {
        setHistory(data.history);
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  if (!config) {
    return null;
  }

  const fields = parseCreditConfigFields(config.fields_json);
  const resolvedFields = getResolvedFields(config, defaultFields);
  const isCustom = config.type === "custom";

  const renderFieldTag = (inherit: boolean) => {
    if (!isCustom) {
      return null;
    }
    return (
      <Tag className={inherit ? styles.inheritTag : styles.overrideTag}>
        {inherit ? t("inherit") : t("override")}
      </Tag>
    );
  };

  const renderRateRow = (label: string, fieldKey: "display_rate" | "topup_rate") => {
    const field = fields[fieldKey];
    const resolved = resolvedFields[fieldKey];
    return (
      <div className={styles.kvRow} key={fieldKey}>
        <div className={styles.kvLabel}>{label}</div>
        <div className={field.inherit && isCustom ? styles.inheritedValue : undefined}>
          {resolved.value ?? "—"}
        </div>
        {renderFieldTag(field.inherit)}
      </div>
    );
  };

  const configurationTab = (
    <div className={styles.drawerSections}>
      <section>
        <div className={styles.sectionTitle}>{t("sections.metadata")}</div>
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label={t("fields.name")}>{config.name}</Descriptions.Item>
          <Descriptions.Item label={t("fields.type")}>
            <Tag>{config.type === "default" ? t("defaultType") : t("customType")}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t("fields.currency")}>{config.currency}</Descriptions.Item>
          <Descriptions.Item label={t("fields.appliedEmployers")}>
            {isCustom
              ? config.company_ids.map((id) => companyMap[id] ?? `#${id}`).join(", ") || "—"
              : t("defaultAppliedHint")}
          </Descriptions.Item>
        </Descriptions>
      </section>

      <section>
        <div className={styles.sectionTitle}>{t("sections.exchangeRates")}</div>
        {renderRateRow(t("fields.displayRate"), "display_rate")}
        {renderRateRow(t("fields.topupRate"), "topup_rate")}
      </section>

      <section>
        <div className={styles.sectionTitle}>{t("sections.topupDefaults")}</div>
        <div className={styles.kvRow}>
          <div className={styles.kvLabel}>{t("fields.topupValidity")}</div>
          <div
            className={
              fields.topup_credit_validity.inherit && isCustom ? styles.inheritedValue : undefined
            }
          >
            {formatValidityLabel(resolvedFields.topup_credit_validity, t)}
          </div>
          {renderFieldTag(fields.topup_credit_validity.inherit)}
        </div>
      </section>

      <section>
        <div className={styles.sectionTitle}>{t("sections.pricing")}</div>
        <Table
          size="small"
          pagination={false}
          rowKey="key"
          dataSource={CREDIT_CONFIG_SERVICE_KEYS.map((key) => ({
            key,
            label: t(`services.${key}`),
            field: fields.pricing[key],
            resolved: resolvedFields.pricing[key],
          }))}
          columns={[
            { title: t("fields.service"), dataIndex: "label" },
            {
              title: t("fields.credits"),
              dataIndex: "resolved",
              render: (value, record) => (
                <span className={record.field.inherit && isCustom ? styles.inheritedValue : undefined}>
                  {value.value ?? "—"}
                </span>
              ),
            },
            {
              title: "",
              dataIndex: "field",
              width: 120,
              render: (field) => renderFieldTag(field.inherit),
            },
          ]}
        />
      </section>
    </div>
  );

  const historyTab = (
    <div className={styles.historyList}>
      {history.map((item) => (
        <div key={item.id} className={styles.historyEntry}>
          <div className={styles.historyMeta}>
            <span>{dayjs(item.created_at).format("YYYY-MM-DD HH:mm")}</span>
            <span>{staffNameMap[item.staff_id] ?? `#${item.staff_id}`}</span>
            <Tag>{item.log_type}</Tag>
          </div>
          {item.remark ? <Typography.Text type="secondary">{item.remark}</Typography.Text> : null}
          <ul>
            {buildHistoryChangeItems(item, t).map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        </div>
      ))}
      {!historyLoading && history.length === 0 ? (
        <Typography.Text type="secondary">{t("history.empty")}</Typography.Text>
      ) : null}
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={600}
      destroyOnClose
      title={
        <div>
          <div className={styles.drawerTitle}>{config.name}</div>
          <div className={styles.drawerSubtitle}>
            {config.type === "default" ? t("defaultType") : t("customType")} · {config.currency}
          </div>
        </div>
      }
      extra={
        <Space>
          <Button icon={<EditOutlined />} onClick={() => navigate(`/admin/credit-configs/${config.id}/edit`)}>
            {t("actions.edit")}
          </Button>
          <Button icon={<CopyOutlined />} onClick={() => onDuplicate(config)}>
            {t("actions.duplicate")}
          </Button>
          {config.type === "custom" ? (
            <Popconfirm
              title={t("deleteConfirm")}
              onConfirm={async () => {
                const { code, message: errMsg } = await Delete(`/api/admin/credit_configs/${config.id}`);
                if (code === 0) {
                  onDeleted();
                  onClose();
                } else {
                  message.error(errMsg || t("messages.deleteFailed"));
                }
              }}
            >
              <Button danger icon={<DeleteOutlined />}>
                {t("actions.delete")}
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: "configuration", label: t("tabs.configuration"), children: configurationTab },
          {
            key: "history",
            label: t("tabs.history"),
            children: historyLoading ? <Typography.Text>{t("loading")}</Typography.Text> : historyTab,
          },
        ]}
      />
    </Drawer>
  );
};

export default ConfigDrawer;
