// 用户接口定义
export interface User {
  id: string; // 用户ID
  name: string; // 用户名
  email?: string | null; // 邮箱
  phone: string; // 手机号
  address?: string | null; // 地址
  password: string; // 密码
  avatar?: string | null; // 头像
  wordNumber: number; // 单词数量
  dayNumber: number; // 打卡天数
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
  lastLoginAt?: Date; // 最后登录时间
}

// 登录的类型
export type UserLogin = Pick<User, "phone" | "password">;

// 注册的类型
export type UserRegister = Pick<User, "name" | "phone" | "email" | "password">;

// 返回的类型 不包含密码
export type ResultUser = Omit<User, "password">;

// Token的类型
export interface Token {
  accessToken: string; // 访问令牌
  refreshToken: string; // 刷新令牌
}

export type WebResultUser = ResultUser & { token: Token };

export type TokenPayload = Pick<User, "name" | "email"> & {
  userId: User["id"];
};

export type RefreshTokenPayload = TokenPayload & {
  tokenType: "refresh" | "access";
};
