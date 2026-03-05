import type { Token, TokenPayload, RefreshTokenPayload } from '@en/common/user';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}
  generateToken(payload: TokenPayload): Token {
    return {
      accessToken: this.jwtService.sign<RefreshTokenPayload>({
        ...payload,
        tokenType: 'access',
      }),
      refreshToken: this.jwtService.sign<RefreshTokenPayload>(
        { ...payload, tokenType: 'refresh' },
        {
          expiresIn: '7d',
        },
      ),
    };
  }
}
