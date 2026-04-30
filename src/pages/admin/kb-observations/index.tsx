import { Get } from "@/utils/request";
import { Button, Drawer, message, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import MarkdownContainer from "@/components/MarkdownContainer";
import styles from "../style.module.less";
import pageStyles from "./style.module.less";

const KBObservations = () => {
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`admin_kb_observations.${key}`);

  const [observations, setObservations] = useState<IKBObservationListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState<IKBObservation>();
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchObservations();
  }, []);

  const fetchObservations = useCallback(async () => {
    setLoading(true);
    try {
      const { code, data } = await Get<{ observations: IKBObservationListItem[] }>(
        "/api/admin/kb/observations",
      );
      if (code === 0) {
        setObservations(data.observations);
      } else {
        message.error(t("messages.fetchListFailed"));
      }
    } catch {
      message.error(t("messages.fetchListFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleOpenDetail = async (id: number) => {
    setDrawerOpen(true);
    setDetailLoading(true);
    setSelectedObservation(undefined);
    try {
      const { code, data } = await Get<{ observation: IKBObservation }>(
        `/api/admin/kb/observations/${id}`,
      );
      if (code === 0) {
        setSelectedObservation(data.observation);
      } else {
        message.error(t("messages.fetchDetailFailed"));
      }
    } catch {
      message.error(t("messages.fetchDetailFailed"));
    } finally {
      setDetailLoading(false);
    }
  };

  const columns: ColumnsType<IKBObservationListItem> = [
    { title: t("table.id"), dataIndex: "id", width: 80 },
    { title: t("table.companyId"), dataIndex: "company_id", width: 120 },
    { title: t("table.chatId"), dataIndex: "chat_id", width: 120 },
    { title: t("table.entityType"), dataIndex: "entity_type", width: 150 },
    { title: t("table.entityId"), dataIndex: "entity_id", width: 120 },
    {
      title: t("table.createdAt"),
      dataIndex: "created_at",
      width: 180,
      render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: t("table.actions"),
      dataIndex: "actions",
      width: 120,
      render: (_, record) => (
        <Button type="link" onClick={() => handleOpenDetail(record.id)}>
          {t("table.view")}
        </Button>
      ),
    },
  ];

  const formattedContent = (() => {
    const rawContent = selectedObservation?.content ?? "";
    if (!rawContent) {
      return "";
    }

    try {
      const parsed = JSON.parse(rawContent);
      return `\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
    } catch {
      return rawContent;
    }
  })();

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminPageHeader}>{t("pageTitle")}</div>
      <div className={styles.adminMain}>
        <Table<IKBObservationListItem>
          loading={loading}
          rowKey="id"
          dataSource={observations}
          columns={columns}
          scroll={{ x: 900, y: "100%" }}
          pagination={{ showSizeChanger: false }}
        />
      </div>
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={960}
        title={`${t("drawer.titlePrefix")} #${selectedObservation?.id ?? ""}`}
        destroyOnClose
      >
        <div className={pageStyles.markdownWrap}>
          <MarkdownContainer content={formattedContent} />
        </div>
        {detailLoading && <div>{t("loading")}</div>}
      </Drawer>
    </div>
  );
};

export default KBObservations;
