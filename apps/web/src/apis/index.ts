import axios from "axios";
export const timeout = 50000;
import { useUserStore } from "@/stores/user";
import router from "@/router";
import { refreshTokenApi } from "./auth";
import { ElMessage } from "element-plus";
export const uploadUrl = import.meta.env.DEV
  ? "http://192.168.1.3:9000"
  : "https://api.english.com";

export const serverApi = axios.create({
  baseURL: "/api/v1",
  timeout,
});

let isRefreshing = false;
let requestQueue: ((newAccessToken: string) => void)[] = []; // 存储失败的请求

// 请求拦截器
serverApi.interceptors.request.use((config) => {
  const userStore = useUserStore();
  if (userStore.getAccessToken) {
    config.headers.Authorization = `Bearer ${userStore.getAccessToken}`;
  }
  return config;
});

serverApi.interceptors.response.use(
  (res) => {
    return res.data;
  },
  async (err) => {
    if (err.code === "ERR_NETWORK") {
      ElMessage.error("网络错误，请稍后重试");
      return Promise.reject(err);
    }
    if (err.response.status !== 401) {
      ElMessage.error("服务器错误，请稍后重试");
      return Promise.reject(err);
    }
    const origin = err.config;
    const userStore = useUserStore();
    const refreshToken = userStore.getRefreshToken;
    if (!refreshToken) {
      ElMessage.error("登录过期，请重新登录");
      userStore.logout();
      router.push("/");
      return Promise.reject(err);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        requestQueue.push((newAccessToken: string) => {
          origin.headers.Authorization = `Bearer ${newAccessToken}`;
          resolve(serverApi(origin));
        });
      });
    }

    isRefreshing = true;
    try {
      // 刷新token 调用接口
      const newToken = await refreshTokenApi({ refreshToken });
      if (newToken.success) {
        userStore.updateToken(newToken.data);
      } else {
        ElMessage.error("登录过期，请重新登录");
        userStore.logout();
        router.push("/");
        return Promise.reject(err);
      }
      const newAccessToken = newToken.data.accessToken;
      requestQueue.forEach((callback) => callback(newAccessToken));
      requestQueue = [];
      isRefreshing = false;
      // 刷新token 成功后，重新请求原始请求
      return serverApi(origin);
    } catch (error) {
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
      requestQueue = [];
    }
  },
);

export const aiApi = axios.create({
  baseURL: "/ai/v1",
  timeout,
});

aiApi.interceptors.response.use((res) => {
  return res.data;
});

export interface Response<T = any> {
  timestamp: string;
  path: string;
  message: string;
  code: number;
  success: boolean;
  data: T;
}
