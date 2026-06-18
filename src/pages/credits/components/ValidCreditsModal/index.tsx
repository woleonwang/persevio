import InfoIcon from "@/assets/icons/info";
import { Modal, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import type { ICreditPackage } from "../../types";
import {
  VALID_CREDITS_PAGE_SIZE,
  formatCreditsAmount,
  formatLongDate,
  getPackageStatus,
  getValidCreditPackages,
} from "../../utils";
import styles from "./style.module.less";

type ValidCreditsModalProps = {
  open: boolean;
  packages: ICreditPackage[];
  onClose: () => void;
};

export default function ValidCreditsModal({
  open,
  packages,
  onClose,
}: ValidCreditsModalProps) {
  const [page, setPage] = useState(1);

  const rows = useMemo(() => getValidCreditPackages(packages), [packages]);

  const columns: ColumnsType<ICreditPackage> = useMemo(
    () => [
      {
        title: "Received",
        dataIndex: "created_at",
        key: "received",
        width: 145,
        sorter: (left, right) =>
          dayjs(left.created_at).valueOf() - dayjs(right.created_at).valueOf(),
        render: (value: string) => formatLongDate(value),
      },
      {
        title: (
          <span className={styles.expiresHeader}>
            Expires
            <Tooltip title="Credits are valid through this date (inclusive)">
              <span className={styles.headerInfo} aria-hidden="true">
                <InfoIcon />
              </span>
            </Tooltip>
          </span>
        ),
        dataIndex: "expires_at",
        key: "expires",
        width: 170,
        defaultSortOrder: "ascend",
        sorter: (left, right) => {
          const leftTime = left.expires_at
            ? dayjs(left.expires_at).valueOf()
            : Number.MAX_SAFE_INTEGER;
          const rightTime = right.expires_at
            ? dayjs(right.expires_at).valueOf()
            : Number.MAX_SAFE_INTEGER;
          return leftTime - rightTime;
        },
        render: (value?: string | null) => formatLongDate(value),
      },
      {
        title: "Status",
        dataIndex: "id",
        key: "status",
        width: 123,
        render: (_value, pkg) => {
          const status = getPackageStatus(pkg);
          if (status === "active") {
            return (
              <span className={`${styles.status} ${styles.statusActive}`}>
                Active
              </span>
            );
          }
          return (
            <span className={`${styles.status} ${styles.statusUpcoming}`}>
              Upcoming
              {pkg.valid_from ? (
                <Tooltip title={`Valid from ${formatLongDate(pkg.valid_from)}`}>
                  <span className={styles.statusInfo} aria-hidden="true">
                    <InfoIcon />
                  </span>
                </Tooltip>
              ) : null}
            </span>
          );
        },
      },
      {
        title: "Description",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
        render: (description?: string) => description || "—",
      },
      {
        title: "Original",
        dataIndex: "original_amount",
        key: "original",
        width: 97,
        render: (value: number) => formatCreditsAmount(value),
      },
      {
        title: "Remaining",
        dataIndex: "remaining_amount",
        key: "remaining",
        width: 120,
        render: (value: number) => formatCreditsAmount(value),
      },
    ],
    [],
  );

  return (
    <Modal
      title="Valid Credits"
      open={open}
      onCancel={onClose}
      footer={null}
      width={990}
      destroyOnClose
      className={styles.modalWrap}
    >
      <Table<ICreditPackage>
        className={styles.table}
        rowKey="id"
        columns={columns}
        dataSource={rows}
        scroll={{ x: 943, y: 564 }}
        pagination={{
          current: page,
          pageSize: VALID_CREDITS_PAGE_SIZE,
          total: rows.length,
          showSizeChanger: false,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
          onChange: (nextPage) => setPage(nextPage),
        }}
        locale={{ emptyText: "No data" }}
      />
    </Modal>
  );
}
