import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import globalStore from "@/store/global";
import { Get } from "@/utils/request";
import CreditsOverview from "./components/CreditsOverview";
import type {
  ICreditConfigFields,
  ICreditPackage,
  ICreditTransaction,
} from "./types";
import styles from "./style.module.less";

const CreditsPage = () => {
  const { staffRole } = globalStore;
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<ICreditPackage[]>([]);
  const [transactions, setTransactions] = useState<ICreditTransaction[]>([]);
  const [displayRate, setDisplayRate] = useState<number | null>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      setLoading(true);
      const [packagesRes, transactionsRes, configRes] = await Promise.all([
        Get<{ packages: ICreditPackage[] }>("/api/credits/packages"),
        Get<{ transactions: ICreditTransaction[] }>(
          "/api/credits/transactions",
        ),
        Get<ICreditConfigFields>("/api/credits/config"),
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
  }, []);

  if (staffRole && staffRole !== "admin") {
    return <Navigate to="/app/jobs" replace />;
  }

  return (
    <div className={styles.page}>
      <section className={styles.creditsPage} aria-label="Credits">
        <CreditsOverview
          loading={loading}
          packages={packages}
          transactions={transactions}
          displayRate={displayRate}
        />
      </section>
    </div>
  );
};

export default observer(CreditsPage);
