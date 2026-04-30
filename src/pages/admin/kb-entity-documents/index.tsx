import { Get } from "@/utils/request";
import { Button, Drawer, message, Table, Tabs } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import MarkdownContainer from "@/components/MarkdownContainer";
import styles from "../style.module.less";
import pageStyles from "./style.module.less";

const KBEntityDocuments = () => {
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`admin_kb_entity_documents.${key}`);

  const [entityDocuments, setEntityDocuments] = useState<IKBEntityDocumentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEntityDocument, setSelectedEntityDocument] = useState<IKBEntityDocument>();
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchEntityDocuments();
  }, []);

  const fetchEntityDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const { code, data } = await Get<{
        entity_documents: IKBEntityDocumentListItem[];
      }>("/api/admin/kb/entity_documents");
      if (code === 0) {
        setEntityDocuments(data.entity_documents);
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
    setSelectedEntityDocument(undefined);
    try {
      const { code, data } = await Get<{ entity_document: IKBEntityDocument }>(
        `/api/admin/kb/entity_documents/${id}`,
      );
      if (code === 0) {
        setSelectedEntityDocument(data.entity_document);
      } else {
        message.error(t("messages.fetchDetailFailed"));
      }
    } catch {
      message.error(t("messages.fetchDetailFailed"));
    } finally {
      setDetailLoading(false);
    }
  };

  const columns: ColumnsType<IKBEntityDocumentListItem> = [
    { title: t("table.id"), dataIndex: "id", width: 80 },
    { title: t("table.companyId"), dataIndex: "company_id", width: 120 },
    { title: t("table.entityType"), dataIndex: "entity_type", width: 150 },
    { title: t("table.entityId"), dataIndex: "entity_id", width: 120 },
    {
      title: t("table.createdAt"),
      dataIndex: "created_at",
      width: 180,
      render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: t("table.updatedAt"),
      dataIndex: "updated_at",
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

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminPageHeader}>{t("pageTitle")}</div>
      <div className={styles.adminMain}>
        <Table<IKBEntityDocumentListItem>
          loading={loading}
          rowKey="id"
          dataSource={entityDocuments}
          columns={columns}
          scroll={{ x: 1000, y: "100%" }}
          pagination={{ showSizeChanger: false }}
        />
      </div>
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={1040}
        title={`${t("drawer.titlePrefix")} #${selectedEntityDocument?.id ?? ""}`}
        destroyOnClose
      >
        <Tabs
          items={[
            {
              key: "claim",
              label: t("tabs.claim"),
              children: (
                <div className={pageStyles.markdownWrap}>
                  <MarkdownContainer content={selectedEntityDocument?.claim_md ?? ""} />
                </div>
              ),
            },
            {
              key: "frontmatter",
              label: t("tabs.frontmatter"),
              children: (
                <div className={pageStyles.markdownWrap}>
                  <MarkdownContainer
                    content={
                      selectedEntityDocument?.yaml_frontmatter
                        ? `\`\`\`yaml\n${selectedEntityDocument.yaml_frontmatter}\n\`\`\``
                        : ""
                    }
                  />
                </div>
              ),
            },
            {
              key: "narrative",
              label: t("tabs.narrative"),
              children: (
                <div className={pageStyles.markdownWrap}>
                  <MarkdownContainer content={selectedEntityDocument?.narrative_md ?? ""} />
                </div>
              ),
            },
          ]}
        />
        {detailLoading && <div className={pageStyles.loadingMask}>{t("loading")}</div>}
      </Drawer>
    </div>
  );
};

export default KBEntityDocuments;
