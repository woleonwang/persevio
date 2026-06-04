import dayjs from "dayjs";

export const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 1).toUpperCase();
};

export const formatLastUpdated = (
  dateStr: string,
  options: { withTime?: boolean } = {},
) => {
  const { withTime = false } = options;
  return dayjs(dateStr).format(
    withTime ? "MMM DD, YYYY HH:mm:ss" : "MMM DD, YYYY",
  );
};
