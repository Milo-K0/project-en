import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  createDeepSeek,
  createCheckpoint,
  createBochaSearch,
  createDeepSeekReasoner,
} from '../llm/llm.config';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { ChatRoleType, ChatDto } from '@en/common/chat';
import type { AIMessageChunk } from 'langchain';
import { chatMode } from '../prompt/prompt.mode';
import { createAgent } from 'langchain';
import { ResponseService } from '@libs/shared';
@Injectable()
export class ChatService implements OnModuleInit {
  constructor(private readonly responseService: ResponseService) {}
  private checkpointer: PostgresSaver;
  async onModuleInit() {
    this.checkpointer = await createCheckpoint(); //幂等性
  }
  async streamCompletion(createChatDto: ChatDto) {
    let model = createDeepSeek(); //普通模型
    if (createChatDto.deepThink) {
      model = createDeepSeekReasoner(); //深度思考模型
    }

    const findMode = chatMode.find((item) => item.role === createChatDto.role);
    if (!findMode) {
      throw new Error('模式不存在');
    }

    let prompt = findMode.prompt;
    const content = createChatDto.content;
    if (createChatDto.webSearch) {
      const webSearchPrompt = await createBochaSearch(createChatDto.content);
      prompt += `请根据以下搜索结果回答问题：${webSearchPrompt}(并且返回你参考的网站名称)，用户问题：${createChatDto.content}`;
    }
    const agent = createAgent({
      model: model, //模型
      systemPrompt: prompt, //系统提示词
      checkpointer: this.checkpointer, //检查点
    });
    //3.组装消息格式
    const id = `${createChatDto.userId}-${createChatDto.role}`;
    const stream = agent.stream(
      {
        messages: [{ role: 'human', content }],
      },
      {
        configurable: { thread_id: id }, //用于做会话隔离 + 历史记录存储
        streamMode: 'messages', //流式输出模式
      },
    );
    return stream; //返回的是一个迭代器
  }

  async findAll(userId: string, role: ChatRoleType) {
    const messages = await this.checkpointer.get({
      configurable: { thread_id: `${userId}-${role}` },
    });
    const list = messages?.channel_values?.messages as AIMessageChunk[];
    if (!list) return this.responseService.success([]); //如果历史记录为空，则返回空数组
    return this.responseService.success(
      list.map((item) => ({
        content: item.content,
        role: item.type,
        reasoning: item.additional_kwargs?.reasoning_content,
      })),
    );
  }
}
