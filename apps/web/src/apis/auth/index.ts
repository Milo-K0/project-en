import axios from "axios";
import type { Token } from "@en/common/user";
import type { Response } from "..";

const timeout = 50000;

const refreshServer = axios.create({
  baseURL: "/api/v1",
  timeout,
});

// 拦截器
refreshServer.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error),
);

// 导出刷新token 的接口

export const refreshTokenApi = (data: Omit<Token, "accessToken">) => {
  return refreshServer.post("/user/refresh-token", data) as Promise<
    Response<Token>
  >;
};
