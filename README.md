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
