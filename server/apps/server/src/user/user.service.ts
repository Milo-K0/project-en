import { Injectable } from '@nestjs/common';
import { ResponseService } from '@libs/shared/response/response.service';
import { PrismaService } from '@libs/shared/prisma/prisma.service';
import type {
  UserLogin,
  UserRegister,
  Token,
  RefreshTokenPayload,
  UserUpdate,
} from '@en/common/user';
import type { Prisma } from '@libs/shared/generated/prisma/client';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { userSelect } from './user.select';
import { MinioService } from '@libs/shared/minio/minio.service';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { updateUserSelect } from './user.select';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly responseService: ResponseService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly minioService: MinioService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: UserLogin) {
    // 1. 检查手机号是否存在
    const user = await this.prismaService.user.findUnique({
      where: {
        phone: loginDto.phone,
      },
    });
    if (!user) {
      return this.responseService.error(null, '手机号不存在');
    }
    // 2. 检查密码是否正确
    if (user.password !== loginDto.password) {
      return this.responseService.error(null, '密码错误');
    }
    // 3. 更新最后登录时间
    const updatedUser = await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
      select: userSelect,
    });
    const token = this.authService.generateToken({
      userId: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
    });
    return this.responseService.success({ ...updatedUser, token });
  }

  async register(registerDto: UserRegister) {
    const data: Prisma.UserCreateInput = {
      name: registerDto.name,
      phone: registerDto.phone,
      password: registerDto.password,
      lastLoginAt: new Date(), // 最后登录时间
    };
    // name email phone password
    // 1. 如果手机号存在 则返回手机号已存在
    const user = await this.prismaService.user.findUnique({
      where: {
        phone: registerDto.phone,
      },
    });
    if (user) {
      return this.responseService.error(null, '手机号已存在');
    }
    // 2. 如果邮箱有传入 且 邮箱存在 则返回邮箱已存在
    if (registerDto.email) {
      const user = await this.prismaService.user.findUnique({
        where: {
          email: registerDto.email,
        },
      });
      if (user) {
        return this.responseService.error(null, '邮箱已存在');
      }
      data.email = registerDto.email;
    }
    // 3. 否则 注册用户 默认将所有值都返回不包括密码 要排除密码
    const newUser = await this.prismaService.user.create({
      data,
      select: userSelect,
    });
    const token = this.authService.generateToken({
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
    });
    return this.responseService.success({ ...newUser, token });
  }

  async refreshToken(refreshTokenDto: Omit<Token, 'accessToken'>) {
    try {
      const decoded = this.jwtService.verify<RefreshTokenPayload>(
        refreshTokenDto.refreshToken,
      );
      if (decoded.tokenType !== 'refresh') {
        return this.responseService.error(null, '刷新令牌无效');
      }
      const user = await this.prismaService.user.findUnique({
        where: {
          id: decoded.userId,
        },
      });
      if (!user) {
        return this.responseService.error(null, '用户不存在');
      }
      const token = this.authService.generateToken({
        userId: user.id,
        name: user.name,
        email: user.email,
      });
      return this.responseService.success(token);
    } catch (error) {
      return this.responseService.error(null, `刷新令牌无效${error.message}`);
    }
  }

  // 上传头像
  async uploadAvatar(file: Express.Multer.File) {
    if (!file) {
      return this.responseService.error(null, '文件不存在');
    }
    if (file.size > 1024 * 1024 * 5) {
      return this.responseService.error(null, '文件大小不能超过5MB');
    }
    if (!file.mimetype.includes('image')) {
      return this.responseService.error(null, '文件类型不支持');
    }
    const fileName = `${Date.now()}-${file.originalname}`;
    const client = this.minioService.getClient();
    const bucket = this.minioService.getBucket();
    await client.putObject(bucket, fileName, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });
    const isHttps = !!Number(this.configService.get('MINIO_USE_SSL'));
    const baseUrl = isHttps ? 'https' : 'http';
    const port = this.configService.get('MINIO_PORT');
    const databaseUrl = `/${bucket}/${fileName}`;
    const previewUrl = `${baseUrl}://${this.configService.get('MINIO_ENDPOINT')}:${port}${databaseUrl}`;
    return this.responseService.success({
      previewUrl,
      databaseUrl,
    });
  }

  async updateUser(updateDto: UserUpdate, user: Request['user']) {
    // 检查邮箱是否重复
    const existingUser = await this.prismaService.user.findUnique({
      where: {
        email: updateDto.email!,
      },
    });
    if (existingUser && existingUser.id !== user!.userId) {
      return this.responseService.error(null, '邮箱已存在');
    }
    const updatedUser = await this.prismaService.user.update({
      where: {
        id: user!.userId,
      },
      data: {
        name: updateDto.name,
        email: updateDto.email,
        avatar: updateDto.avatar,
        address: updateDto.address,
        bio: updateDto.bio,
        isTimingTask: updateDto.isTimingTask,
        timingTaskTime: updateDto.timingTaskTime,
      },
      select: updateUserSelect,
    });
    return this.responseService.success(updatedUser);
  }
}
