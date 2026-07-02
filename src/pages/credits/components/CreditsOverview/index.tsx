import InfoIcon from "@/assets/icons/info";
import Right from "@/assets/icons/right";
import { Select, Spin, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ValidCreditsModal from "../ValidCreditsModal";
import type {
  ICreditTransaction,
  TransactionDirectionFilter,
  TransactionSourceFilter,
} from "../../types";
import {
  TRANSACTION_PAGE_SIZE,
  formatCreditsAmount,
  formatEquivalentSgd,
  formatSignedCreditsAmount,
  formatSourceLabel,
  formatTransactionTime,
  summarizePackages,
} from "../../utils";
import type { ICreditPackage } from "../../types";
import styles from "./style.module.less";

const SOURCE_OPTIONS: TransactionSourceFilter[] = [
  "all",
  "topup",
  "gift",
  "adjustment",
  "usage",
];

const TYPE_OPTIONS: TransactionDirectionFilter[] = [
  "all",
  "increase",
  "decrease",
];

function SourcePill({ sourceType }: { sourceType: string }) {
  const normalized = sourceType.toLowerCase();
  const className = [
    styles.pill,
    normalized === "topup" ? styles.pillTopup : "",
    normalized === "gift" ? styles.pillGift : "",
    normalized === "adjustment" ? styles.pillAdjustment : "",
    normalized === "usage" ? styles.pillUsage : "",
    normalized === "expired" ? styles.pillExpired : "",
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={className}>{formatSourceLabel(sourceType)}</span>;
}

type CreditsOverviewProps = {
  loading: boolean;
  packages: ICreditPackage[];
  transactions: ICreditTransaction[];
  displayRate: number | null;
  showPageTitle?: boolean;
};

export default function CreditsOverview({
  loading,
  packages,
  transactions,
  displayRate,
  showPageTitle = true,
}: CreditsOverviewProps) {
  const { t } = useTranslation();
  const [typeFilter, setTypeFilter] =
    useState<TransactionDirectionFilter>("all");
  const [sourceFilter, setSourceFilter] =
    useState<TransactionSourceFilter>("all");
  const [transactionPage, setTransactionPage] = useState(1);
  const [validCreditsOpen, setValidCreditsOpen] = useState(false);

  const summary = summarizePackages(packages);

  const filteredTransactions = transactions.filter((transaction) => {
    if (typeFilter !== "all" && transaction.direction !== typeFilter) {
      return false;
    }
    if (sourceFilter !== "all" && transaction.source_type !== sourceFilter) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    setTransactionPage(1);
  }, [typeFilter, sourceFilter]);

  const transactionColumns: ColumnsType<ICreditTransaction> = [
    {
      title: t("credits.columnTime"),
      dataIndex: "created_at",
      key: "time",
      ellipsis: true,
      render: (value: string) => formatTransactionTime(value),
    },
    {
      title: t("credits.columnType"),
      dataIndex: "direction",
      key: "type",
      width: 112,
      render: (direction: string) => {
        const isIncoming = direction === "increase";
        return (
          <span
            className={`${styles.transactionType} ${isIncoming ? styles.transactionTypeIncoming : ""}`}
          >
            {isIncoming
              ? t("credits.typeIncoming")
              : t("credits.typeOutgoing")}
          </span>
        );
      },
    },
    {
      title: t("credits.columnSource"),
      dataIndex: "source_type",
      key: "source",
      width: 126,
      render: (sourceType: string) => <SourcePill sourceType={sourceType} />,
    },
    {
      title: t("credits.columnAmount"),
      dataIndex: "amount",
      key: "amount",
      width: 112,
      render: (amount: number, record) => (
        <span
          className={
            record.direction === "increase" ? styles.positive : undefined
          }
        >
          {formatSignedCreditsAmount(amount, record.direction)}
        </span>
      ),
    },
    {
      title: t("credits.columnDescription"),
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (description?: string) => {
        const text = description || "—";
        return (
          <Tooltip title={description || undefined}>
            <span className={styles.descriptionCell}>{text}</span>
          </Tooltip>
        );
      },
    },
    {
      title: t("credits.columnTotalAfter"),
      dataIndex: "total_after",
      key: "total_after",
      width: 118,
      render: (value: number) => formatCreditsAmount(value),
    },
  ];

  const expiringSoon =
    summary.expiringAmount > 0 && summary.nearestExpiry !== null;

  return (
    <Spin spinning={loading}>
      <div className={styles.creditsBody}>
        {showPageTitle ? (
          <header className={styles.creditsHeader}>
            <h1>{t("credits.pageTitle")}</h1>
          </header>
        ) : null}

        <section className={styles.creditsCard}>
          <div className={styles.creditsCopy}>
            <p>{t("credits.availableCredits")}</p>
            <h2>{formatCreditsAmount(summary.available)}</h2>
            <div className={styles.equiv}>
              {displayRate ? (
                <>
                  {t("credits.equivalentTo", {
                    amount: formatEquivalentSgd(summary.available, displayRate),
                  })}
                  <Tooltip title={`$1 = ${displayRate} Credits`}>
                    <span className={styles.infoIcon} aria-hidden="true">
                      <InfoIcon />
                    </span>
                  </Tooltip>
                </>
              ) : null}
            </div>
            <div className={styles.creditLine} />
            <div className={styles.creditMeta}>
              {summary.unavailable > 0 ? (
                <span className={styles.creditUnavailable}>
                  {t("credits.unavailableLabel")}:{" "}
                  <b>{formatCreditsAmount(summary.unavailable)}</b>
                  {summary.awaitingActivation > 0 ? (
                    <Tooltip
                      title={t("credits.awaitingActivationTooltip", {
                        amount: formatCreditsAmount(
                          summary.awaitingActivation,
                        ),
                      })}
                    >
                      <span
                        className={`${styles.infoIcon} ${styles.infoIconBottom}`}
                        aria-hidden="true"
                      >
                        <InfoIcon />
                      </span>
                    </Tooltip>
                  ) : null}
                </span>
              ) : null}
              <button
                type="button"
                className={styles.creditExpiring}
                onClick={() => setValidCreditsOpen(true)}
                aria-label={t("credits.viewExpiringCredits")}
              >
                {expiringSoon ? (
                  <>
                    <span>
                      {t("credits.expiringLabel")}:{" "}
                      <b>
                        {formatCreditsAmount(summary.expiringAmount)} on{" "}
                        {summary.nearestExpiry!.format("MMMM D, YYYY")}
                      </b>
                    </span>
                    <span
                      className={styles.creditExpiringIcon}
                      aria-hidden="true"
                    >
                      <Right />
                    </span>
                  </>
                ) : (
                  <>
                    <span>{t("credits.noCreditsExpiring")}</span>
                    <span
                      className={styles.creditExpiringIcon}
                      aria-hidden="true"
                    >
                      <Right />
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        <section className={styles.historyHead}>
          <h2>{t("credits.transactionHistory")}</h2>
          <div className={styles.filters}>
            <label className={styles.filterLabel}>
              {t("credits.filterType")}
              <Select
                value={typeFilter}
                style={{ width: 130 }}
                options={TYPE_OPTIONS.map((option) => ({
                  value: option,
                  label:
                    option === "all"
                      ? t("credits.filterAll")
                      : option === "increase"
                        ? t("credits.typeIncoming")
                        : t("credits.typeOutgoing"),
                }))}
                onChange={(value) => setTypeFilter(value)}
              />
            </label>
            <label className={styles.filterLabel}>
              {t("credits.filterSource")}
              <Select
                value={sourceFilter}
                style={{ width: 130 }}
                options={SOURCE_OPTIONS.map((option) => ({
                  value: option,
                  label:
                    option === "all"
                      ? t("credits.filterAll")
                      : formatSourceLabel(option),
                }))}
                onChange={(value) => setSourceFilter(value)}
              />
            </label>
          </div>
        </section>

        <div className={styles.tableWrap}>
          <Table<ICreditTransaction>
            className={styles.transactionTable}
            tableLayout="fixed"
            rowKey={(record) => record.uuid || String(record.id)}
            columns={transactionColumns}
            dataSource={filteredTransactions}
            pagination={{
              current: transactionPage,
              pageSize: TRANSACTION_PAGE_SIZE,
              total: filteredTransactions.length,
              showSizeChanger: false,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
              onChange: (page) => setTransactionPage(page),
            }}
            locale={{ emptyText: t("credits.noData") }}
            scroll={{ x: 700 }}
          />
        </div>
      </div>

      <ValidCreditsModal
        open={validCreditsOpen}
        packages={packages}
        onClose={() => setValidCreditsOpen(false)}
      />
    </Spin>
  );
}
