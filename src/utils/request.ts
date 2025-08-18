import axios from "axios";

const instance = axios.create({
  baseURL: "/",
  timeout: 300000,
});

const getTokenKey = (url: string): string => {
  const tokenKey = {
    "/api/coworker": "coworker_token",
    "/api/trial_user": "trial_user_uuid",
    "/api/candidate": "candidate_token",
  };
  let key = "token";
  Object.keys(tokenKey).forEach((suffix) => {
    if (url.startsWith(suffix)) {
      key = tokenKey[suffix as keyof typeof tokenKey];
    }
  });
  return key;
};

export const Get = async <T = any>(
  url: string,
  params?: Record<string, unknown>
) => {
  try {
    const response = await instance.get<{ code: number; data: T }>(url, {
      params,
      headers: {
        "Content-Type": "application/json",
        Authorization: localStorage.getItem(getTokenKey(url)),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

export const Post = async <T = any>(
  url: string,
  data?: Record<string, unknown>
) => {
  let response;
  try {
    response = await instance.post<{ code: number; data?: T }>(url, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: localStorage.getItem(getTokenKey(url)),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return response?.data ?? { code: -1 };
  }
};

export const PostFormData = async <T = any>(url: string, data: FormData) => {
  let response;
  try {
    response = await instance.post<{ code: number; data?: T }>(url, data, {
      headers: {
        Authorization: localStorage.getItem(getTokenKey(url)),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return response?.data ?? { code: -1 };
  }
};
