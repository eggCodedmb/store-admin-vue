import axios from "axios";
import { ElMessage } from "element-plus";

export const baseURL = "";

const service = axios.create({
  baseURL: baseURL,
  timeout: 5000,
});

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code !== 0) {
      ElMessage.error(res.message || "Error");
      return Promise.reject(new Error(res.message || "Error"));
    } else {
      return res;
    }
  },
  (error) => {
    // 处理后端返回的错误信息
    const backendMessage = error.response?.data?.message;
    const finalMessage = backendMessage || error.message || "未知错误";
    
    ElMessage.error(finalMessage);
    return Promise.reject(error);
  }
);

export default service;
