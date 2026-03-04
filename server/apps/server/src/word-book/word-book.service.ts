import { Injectable } from '@nestjs/common';
import { ResponseService } from '@libs/shared';
import type { WordQuery } from '@en/common/word';
import type { Prisma } from '@libs/shared/generated/prisma/client';
import { PrismaService } from '@libs/shared/prisma/prisma.service';

@Injectable()
export class WordBookService {
  constructor(
    private readonly responseService: ResponseService,
    private readonly prismaService: PrismaService,
  ) {}

  private toBoolean(value: any) {
    return value === 'true' ? true : undefined;
  }
  async findAll(query: WordQuery) {
    const { page = 1, pageSize = 12, word, ...rest } = query;
    const tags = Object.fromEntries(
      Object.entries(rest).map(([key, value]) => [key, this.toBoolean(value)]),
    );
    const where: Prisma.WordBookWhereInput = {
      word: word ? { contains: word } : undefined,
      ...tags,
    };

    const [total, list] = await Promise.all([
      this.prismaService.wordBook.count({ where }),
      this.prismaService.wordBook.findMany({
        where,
        skip: Number(page - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: {
          frq: 'desc',
        },
      }),
    ]);

    return this.responseService.success({
      total,
      list,
    });
  }
}
