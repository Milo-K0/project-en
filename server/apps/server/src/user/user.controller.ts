import {
  Controller,
  Body,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import type {
  UserLogin,
  UserRegister,
  Token,
  UserUpdate,
} from '@en/common/user';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@libs/shared/auth/auth.guard';
import type { Request } from 'express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 登录
  @Post('login')
  login(@Body() loginDto: UserLogin) {
    return this.userService.login(loginDto);
  }

  // 注册
  @Post('register')
  register(@Body() registerDto: UserRegister) {
    return this.userService.register(registerDto);
  }
  // 只需要一个参数 refreshToken
  @Post('refresh-token')
  refreshToken(@Body() refreshTokenDto: Omit<Token, 'accessToken'>) {
    return this.userService.refreshToken(refreshTokenDto);
  }
  // 上传头像
  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('file')) // 限制前端的key为file
  uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    return this.userService.uploadAvatar(file);
  }
  // 更新用户信息
  @UseGuards(AuthGuard) // 不传token 401 传了之后 payload 中会有 userId
  @Post('update')
  updateUser(@Body() updateDto: UserUpdate, @Req() req: Request) {
    const user = req.user;
    return this.userService.updateUser(updateDto, user);
  }
}
