### 项目构建方式-monorepo

传统模式是每个项目都有一个独立的代码仓库，而 monorepo 模式是将多个项目的代码放到一个代码仓库中。

- pnpm workspaces 轻量高效，基于硬链接节省磁盘空间
- yarn workspaces 与yarn包管理器集成，支持多包管理
- lerna 专注于多包发布，版本管理，常与yarn/pnpm结合使用
- turbo 专注于构建优化，通过缓存和并行构建提升构建速度

有什么优势?

1. 根项目可以使用共享依赖，例如A B C 三个项目都依赖于@shared/logger，那么只需要在根项目中安装一次@shared/logger，其他项目就可以共享使用。
2. 子项目间依赖可以直接使用本地包，实时更新，不需要重新安装。
3. TypeScript管理，前后端公用一份TypeScript类型定义,类型定义可以在子项目中共享，避免重复定义。

### 初始化项目

```sh
npm i pnpm -g
```

- apps文件夹存放前端项目: web端 mobile端 管理端 等项目

```sh
pnpm init vue
```

- server文件夹存放后端项目: 主服务 子服务 等项目

```sh
nest new server(project-name)
```

- 后端微服务实现

```sh
nest g app (project-name)
nest g lib (lib-name)
```

单测文件不需要所以删掉，也需在配置文件中修改生成配置

nest-cli.json 文件增加配置， 关闭生成单测文件

```json
"generateOptions": {
  "spec": false
  },
```

初始化 prisma

```sh
# npx prisma init
$env:PRISMA_ENGINES_MIRROR="https://registry.npmmirror.com/-/binary/prisma"; npx prisma init
```

libs 中存放后端微服务的共享模块，例如数据库模块，缓存模块，等。
如何暴露共享模块(以prisma模块为例)

1. 在shared/src/index.ts 中导出 prisma的services + module
2. 在prisma.module 中导出 prisma的services
3. 在shared.module 中导出 prisma.module
4. 通过Global 在shared.module 中标记为全局模块，这样在其他模块中就可以直接导入在shared.module内的prisma.module 而不需要在每个模块中都导入一次。
5. app.module 中导入 shared.module

packages 中则存放前后端公用的模块，例如DTO，Entity，等。

创建 pnpm-workspace.yaml 文件

```yaml
packages:
  - "apps/*"
  - "server"
  - "packages/*"
```

### 修改项目名 @en/web @en/server @en/ai @en/config @en/content

直接在根目录执行 pnpm install 即可安装所有依赖

### 运行项目

concurrently 可以同时运行多个项目

```sh
pnpm install concurrently -w
```

pnpm --filter 指定包名启动运行

```sh
pnpm --filter @en/web dev
pnpm --filter @en/server start:dev
pnpm --filter @en/ai start:dev
```

最终结果

```json
"scripts": {
		"web": "pnpm --filter @en/web dev",
		"server": "pnpm --filter @en/server start:dev",
		"ai": "pnpm --filter @en/server start:dev ai",
		"all": "concurrently \"pnpm run web\" \"pnpm run server\" \"pnpm run ai\""
	},
```

### 引入 拦截器及response 格式化

执行流程

```sh
- 客户端请求 -> 拦截器(前置处理) -> 路由处理器 -> 拦截器(后置处理) -> 客户端响应
```

主要用途

1. 统一相应格式 - 将返回数据包格式化为统一格式
2. 日志记录 - 记录请求日志，响应日志，错误日志等
3. 错误处理 - 统一处理异常，返回错误信息
4. 缓存处理 - 缓存常用数据，减少数据库查询次数
5. 数据转换 - 对请求参数和响应数据进行转换，例如格式化日期，转换数据类型等

```sh
nest g itc interceptor
```

```ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { map, Observable } from "rxjs";

// 将bigint转换为字符串，并保留日期类型不变
const transformBigInt = (obj: any) => {
  if (typeof obj === "bigint") {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(transformBigInt);
  }
  if (obj !== null && typeof obj === "object") {
    if (obj instanceof Date) {
      return obj;
    }
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, transformBigInt(value)]),
    );
  }
  return obj;
};

@Injectable()
export class InterceptorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    return next.handle().pipe(
      map((data) => {
        return {
          timestamp: new Date().toISOString(),
          path: request.url,
          message: data?.message || "请求成功",
          code: data?.code || 200,
          success: true,
          data: transformBigInt(data?.data) ?? null,
        };
      }),
    );
  }
}
```

```ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";

@Catch(HttpException)
export class InterceptorExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    response.status(exception.getStatus()).json({
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
      code: exception.getStatus(),
      success: false,
    });
  }
}
```

rxjs 是处理流的
同步/异步 then catch -> 数据流 -> pipe -> map filter -> 返回

### 端口冲突处理

packages 中 config 文件夹下的 index.js 文件中导出的配置项
package.json 中添加配置项

```json
"name": "@en/config",
"type": "module", // 迎合vite
  "exports": { // 迎合nestjs
    ".": "./index.js"
  },
```

在其他包安装 config 包

```sh
pnpm --filter @en/web add @en/config@workspace:*
```

注: 本人node版本为22 所以vite无法直接引入@en/config 导致vite.config.ts 中无法使用 暂改config为js文件

### 初始化数据库

prisma 初始化

```sh
pnpm add prisma dotenv @prisma/client @prisma/adapter-pg
```

```prisma
// 配置cjs模块格式适配nestjs
generator client {
  provider = "prisma-client"
  output = "../libs/shared/src/generated/prisma"
  moduleFormat = "cjs" // 模块格式
  }
```

### 连接数据库

```ts
import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
  }
}
```

### 设计数据库结构

https://mermaid.live/view#pako:eNq9l21PG0cQgP-KtZ8B2THBxt8aQipUQlECqhT5y3K3mCt3t-7eXgohSKaIACW8KbylQEMs0qSKsF0FhRenyZ_x7dn_ort39tnA2kSVwn3au3lmZndmZ3ZvCihYRSABELmrwRSBRtIM8WfYQiQ05Y_FY1GimamQpoYGfwglgbvxji2c9N1NgiuICQ0UEM7asgRBBtT00LAwVPkt5-b-kTDpMWwin2GLS2zv3Fk9kWBQVQmyLE45ewVnPyOzBC3rV0xUweSfuQczMjOPIYVEEIfHzuxqI6GZNCTUB2xjBHnI8mY5v8w2C5X5K6AKJwOOLb5wll87h39ztJFTIUVU40FSCOJD9TsqjC7sOsVztv2xsn0she20GsBs95htFVrAOrRoP05ppo_vZZy1Ffdl0fl386LSdNL0Bz_xBd7BeLxFyv1lS1Nei65HNMsl1RSR71cf2MG8hFHRqGZqVMOmsJT7o3S2KKEogaalwyrmfimW8-syh1jsCJGlzFuJWMG6rpkCYa_y7M9ttpWXUHhi1F-Xu7jLjt_IZgNTwsbBvHv0WSIeMcWK7wz0SGSj5BcRjey6uyKLBppQxqCZEoXkrD3nsbgU2BGMdQTNUGpcWHm_U87MysRPhLh0etREnCLCwfcPemVCitGozsVDP_be65cBGtKpiGFfb__QQxmgINolFjB35J6_bQJ0CmB3twkwPinSmJl1Dza-fQVdKYYHSBEboHlJlHMFXlJNS6JPDd27pnJs3mZrmKynBrG27vOS9tvKTt5Z-4utPGerr28wKINw0kAmvTYmbCNfKu78r8XWa1xFAziw5eT2S-eHbOeF_ATANh2qagz7ScnygLufti7hKlI0A-ohaGDbpIH1yvx6JbsvsWvZIz8jpQ6WTouV7I6szLE6WZ_sszknd9ZIeZN7SCG1LX9p1XFNw_39I8vMSJNjIVPlcR_SvBPVx1vk8tskvgfbxEKtqiD_2X231Oou4BPyu8BjqNt1xnuTng6WQrR0te_7LFtdLX8pyDYQgsqYXyubL53TBdlWJHpgh49l-yRNNKU-sVLxhB18uvGwX9-CvNm1aERfWXSK564GtkhpurEP1Hh_a8pmUW9ggzbhZ5qF1KCHlY-PSmeFG4ypd6l9-rS9HU9dbvIJobv0hu0Ft45G-GLza81eSNxVNLhpNZ9HOfveD2VN56L7Zn6cuQ_lmeCcrJZtM1j4qIYftIEU0VSQoMRGbcBAhF_P-Svwdl0S0DFk8JoUWvySBm2dCh_TXC0NzUcYGzVNgu3UGEiMQt3ib35Wqj8VAcI7GiI9ogODRCQciXtGQGIKTIBEtDPcEY1HYvFYOBqJhcPdbWASJNpvRWIdXdFoPBbvuh3ujnfFotNt4InnN9IR6Y7Eb_OPkVud8e5wNNoGkKpRTO77fzXez830fx861Aw

