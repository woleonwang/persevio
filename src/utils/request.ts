import axios from 'axios';

const instance = axios.create({
  baseURL: '/',
  timeout: 30000,
});

export const Get = async (url: string, params?: Record<string, unknown>) => {
  try {
    const response = await instance.get(url, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

export const Post = async (url: string, data?: Record<string, unknown>) => {
  try {
    const response = await instance.post(url, data);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};
