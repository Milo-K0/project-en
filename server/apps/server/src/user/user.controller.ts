import { Controller, Body, Post } from '@nestjs/common';
import { UserService } from './user.service';
import type { UserLogin, UserRegister, Token } from '@en/common/user';

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
}
