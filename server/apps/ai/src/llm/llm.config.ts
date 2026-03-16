//1.deepseek初始化一下
import { ChatDeepSeek } from '@langchain/deepseek';
import { ConfigService } from '@nestjs/config';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
//初始化deepseek模型
export const createDeepSeek = () => {
  const configService = new ConfigService();
  return new ChatDeepSeek({
    apiKey: configService.get<string>('DEEPSEEK_API_KEY'), //从环境变量中获取api key
    model: configService.get<string>('DEEPSEEK_API_MODEL'), //从环境变量中获取模型
    temperature: 1.3, //1.3翻译 + 通用对话
    maxTokens: 4396, //token限制
    streaming: true, //流式输出
  });
};
//初始化deepseek-reasoner模型
export const createDeepSeekReasoner = () => {
  const configService = new ConfigService();
  return new ChatDeepSeek({
    apiKey: configService.get<string>('DEEPSEEK_API_KEY'), //从环境变量中获取api key
    model: configService.get<string>('DEEPSEEK_REASONER_API_MODEL'), //从环境变量中获取模型
    temperature: 1.3, //1.3翻译 + 通用对话
    maxTokens: 18000, //token限制
    streaming: true, //流式输出
  });
};
//2.初始化checkpoint
export const createCheckpoint = async () => {
  const configService = new ConfigService();
  const checkpointer = PostgresSaver.fromConnString(
    configService.get<string>('AI_DATABASE_URL')!,
  );
  await checkpointer.setup();
  return checkpointer;
};
//3.初始化博查搜索API
export const createBochaSearch = async (query: string, count: number = 10) => {
  const configService = new ConfigService();
  const bochaURL = configService.get<string>('BOCHA_SEARCH_URL');
  const bochaAPIKey = configService.get<string>('BOCHA_API_KEY');
  const response = await fetch(`${bochaURL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bochaAPIKey}`,
    },
    body: JSON.stringify({
      query,
      count,
      summary: true,
    }),
  });
  const { data } = await response.json();
  const values = data.webPages.value;
  const prompt: string = values
    .map(
      (item) => `
       标题：${item.name}
       链接：${item.url}
       摘要：${item.summary}
       网站名称：${item.siteName}
       发布时间：${item.dateLastCrawled}
    `,
    )
    .join('\n');
  return prompt;
};
