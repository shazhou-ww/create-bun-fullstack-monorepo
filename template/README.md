# {{PROJECT_NAME_PASCAL}}

{{PROJECT_DESCRIPTION}}

> **这是一个 Bun Create 模板**  
> 使用 `bun create bun-fullstack-monorepo my-project` 或 `bun create your-username/bun-fullstack-monorepo my-project` 创建新项目

## 项目结构

```
{{PROJECT_NAME}}/
├── functions/          # Lambda 函数包（使用 esbuild 预构建）
├── packages/           # 共享包（直接使用 TypeScript 源码，不做构建）
├── apps/              # 前端应用（使用 Vite 构建）
├── templates/         # 模板包（用于创建新的 functions/packages/apps）
├── scripts/           # 创建和工具脚本
└── template.yaml      # SAM CLI 模板
```

## 技术栈

- **运行时**: Bun（本地开发）+ Node.js 24.x（Lambda 运行时）
- **TypeScript**: 5.3+（bun 可以直接运行 TypeScript）
- **包管理**: Bun workspaces
- **构建工具**:
  - Lambda: `esbuild`（预构建到 `dist/`）
  - Apps: `Vite`
- **任务编排**: `Turborepo`（并行执行、智能缓存）
- **测试**: `Vitest`（通过 bun 运行）
- **代码检查和格式化**: `Biome`（lint + format）
- **部署**: AWS SAM CLI

## 快速开始

### 使用 Bun Create 创建新项目

**从 npm 使用（推荐）：**

```bash
bun create bun-fullstack-monorepo my-project
cd my-project
bun install
```

**从 GitHub 使用：**

```bash
bun create your-username/bun-fullstack-monorepo my-project
cd my-project
bun run init  # 如果 bun create 没有自动运行 init
bun install
```

**注意**: 
- 从 npm 使用时，`init.ts` 脚本会在安装后自动运行（通过 `bun-create.postinstall`）
- 从 GitHub 使用时，可能需要手动运行 `bun run init`
- `init.ts` 脚本会将所有模板占位符替换为实际项目名称

### 前置要求

