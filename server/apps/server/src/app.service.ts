import { Injectable } from '@nestjs/common';
import { PrismaService } from '@libs/shared/prisma/prisma.service';
import { ResponseService } from '@libs/shared/response/response.service';

@Injectable()
export class AppService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly responseService: ResponseService,
  ) {}
  getHello() {
    return this.responseService.success('Hello World!');
  }
}
