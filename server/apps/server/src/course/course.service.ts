import { Injectable } from '@nestjs/common';
import { PrismaService } from '@libs/shared';
import { ResponseService } from '@libs/shared';

@Injectable()
export class CourseService {
  constructor(
    private prisma: PrismaService,
    private responseService: ResponseService,
  ) {}
  async findAll() {
    const courses = await this.prisma.course.findMany();
    const list = courses.map((item) => ({
      ...item,
      price: Number(item.price).toFixed(2),
    }));
    return this.responseService.success({
      data: list,
    });
  }
}
