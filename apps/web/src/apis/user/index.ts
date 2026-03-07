import { serverApi, type Response } from "..";
import type {
  AvatarResult,
  UserUpdate,
  UserLogin,
  UserRegister,
  WebResultUser,
} from "@en/common/user";

export const login = (data: UserLogin) => {
  return serverApi.post("/user/login", data) as Promise<
    Response<WebResultUser>
  >;
};

export const register = (data: UserRegister) => {
  return serverApi.post("/user/register", data) as Promise<
    Response<WebResultUser>
  >;
};

// 上传头像
export const uploadAvatar = (file: FormData) => {
  return serverApi.post("/user/upload-avatar", file) as Promise<
    Response<AvatarResult>
  >;
};

// 更新用户信息
export const updateUser = (data: UserUpdate) => {
  return serverApi.post("/user/update", data) as Promise<Response<UserUpdate>>;
};
