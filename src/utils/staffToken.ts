import { Post } from "@/utils/request";
import { tokenStorage } from "@/utils/storage";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type TRefreshTokenResponse = {
  token?: string;
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json = atob(paddedPayload);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const getTokenExpireAt = (token: string): number | null => {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== "number") return null;
  return exp * 1000;
};

export const refreshStaffTokenIfExpiringSoon = async (
  thresholdMs: number = ONE_WEEK_MS,
) => {
  const token = tokenStorage.getToken("staff");
  if (!token) return;

  const expireAt = getTokenExpireAt(token);
  if (!expireAt) return;

  if (expireAt - Date.now() >= thresholdMs) {
    return;
  }

  const { code, data } = await Post<TRefreshTokenResponse>(
    "/api/refresh_token",
    {},
  );

  if (code === 0 && data?.token) {
    tokenStorage.setToken(data.token, "staff");
  }
};
