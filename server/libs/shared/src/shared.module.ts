import { Module, Global } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ResponseModule } from './response/response.module';

@Global()
@Module({
  providers: [SharedModule],
  exports: [SharedModule, PrismaModule, ResponseModule],
  imports: [PrismaModule, ResponseModule],
})
export class SharedModule {}