- Bun 1.0+（[安装指南](https://bun.sh/docs/installation)）
- AWS SAM CLI（用于本地调试和部署，可选）
- AWS CLI（用于部署，可选）
- Docker Desktop（用于本地运行 Lambda 函数，可选，[下载地址](https://www.docker.com/products/docker-desktop/)）

### 创建新的 Lambda 函数

```bash
bun run create:function <function-name>
```

这会：

1. 从 `templates/function` 克隆模板
2. 替换模板中的占位符
3. 更新 `template.yaml` 添加新的 Lambda 函数
4. 创建 esbuild 构建脚本

### 创建新的共享包

```bash
bun run create:package <package-name>
```

这会：

1. 从 `templates/package` 克隆模板
2. 替换模板中的占位符

### 创建新的前端应用

```bash
bun run create:app <app-name>
```

这会：

1. 从 `templates/app` 克隆模板
2. 设置 Vite + React 项目

## 开发

### 本地开发 Lambda 函数

1. 复制环境变量模板并配置：

```bash
cp env.json.example env.json
# 编辑 env.json 填入你的环境变量
```

2. 构建所有函数（使用 esbuild 预构建）：

```bash
bun run build:functions
```

3. 使用 SAM CLI 本地启动 API：

```bash
bun run sam:local
```

> **注意**: `sam:local` 使用 `--env-vars env.json` 传递环境变量给 Lambda 容器。
> 请确保 `env.json` 中配置了正确的函数名和环境变量。

4. 测试特定函数：

```bash
bun run sam:invoke <FunctionName>
```

5. 或者直接用 bun 运行 TypeScript 进行开发：

```bash
bun run functions/<function-name>/src/index.ts
```

### 运行测试

```bash
# 运行所有测试（自动生成覆盖率报告）
bun run test
```

### 类型检查

```bash
bun run typecheck
```

### 代码检查

```bash
# 检查所有代码和 Markdown（lint:ts + lint:md）
bun run lint

# 自动修复所有代码和 Markdown（lint:ts:fix + lint:md:fix）
bun run lint:fix

# 只检查 TypeScript/JavaScript 代码（包含格式检查）
bun run lint:ts

# 自动修复 TypeScript/JavaScript 代码（包含格式修复）
bun run lint:ts:fix

# 只检查 Markdown 文件
bun run lint:md

# 自动修复 Markdown 文件
bun run lint:md:fix
```

## 配置

### 环境变量

#### SAM 本地开发

SAM CLI 不会自动读取 `.env` 文件。需要使用 `env.json` 配置环境变量：

1. 复制模板：`cp env.json.example env.json`
2. 编辑 `env.json` 填入环境变量：

```json
{
  "Parameters": {
    "NODE_ENV": "development"
  },
  "MyFunctionName": {
    "API_KEY": "your-api-key-here"
  }
}
```

> **注意**: `env.json` 包含敏感信息，已被 `.gitignore` 忽略。

#### 环境配置文件

项目支持分级环境配置：

- `.env` - 本地开发（不应提交）
- `.env.dev` - 开发环境
- `.env.staging` - 预发布环境
- `.env.prod` - 生产环境

每个 Lambda 函数也可以有自己的 `.env` 文件（用于参考需要的变量）。

### TypeScript 配置

- 根目录 `tsconfig.json` - 基础配置
- 每个 package/function/app 有自己的 `tsconfig.json` 继承根配置

### Biome 配置

- 根目录 `biome.json` - 统一配置（lint + format）
- 所有包共享同一配置，无需单独配置文件

## 部署

### 使用 SAM CLI 本地部署

```bash
bun run sam:build
sam deploy --guided
```

### CI/CD

你可以添加 `.gitlab-ci.yml` 或其他 CI/CD 配置文件来支持自动化部署。

部署流程示例：

- `develop` 分支 → 自动部署到 dev 环境
- `main` 分支 → 手动触发部署到 prod 环境

## 目录说明

### functions/

每个 Lambda 函数是一个独立的包：

- 使用 `esbuild` 预构建到 `dist/` 目录
- SAM 直接使用预构建的 `dist` 目录部署
- 包含 `template.yaml` 片段（会被合并到根 `template.yaml`）
- 有自己的测试和配置

### packages/

共享包，不需要构建：

- 直接从 `src/index.ts` 导出
- 通过 workspace 名称引用（如 `{{ORG_NAME}}/package-name`）
- 使用 TypeScript 的 path mapping 引用

### apps/

前端应用：

- 使用 Vite 构建
- 独立的开发和构建流程
- 可以部署到任何静态托管服务

### templates/

模板目录，包含：

- `function/` - Lambda 函数模板
- `package/` - 共享包模板
- `app/` - 前端应用模板

## 最佳实践

1. **命名规范**
   - Functions: `kebab-case`（如 `user-service`）
   - Packages: `kebab-case`（如 `shared-utils`）
   - Apps: `kebab-case`（如 `admin-panel`）

2. **代码组织**
   - 每个包应该是自包含的
   - 共享代码放在 `packages/`
   - Lambda 函数保持精简，复杂逻辑抽取到 packages

3. **测试**
   - 每个包都应该有测试
   - 使用 Vitest 编写单元测试
   - 覆盖率目标是 80%+

4. **类型安全**
   - 充分利用 TypeScript 类型系统
   - 避免使用 `any`
   - 使用类型守卫和断言

## 常见问题

### 如何添加新的依赖？

在对应的 package 目录下运行 `bun add <package>`，workspace 会自动处理依赖。

### 如何引用其他 packages？

使用 workspace 名称引用，例如：

```typescript
import { something } from '{{ORG_NAME}}/shared-utils';
```

### 如何调试 Lambda 函数？

使用 SAM CLI 的本地调试功能：

```bash
sam local invoke <FunctionName> --debug-port 5858
```

然后附加调试器到该端口。

## 模板说明

这个项目是一个 Bun Create 模板。当用户使用 `bun create` 创建新项目时：

1. Bun 会克隆这个仓库到临时目录
2. 复制到目标目录
3. 运行 `bun run init`（如果配置了 postinstall 脚本）
4. `init.ts` 脚本会替换所有占位符：
   - `{{PROJECT_NAME}}` → 项目名称（kebab-case）
   - `{{PROJECT_NAME_PASCAL}}` → PascalCase 版本
   - `{{ORG_NAME}}` → 组织/命名空间名称
   - `{{PROJECT_DESCRIPTION}}` → 项目描述

## 贡献

欢迎贡献！这个模板项目旨在为社区提供一个标准的全栈 monorepo 起点。

1. Fork 这个仓库
2. 创建功能分支
3. 提交更改
4. 运行测试和 lint
5. 创建 Pull Request

## 许可证

[添加许可证信息]

