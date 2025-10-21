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

export const Download = async (url: string, fileName: string) => {
  try {
    const response = await instance.get(url, {
      headers: {
        Authorization: localStorage.getItem(getTokenKey(url)),
      },
    });
    if (response.data?.code === 0) {
      // INSERT_YOUR_CODE
      // response.data.data.file 是 base64 后的文件内容，先转成二进制数据，然后保存为文件，文件名为 file1
      const base64String = response.data.data.file;
      const byteString = atob(base64String);
      const byteArray = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) {
        byteArray[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([byteArray]);
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(blob);
      a.download = `${fileName}${response.data.data.extension}`;
      a.click();
      window.URL.revokeObjectURL(a.href);
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error("Error downloading file:", error);
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
