import dayjs from "dayjs";

export const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 1).toUpperCase();
};

export const formatLastUpdated = (dateStr?: string) => {
  if (!dateStr) return null;
  return dayjs(dateStr).format("MMM DD, YYYY");
};

export const isStageMoveTargetLocked = (stageName: string) => {
  const n = stageName.trim().toLowerCase();
  if (n === "applied") return true;
  if (n === "rejected") return true;
  if (n.includes("started") && n.includes("ai interview")) return true;
  if (n.includes("ai interview") && n.includes("completed")) return true;
  return false;
};

export const portalGetPopupContainer = () => document.body;
