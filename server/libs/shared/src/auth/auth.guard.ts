import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import type { RefreshTokenPayload } from '@en/common/user';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest(); // 读取请求对象
    const header = req.headers; // 读取请求头
    if (!header.authorization) {
      throw new UnauthorizedException('未登录');
    }
    const token = header.authorization.split(' ')[1]; // 读取令牌
    try {
      const decoded = this.jwtService.verify<RefreshTokenPayload>(token);
      if (decoded.tokenType !== 'access') {
        throw new UnauthorizedException('令牌类型错误');
      }
      req.user = decoded;
      return true;
    } catch (error) {
      throw new UnauthorizedException(`令牌错误${error.message}`);
    }
  }
}