### 加载数据库数据(单词数据)

- 通过脚本读取excel 文件内容

### 前端初始化

- 安装依赖

```sh
pnpm install
```

```json
"dependencies": {
    "@element-plus/icons-vue": "^2.3.2",
    "@en/config": "workspace:*",
    "@microsoft/fetch-event-source": "^2.0.1",
    "@tailwindcss/vite": "^4.2.1",
    "@types/three": "^0.183.1",
    "axios": "^1.13.6",
    "element-plus": "^2.13.3",
    "marked": "^17.0.3",
    "pinia": "^3.0.4",
    "pinia-plugin-persistedstate": "^4.7.1",
    "tailwindcss": "^4.2.1",
    "three": "^0.183.2",
    "vue": "^3.5.27",
    "vue-router": "^5.0.1"
  },
```

配置后进行页面开发

### 词库接口开发

- 增加前缀 /api 及前缀版本号v1

```ts
app.setGlobalPrefix("api");
app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
```

- 设计接口规范
  前后端公用数据类型放在 packages/common 中

```ts
export type Word = {
  id: string; // 单词ID
  word: string; // 单词
  phonetic?: string; // 音标
  definition?: string; // 定义
  translation?: string; // 翻译
  pos?: string; // 词性
  collins?: string; // 柯林斯
  oxford?: string; // 牛津
  tag?: string; // 标签
  bnc?: string; // BNC 英国国家语料库
  frq?: string; // FRQ 频率
  exchange?: string; // 同义词
  gk?: boolean; // 高考
  zk?: boolean; // 中考
  gre?: boolean; // GRE
  toefl?: boolean; // TOEFL
  ielts?: boolean; // IELTS
  cet6?: boolean; // 大学英语六级
  cet4?: boolean; // 大学英语四级
  ky?: boolean; // 考研
  createdAt: string; // 创建时间, ISO 日期字符串
  updatedAt: string; // 更新时间, ISO 日期字符串
};

export type WordList = {
  list: Word[];
  total: number;
};

export interface WordQuery {
  page: number;
  pageSize: number;
  word?: string;
  gk?: boolean;
  zk?: boolean;
  gre?: boolean;
  toefl?: boolean;
  ielts?: boolean;
  cet6?: boolean;
  cet4?: boolean;
  ky?: boolean;
}
```

- 实现接口

1. 创建word-book 模块

```sh
nest g res word-book --project server
```

2. 在controller中定义接口

```ts
import { Controller, Get, Query } from "@nestjs/common";
import { WordBookService } from "./word-book.service";
import type { WordQuery } from "@en/common/word";

@Controller("word-book")
export class WordBookController {
  constructor(private readonly wordBookService: WordBookService) {}

  @Get()
  findAll(@Query() query: WordQuery) {
    return this.wordBookService.findAll(query);
  }
}
```

3. 在service中实现接口逻辑

```ts
import { Injectable } from "@nestjs/common";
import { ResponseService } from "@libs/shared";
import type { WordQuery } from "@en/common/word";
import type { Prisma } from "@libs/shared/generated/prisma/client";
import { PrismaService } from "@libs/shared/prisma/prisma.service";

@Injectable()
export class WordBookService {
  constructor(
    private readonly responseService: ResponseService,
    private readonly prismaService: PrismaService,
  ) {}

  private toBoolean(value: any) {
    return value === "true" ? true : undefined;
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
          frq: "desc",
        },
      }),
    ]);

    return this.responseService.success({
      total,
      list,
    });
  }
}
```

### 词库接口对接

- 前端跨域处理

```json
"proxy": {
    "/api": {
      "target": "http://localhost:3000",
      "changeOrigin": true,
      // "rewrite": (path) => path.replace(/^\/api/, ""), //无需rewrite 后端决定
    }
  },
```

