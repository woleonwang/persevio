import CreditsOverview from "@/pages/credits/components/CreditsOverview";
import type {
  ICreditConfigFields,
  ICreditPackage,
  ICreditTransaction,
} from "@/pages/credits/types";
import { Get } from "@/utils/request";
import { Drawer } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./style.module.less";

type CompanyCreditsDrawerProps = {
  open: boolean;
  companyId: number | null;
  companyName: string;
  onClose: () => void;
};

export default function CompanyCreditsDrawer({
  open,
  companyId,
  companyName,
  onClose,
}: CompanyCreditsDrawerProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<ICreditPackage[]>([]);
  const [transactions, setTransactions] = useState<ICreditTransaction[]>([]);
  const [displayRate, setDisplayRate] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !companyId) {
      return;
    }

    const fetchCredits = async () => {
      setLoading(true);
      const [packagesRes, transactionsRes, configRes] = await Promise.all([
        Get<{ packages: ICreditPackage[] }>(
          `/api/admin/companies/${companyId}/credits/packages`,
        ),
        Get<{ transactions: ICreditTransaction[] }>(
          `/api/admin/companies/${companyId}/credits/transactions`,
        ),
        Get<ICreditConfigFields>(
          `/api/admin/companies/${companyId}/credits/config`,
        ),
      ]);
      setLoading(false);
      if (packagesRes.code === 0) {
        setPackages(packagesRes.data?.packages ?? []);
      }
      if (transactionsRes.code === 0) {
        setTransactions(transactionsRes.data?.transactions ?? []);
      }
      if (configRes.code === 0) {
        const rate = configRes.data?.display_rate?.value;
        setDisplayRate(rate && rate > 0 ? rate : null);
      }
    };

    fetchCredits();
  }, [open, companyId]);

  return (
    <Drawer
      className={styles.drawer}
      title={t("admin_companies.creditsDrawer.title", { name: companyName })}
      width={760}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {companyId ? (
        <CreditsOverview
          loading={loading}
          packages={packages}
          transactions={transactions}
          displayRate={displayRate}
          showPageTitle={false}
        />
      ) : null}
    </Drawer>
  );
}
