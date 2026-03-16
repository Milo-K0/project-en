import { Injectable } from '@nestjs/common';
import { chatMode } from './prompt.mode';
import { ResponseService } from '@libs/shared';

@Injectable()
export class PromptService {
  constructor(private readonly responseService: ResponseService) {}
  findAll() {
    return this.responseService.success(
      // 过滤掉提示词，提示词不返回给前端
      chatMode.map((item) => ({
        id: item.id,
        label: item.label,
        role: item.role,
      })),
    );
  }
}