- 前端接口配置

```ts
import axios from "axios";
export const timeout = 50000;

export const serverApi = axios.create({
  baseURL: "/api/v1",
  timeout,
});

serverApi.interceptors.response.use((res) => {
  return res.data;
});

export const aiApi = axios.create({
  baseURL: "/api/ai",
  timeout,
});

aiApi.interceptors.response.use((res) => {
  return res.data;
});

export interface Response<T = any> {
  timestamp: string;
  path: string;
  message: string;
  code: number;
  success: boolean;
  data: T;
}
```

- 前端接口对接

```ts
import { serverApi } from "..";
import type { Response } from "../index";
import type { WordQuery, Word } from "@en/common/word";

export const getWordBookList = (
  params: WordQuery,
): Promise<Response<{ total: number; list: Word[] }>> => {
  return serverApi.get("/word-book", {
    params,
  });
};
```

- 后续调用接口时，直接调用定义的函数即可

### 全局搜索组件开发

# 🔍 全局搜索组件

> 实现一个全局搜索功能，用户在任意页面按下 `Ctrl + F` 即可快速查询单词

---

## 📋 功能概述

| 项目       | 说明                                  |
| ---------- | ------------------------------------- |
| 组件路径   | `src/components/Search/index.vue`     |
| 触发快捷键 | `Ctrl + F` 打开 / `Esc` 关闭          |
| 复用接口   | `{ page: 1, pageSize: 20, word: '' }` |

---

### 🚀 实现步骤

#### Step 1：搜索组件基础结构

由于是全局组件，放置在 `src/components/Search/index.vue`

```vue
<template>
  <div>
    <input type="text" v-model="search" />
    <button @click="search">搜索</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
</script>
```

---

#### Step 2：样式优化

添加遮罩层背景、搜索图标，优化整体视觉效果：

```vue
<template>
  <div
    class="fixed inset-0 w-full h-full z-40 bg-black opacity-30 blur-sm"
  ></div>
  <div class="fixed inset-0 shadow-lg z-50 p-30 pt-20">
    <div class="flex items-center gap-2 shadow-lg w-1/2 mx-auto p-3 bg-white">
      <el-icon size="20">
        <Search />
      </el-icon>
      <input
        @input="searchWord"
        class="w-full h-full text-sm border-none  rounded-lg p-2 focus:outline-none"
        type="text"
        v-model="search"
      />
    </div>
    <div></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Search } from "@element-plus/icons-vue";
import type { Word } from "@en/common/word";
const search = ref("");
const wordList = ref<Word[]>([]);
const searchWord = () => {
  console.log(search.value);
};
</script>
```

---

#### Step 3：防抖处理

#### ❓ 为什么需要防抖？

上述代码中，每次输入都会触发 `searchWord` 函数，导致频繁请求接口，造成性能问题。

##### 方案一：传统防抖

> ⚠️ **缺点**：需要额外绑定事件和管理 timer 变量

```ts
let timer: ReturnType<typeof setTimeout> | null = null;
const searchWord = () => {
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => {
    console.log(search.value);
  }, 500);
};
```

##### 方案二：使用 `customRef`（✅ 推荐）

**什么是 customRef？**

`customRef` 是 Vue 3 新增的 API，用于创建自定义的 ref，可以自定义 getter 和 setter 的行为。

📖 官方文档：https://cn.vuejs.org/api/reactivity-advanced.html#customref

```ts
const search = customRef((track, trigger) => {
  let value = ""; //默认值
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    get() {
      track(); //告诉vue追踪value的值
      return value;
    },
    set(newValue: string) {
      value = newValue;
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        trigger(); //告诉vue触发value的值，从而触发依赖
        getList();
      }, 500);
    },
  };
}); //自定义ref
```

---

#### Step 4：完整实现（含快捷键 + 过渡动画）

整合 `Ctrl + F` 快捷键、`Esc` 关闭、Vue Transition 动画效果：

