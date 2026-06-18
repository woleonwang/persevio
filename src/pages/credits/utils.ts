import dayjs from "dayjs";
import type { ICreditPackage } from "./types";

export const TRANSACTION_PAGE_SIZE = 10;
export const VALID_CREDITS_PAGE_SIZE = 10;

export function formatCreditsAmount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatSignedCreditsAmount(value: number, direction: string) {
  const prefix = direction === "increase" ? "+" : "-";
  return `${prefix}${formatCreditsAmount(value)}`;
}

export function formatTransactionTime(value: string) {
  return dayjs(value).format("MMMM D, YYYY [at] h:mm A");
}

export function formatLongDate(value: string | null | undefined) {
  if (!value) {
    return "No expiry";
  }
  return dayjs(value).format("MMMM D, YYYY");
}

export function formatEquivalentSgd(available: number, displayRate: number) {
  return (available / displayRate).toFixed(2);
}

export function getPackageStatus(pkg: ICreditPackage, now = dayjs()) {
  if (pkg.remaining_amount <= 0) {
    return null;
  }
  if (pkg.valid_from && dayjs(pkg.valid_from).isAfter(now)) {
    return "upcoming" as const;
  }
  if (pkg.expires_at && dayjs(pkg.expires_at).isBefore(now)) {
    return null;
  }
  return "active" as const;
}

export function summarizePackages(packages: ICreditPackage[]) {
  const now = dayjs();
  let available = 0;
  let total = 0;
  let unavailable = 0;
  let expiringAmount = 0;
  let awaitingActivation = 0;
  let nearestExpiry: dayjs.Dayjs | null = null;

  for (const pkg of packages) {
    const effective = effectiveRemaining(pkg, now);
    total += effective;
    if (pkg.remaining_amount > 0 && pkg.valid_from && dayjs(pkg.valid_from).isAfter(now)) {
      awaitingActivation += pkg.remaining_amount;
    }
    if (isPackageAvailable(pkg, now)) {
      available += pkg.remaining_amount;
      if (pkg.expires_at) {
        const expiresAt = dayjs(pkg.expires_at);
        const daysUntilExpiry = expiresAt.diff(now, "day");
        if (daysUntilExpiry >= 0 && daysUntilExpiry <= EXPIRING_WINDOW_DAYS) {
          expiringAmount += pkg.remaining_amount;
          if (!nearestExpiry || expiresAt.isBefore(nearestExpiry)) {
            nearestExpiry = expiresAt;
          }
        }
      }
    }
  }

  unavailable = Math.max(total - available, 0);

  return {
    available,
    total,
    unavailable,
    expiringAmount,
    awaitingActivation,
    nearestExpiry,
  };
}

export function getValidCreditPackages(packages: ICreditPackage[]) {
  return packages.filter(
    (pkg) => pkg.remaining_amount > 0 && getPackageStatus(pkg),
  );
}

export function formatSourceLabel(sourceType: string) {
  if (!sourceType) {
    return "—";
  }
  return sourceType.charAt(0).toUpperCase() + sourceType.slice(1);
}

const EXPIRING_WINDOW_DAYS = 30;

function effectiveRemaining(pkg: ICreditPackage, now = dayjs()) {
  if (pkg.remaining_amount <= 0) {
    return 0;
  }
  if (pkg.expires_at && dayjs(pkg.expires_at).isBefore(now)) {
    return 0;
  }
  return pkg.remaining_amount;
}

function isPackageAvailable(pkg: ICreditPackage, now = dayjs()) {
  if (pkg.remaining_amount <= 0) {
    return false;
  }
  if (pkg.valid_from && dayjs(pkg.valid_from).isAfter(now)) {
    return false;
  }
  if (pkg.expires_at && dayjs(pkg.expires_at).isBefore(now)) {
    return false;
  }
  return true;
}
