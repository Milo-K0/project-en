import { Module, Global } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ResponseModule } from './response/response.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MinioModule } from './minio/minio.module';

@Global()
@Module({
  providers: [SharedModule],
  exports: [
    SharedModule,
    PrismaModule,
    ResponseModule,
    JwtModule,
    ConfigModule,
    MinioModule,
  ],
  imports: [
    PrismaModule,
    ResponseModule,
    ConfigModule.forRoot({
      isGlobal: true, // 全局配置
      envFilePath: '.env', // 环境变量文件路径
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('SECRET_KEY'),
        signOptions: {
          expiresIn: 10, // 过期时间 10 秒 方便调试
        },
      }),
    }),
    MinioModule,
  ],
})
export class SharedModule {}
