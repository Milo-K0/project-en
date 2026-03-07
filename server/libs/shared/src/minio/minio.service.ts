import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly minioClient: Minio.Client;
  constructor(private configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT')!,
      port: Number(this.configService.get('MINIO_PORT')),
      useSSL: !!Number(this.configService.get<boolean>('MINIO_USE_SSL')),
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY'),
    });
  }
  // nestjs 生命周期
  async onModuleInit() {
    //启动时创建存储桶
    const bucket = this.configService.get<string>('MINIO_BUCKET')!;
    const exists = await this.minioClient.bucketExists(bucket);
    //如果存储桶不存在，则创建存储桶
    if (!exists) {
      await this.minioClient.makeBucket(bucket, 'us-east-1');
      await this.minioClient.setBucketPolicy(
        bucket,
        JSON.stringify({
          Version: '2012-10-17', //策略语言版本版本 类似于http版本 例如http1.1 http2.0 这个值固定即可
          Statement: [
            {
              Sid: 'PublicReadObjects', //给这个规则起一个名字
              Effect: 'Allow', //允许打开这个规则 Allow 允许 Deny 拒绝
              Principal: '*', //所有人
              Action: ['s3:GetObject'], //允许浏览器获取对象
              Resource: ['arn:aws:s3:::avatar/*'], //允许读取 avatar桶内的所有资源
            },
          ],
        }),
      );
    }
  }
  getClient() {
    return this.minioClient;
  }
  getBucket() {
    return this.configService.get<string>('MINIO_BUCKET')!;
  }
}
