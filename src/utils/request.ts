import axios from "axios";

const instance = axios.create({
  baseURL: "/",
  timeout: 30000,
});

export const Get = async <T = any>(
  url: string,
  params?: Record<string, unknown>
) => {
  try {
    const response = await instance.get<{ code: number; data: T }>(url, {
      params,
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
    response = await instance.post<{ code: number; data?: T }>(url, data);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return response?.data ?? { code: -1 };
  }
};
