import { Get } from "@/utils/request";
import { Card, Descriptions, Empty, message, Skeleton, Typography } from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";

import styles from "./style.module.less";

type TEmail = {
  id: number;
  target_type: string;
  target_id: number | null;
  provider: string;
  message_id: string;
  recipient: string;
  sender: string;
  from: string;
  subject: string;
  body_plain: string;
  body_html: string;
  attachments_meta_json: string;
  raw_payload_json: string;
  parse_result_json: string;
  parse_status: string;
  parse_fail_reason: string;
  created_at: string;
  updated_at: string;
};

const EmailDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [email, setEmail] = useState<TEmail | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchEmail = useCallback(async () => {
    if (!id) {
      message.error("Missing email id");
      return;
    }

    setLoading(true);
    try {
      const { code, data } = await Get<{ email: TEmail }>(`/api/admin/emails/${id}`);
      if (code === 0) {
        setEmail(data.email);
      } else {
        message.error("Failed to fetch email details");
      }
    } catch {
      message.error("Failed to fetch email details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEmail();
  }, [fetchEmail]);

  if (loading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  if (!email) {
    return <Empty description="No email details found" />;
  }

  return (
    <div className={styles.container}>
      <Typography.Title level={3} className={styles.pageTitle}>
        Email #{email.id}
      </Typography.Title>

      <Card title="Metadata">
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="ID">{email.id}</Descriptions.Item>
          <Descriptions.Item label="Provider">{email.provider || "-"}</Descriptions.Item>
          <Descriptions.Item label="Target Type">
            {email.target_type || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Target ID">
            {email.target_id ?? "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Message ID" span={2}>
            {email.message_id || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Recipient">{email.recipient || "-"}</Descriptions.Item>
          <Descriptions.Item label="Sender">{email.sender || "-"}</Descriptions.Item>
          <Descriptions.Item label="From" span={2}>
            {email.from || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Subject" span={2}>
            {email.subject || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Parse Status">
            {email.parse_status || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Parse Fail Reason">
            {email.parse_fail_reason || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {email.created_at ? dayjs(email.created_at).format("YYYY-MM-DD HH:mm:ss") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Updated At">
            {email.updated_at ? dayjs(email.updated_at).format("YYYY-MM-DD HH:mm:ss") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Attachments Meta JSON" span={2}>
            <Typography.Paragraph className={styles.jsonContent}>
              {email.attachments_meta_json || "-"}
            </Typography.Paragraph>
          </Descriptions.Item>
          <Descriptions.Item label="Parse Result JSON" span={2}>
            <Typography.Paragraph className={styles.jsonContent}>
              {email.parse_result_json || "-"}
            </Typography.Paragraph>
          </Descriptions.Item>
          <Descriptions.Item label="Raw Payload JSON" span={2}>
            <Typography.Paragraph className={styles.jsonContent}>
              {email.raw_payload_json || "-"}
            </Typography.Paragraph>
          </Descriptions.Item>
          <Descriptions.Item label="Body Plain" span={2}>
            <Typography.Paragraph className={styles.plainBody}>
              {email.body_plain || "-"}
            </Typography.Paragraph>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Body HTML" className={styles.htmlCard}>
        {email.body_html ? (
          <div
            className={styles.bodyHtml}
            dangerouslySetInnerHTML={{ __html: email.body_html }}
          />
        ) : (
          <Empty description="No HTML content" />
        )}
      </Card>
    </div>
  );
};

export default EmailDetailsPage;