```ts
<template>
    <div v-if="isShow" class="fixed top-0 left-0  w-full h-full z-40 bg-black opacity-30  blur-sm"></div>
    <Transition name="fade">
        <div v-if="isShow" class="fixed inset-0  shadow-lg z-50 p-30 pt-20">
            <div :class="wordList.length > 0 ? 'rounded-tr-[10px] rounded-tl-[10px]' : 'rounded-[10px]'" class="flex items-center gap-2 shadow-lg w-1/2 mx-auto p-3  bg-white ">
                <el-icon size="20">
                    <Search />
                </el-icon>
                <input v-focus class="w-full h-full text-sm border-none  rounded-lg p-2 focus:outline-none" type="text"
                    v-model="search" placeholder="搜索">
            </div>
            <div class="w-1/2 mx-auto max-h-[500px] border-t border-gray-200 overflow-y-auto"
                v-if="wordList.length > 0">
                <div class="bg-white hover:bg-blue-50   text-gray-800 p-4 cursor-pointer shadow-sm hover:shadow-md "
                    v-for="item in wordList" :key="item.id">
                    <div class="text-sm font-semibold text-blue-600 mb-1">{{ item.word }}</div>
                    <div v-html="item.translation" class="text-sm text-gray-700 mb-1 overflow-hidden line-clamp-2" />
                </div>
            </div>
        </div>
    </Transition>
</template>
<script setup lang="ts">
import { customRef, ref } from 'vue'
import { getWordListApi } from '@/api/word'
import type { WordList } from '@en/common/word'
import { Search } from '@element-plus/icons-vue'
const isShow = ref(false)
const wordList = ref<WordList>([])
let timer: ReturnType<typeof setTimeout> | null = null
const getList = async () => {
    const res = await getWordListApi({ word: search.value, page: 1, pageSize: 20 })
    if (res.success) {
        wordList.value = res.data.list
    }
}
const search = customRef((track, trigger) => {
    let searchValue = ''
    return {
        get() {
            track()
            return searchValue
        },
        set(newValue) {
            timer && clearTimeout(timer)
            timer = setTimeout(() => {
                searchValue = newValue
                getList()
                trigger()
            }, 500)
        },
    }
})
window.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'f') {
        event.preventDefault() //阻止默认事件
        isShow.value = true
    }
    if (event.key === 'Escape') {
        isShow.value = false
        search.value = ''
    }
})
</script>

<style>
.fade-enter-active,
.fade-leave-active {
    transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: scale(0.8);
}

.fade-enter-to,
.fade-leave-from {
    opacity: 1;
    transform: scale(1);
}
</style>
```

---

#### 🎨 过渡动画解析

Vue 的 `<Transition>` 组件会在过渡过程中自动添加以下 CSS 类名：

| 类名               | 触发时机           |
| ------------------ | ------------------ |
| `.fade-enter-from` | 进入动画**开始**时 |
| `.fade-enter-to`   | 进入动画**结束**时 |
| `.fade-leave-from` | 离开动画**开始**时 |
| `.fade-leave-to`   | 离开动画**结束**时 |

```css
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: scale(1);
}
```

---

#### ⚡ 自定义指令：自动聚焦

#### 问题

用户每次打开搜索框，还需要手动点击输入框才能输入，体验不佳。

#### 解决方案

创建 `v-focus` 自定义指令，自动聚焦输入框。

**📁 directives/focus.ts**

```ts
import type { App, Plugin } from "vue";
export default {
  install(app: App) {
    app.directive("focus", {
      mounted(el: HTMLElement) {
        el.focus();
      },
    });
  },
} as Plugin;
```

**📁 main.ts**

```ts
import focusPlugin from "./directives/focus";
app.use(focusPlugin); // 使用 focus 指令
```

---

#### 📋 复制功能

点击搜索结果即可复制单词到剪贴板：

> ⚠️ **注意**：`navigator.clipboard` 仅在 `localhost` 或 `https` 环境下可用

```ts
const copyWord = (word: Word) => {
  try {
    navigator.clipboard.writeText(word.word); //localhost  / https
    ElMessage.success("复制成功");
  } catch (error) {
    ElMessage.error("复制失败");
  }
};
```

---

#### ✅ 总结

| 功能点   | 实现方式                             |
| -------- | ------------------------------------ |
| 防抖     | `customRef`                          |
| 快捷键   | `window.addEventListener('keydown')` |
| 过渡动画 | Vue `<Transition>`                   |
| 自动聚焦 | 自定义指令 `v-focus`                 |
| 复制     | `navigator.clipboard.writeText()`    |
