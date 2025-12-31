---
name: {{PROJECT_NAME}}-development
description: AWS Lambda TypeScript Monorepo 项目开发技能指南 - 包含项目结构、构建流程、命令和最佳实践
---

# {{PROJECT_NAME_PASCAL}} 开发技能

本文档为 AI Agent 提供在 {{PROJECT_NAME}} 项目中开发所需的知识、流程和命令。

## 项目概述

这是一个面向 AWS Lambda 的 TypeScript Monorepo 项目，使用 bun workspaces 管理多个包。

**核心技术栈：**

- **包管理**: bun workspaces
- **构建工具**: esbuild (Lambda) + Vite (Apps)
- **测试框架**: Vitest
- **代码检查**: Biome
- **任务编排**: Turborepo
- **部署工具**: AWS SAM CLI
- **运行时**: Node.js 24.x (Lambda), Bun (开发环境)

## 核心知识点

### 1. 项目结构

Agent 必须了解以下目录结构：

```
{{PROJECT_NAME}}/
├── functions/              # Lambda 函数包
│   └── <function-name>/    # 每个函数独立包
│       ├── src/index.ts    # Lambda handler
│       ├── dist/           # esbuild 构建输出
│       ├── package.json    # 函数依赖
│       └── template.yaml   # SAM 函数配置片段
├── packages/               # 共享包（不做构建）
│   └── <package-name>/
│       └── src/index.ts    # 导出入口
├── apps/                   # 前端应用
│   └── <app-name>/
│       ├── src/            # 源代码
│       └── dist/           # Vite 构建输出
├── templates/              # 模板（function/package/app）
├── scripts/                # 工具脚本
└── template.yaml           # SAM CLI 统一配置
```

### 2. 命名规范

- **Lambda 函数**: kebab-case（如 `my-function`）
- **共享包**: kebab-case（如 `my-utils`）
- **前端应用**: kebab-case（如 `my-app`）
- **SAM 资源名**: PascalCase（如 `MyFunctionFunction`）

### 3. 包引用方式

在 Lambda 函数中使用共享包：

```typescript
import { something } from '{{ORG_NAME}}/<package-name>';
```

在 `package.json` 中声明：

```json
{
  "dependencies": {
    "{{ORG_NAME}}/<package-name>": "*"
  }
}
```

### 4. 构建流程

**Lambda 函数构建流程：**

1. esbuild 预构建：TypeScript → 单文件 bundle (`dist/index.js`)
2. 排除 `@aws-sdk/*`（Lambda 运行时自带）
3. SAM 使用预构建的 `dist` 目录部署

**共享包：**

- 不构建，直接使用 TypeScript 源代码
- 在 Lambda 中被 esbuild bundle 进去

**前端应用：**

- 使用 Vite 构建
- 输出到 `dist/` 目录

## 开发流程和命令

### 创建新资源

#### 创建 Lambda 函数

```bash
bun run create:function <function-name>
cd functions/<function-name>
bun install
```

**创建后自动完成：**

- 从 `templates/function/` 复制模板
- 替换占位符（`{{name}}`, `{{NamePascal}}`）
- 更新 `template.yaml` 添加函数资源

#### 创建共享包

```bash
bun run create:package <package-name>
cd packages/<package-name>
bun install
```

#### 创建前端应用

```bash
bun run create:app <app-name>
cd apps/<app-name>
bun install
bun run dev  # 启动开发服务器
```

### 开发工作流

#### 标准开发流程

```bash
# 1. 修改代码后，运行类型检查
bun run typecheck

# 2. 运行代码检查和格式化（自动修复）
bun run lint:fix

# 3. 运行测试
bun run test

# 4. 如需要，构建 Lambda 函数
bun run build:functions

# 5. 提交代码
git add .
git commit -m "feat: your change"
```

#### Lambda 函数开发

**开发测试（无需 Docker）：**

```bash
# 直接用 bun 运行 TypeScript（快速迭代）
bun run functions/<function-name>/src/index.ts
```

**构建和本地调试（需要 Docker）：**

```bash
# 1. 预构建函数（esbuild）
cd functions/<function-name>
bun run build
# 或构建所有函数
bun run build:functions

# 2. SAM 构建（使用预构建的 dist）
bun run sam:build

# 3. 启动本地 API Gateway（需要 Docker Desktop 运行）
bun run sam:local
# 或
sam local start-api

# 4. 直接调用函数（需要 Docker）
sam local invoke <FunctionName>
# 或使用事件文件
sam local invoke <FunctionName> --event event.json
```

### 构建命令

```bash
# 构建所有包（使用 Turborepo 并行 + 缓存）
bun run build

# 只构建 Lambda 函数
bun run build:functions

# SAM 构建（先构建函数，再 SAM build）
bun run sam:build
```

**Turborepo 优势：**

- 并行执行构建任务
- 智能缓存（未变更的包使用缓存）
- 增量构建（只构建变更的包）

### 测试命令

```bash
# 运行所有测试（并行 + 缓存）
bun run test

# 测试自动生成覆盖率报告
# 覆盖报告在 <package>/coverage/ 目录
```

**测试文件规范：**

- 使用 `.test.ts` 后缀
- 放在与源文件相同的目录
- Vitest 自动发现测试文件

### 代码检查和格式化

```bash
# 检查所有代码和 Markdown
bun run lint

# 自动修复所有代码和 Markdown
bun run lint:fix

# 只检查 TypeScript/JavaScript（包含格式检查）
bun run lint:ts

# 自动修复 TypeScript/JavaScript（包含格式修复）
bun run lint:ts:fix

# 只检查 Markdown 文件格式
bun run lint:md

# 自动修复 Markdown 文件格式
bun run lint:md:fix
```

**Biome 配置：**

- 统一配置在根目录 `biome.json`
- 所有包共享同一配置

**Markdownlint 配置：**

- 配置在根目录 `.markdownlint.json`
- 自动忽略 `node_modules`, `dist`, `build`, `.aws-sam`, `.turbo`, `templates`

### 类型检查

```bash
# 运行所有包的类型检查（并行 + 缓存）
bun run typecheck
```

**TypeScript 配置层级：**

- 根 `tsconfig.json`：基础配置，`composite: true`
- 子包 `tsconfig.json`：继承根配置，覆盖特定选项

## 常见任务和命令

### 添加依赖

**添加依赖到 Lambda 函数：**

```bash
cd functions/<function-name>
bun add <package-name>
```

**添加依赖到共享包：**

```bash
cd packages/<package-name>
bun add <package-name>
```

**添加开发依赖到根目录：**

```bash
bun add -d <package-name>
```

### 在 Lambda 函数中使用共享包

1. 在 `functions/<name>/package.json` 中添加依赖：

```json
{
  "dependencies": {
    "{{ORG_NAME}}/<package-name>": "*"
  }
}
```

1. 在代码中导入：

```typescript
import { something } from '{{ORG_NAME}}/<package-name>';
```

1. 运行 `bun install` 安装依赖

### 环境变量配置

**分级配置策略：**

- 根级别：`.env`, `.env.dev`, `.env.staging`, `.env.prod`
- 函数级别：`functions/<name>/.env`
- 应用级别：`apps/<name>/.env`

**优先级：** 函数/应用级别 > 环境级别 > 根级别

**重要：**

- `.env*` 文件不应提交到 Git
- 使用 `.env.example` 作为模板
- 部署时通过 AWS Systems Manager Parameter Store 或 Secrets Manager

### 清理构建产物

```bash
bun run clean
```

这会清理所有包的构建产物和缓存。

## 注意事项和最佳实践

### 必须遵守的规则

1. **不要修改 `templates/` 目录**：这是模板，创建脚本会复制它们

2. **依赖管理**：
   - 共享依赖放在根 `package.json`
   - 包特定依赖放在包的 `package.json`
   - 不要手动修改 `bun.lockb`（让 bun 管理）
   - 使用 `bun install` 安装依赖

3. **TypeScript 配置**：
   - 所有 `tsconfig.json` 都应该设置 `composite: true`
   - 使用 `extends` 继承父配置
   - 不要重复定义基础选项

4. **SAM 模板**：
   - `create-function` 脚本会自动更新 `template.yaml`
   - 手动修改时要遵循 YAML 格式
   - 资源名使用 PascalCase

5. **测试文件**：
   - 使用 `.test.ts` 后缀
   - 放在与源文件相同的目录
   - Vitest 会自动发现测试文件

### 构建注意事项

**Lambda 函数构建：**

- 必须先运行 `bun run build:functions` 预构建
- esbuild 会 bundle 所有依赖（除 `@aws-sdk/*`）
- 生成 sourcemap 便于调试
- 输出到 `functions/<name>/dist/index.js`

**SAM 构建：**

- 必须在预构建之后运行
- 使用预构建的 `dist` 目录
- `CodeUri` 指向 `functions/<name>/dist`

### Git 提交规范

- Commit message 使用英文
- 多行 commit 使用多个 `-m` 参数：

```bash
git commit -m "feat: add new feature" -m "Detailed description here"
```

### Windows 平台注意事项

- 使用 Windows PowerShell 命令
- 路径使用 Windows 格式
- 某些命令可能需要转义（特别是路径中的空格）

## 故障排除

### TypeScript 找不到其他包的类型

**检查清单：**

1. 包的 `tsconfig.json` 设置了 `composite: true`
2. 根目录运行过 `bun run typecheck` 生成类型定义
3. 包名引用正确：`{{ORG_NAME}}/<name>`
4. 已运行 `bun install` 安装所有依赖

**解决：**

```bash
bun install
bun run typecheck
```

### Biome 报错找不到配置

**检查清单：**

1. `@biomejs/biome` 已安装在根 `package.json` 的 devDependencies 中
2. 根目录存在 `biome.json` 配置文件
3. 运行 `bun install` 安装依赖

**解决：**

```bash
bun install
```

### SAM build 失败

**检查清单：**

1. `template.yaml` 语法正确
2. 函数目录存在且包含 `src/index.ts` 入口文件
3. Handler 路径正确（`index.handler`）
4. **已运行 `bun run build:functions` 预构建函数**（生成 `dist/index.js`）
5. `CodeUri` 指向 `functions/<name>/dist` 目录

**解决：**

```bash
bun run build:functions
bun run sam:build
```

### Workspace 依赖解析失败

**解决：**

```bash
bun install
```

这会重新安装所有 workspace 依赖。

### Bun 相关问题

**检查清单：**

1. 确保已安装 bun（Windows：使用官方安装器）
2. 检查 bun 版本：`bun --version`
3. 清除缓存：`bun pm cache rm`
4. 重新安装：删除 `node_modules` 和 `bun.lockb`，然后运行 `bun install`

**解决：**

```bash
# 清除缓存
bun pm cache rm

# 重新安装（删除 node_modules 和 bun.lockb 后）
bun install
```

### Docker 相关问题（SAM local）

**注意：** `sam local` 命令需要 Docker Desktop 正在运行。

如果遇到 Docker 相关错误：

1. 确保 Docker Desktop 正在运行
2. 检查 Docker 是否正常工作：`docker ps`
3. 确保 Docker 有足够的资源（内存、CPU）

## CI/CD 流程

### GitLab CI/CD Pipeline

**阶段：**

1. **install**: 安装依赖（使用 bun，缓存 node_modules 和 .bun）
2. **test**:
   - 类型检查：`bun run typecheck`
   - 代码检查：`bun run lint`
   - 运行测试：`bun run test`
3. **build**:
   - 构建所有 Lambda 函数：`bun run build:functions`
   - SAM 构建：`sam build`
4. **deploy**:
   - `develop` 分支 → 自动部署到 dev
   - `main` 分支 → 手动部署到 prod

## 扩展说明

### 添加新的模板类型

1. 在 `templates/` 下创建新目录
2. 创建 `scripts/create-<type>.ts`
3. 在根 `package.json` 添加脚本：`"create:<type>": "bun scripts/create.ts <type>"`

### 修改构建流程

- **Lambda**: 修改函数 `package.json` 中的 `build` 脚本（esbuild 命令）
- **Apps**: 修改 `vite.config.ts`
- **Packages**: 不需要构建（直接被 bundle 进 Lambda）

### 更新 Biome 规则

编辑根目录 `biome.json`，所有包会自动使用新规则。

## 快速参考

### 常用命令速查

| 任务 | 命令 |
| --- | --- |
| 创建 Lambda 函数 | `bun run create:function <name>` |
| 创建共享包 | `bun run create:package <name>` |
| 创建前端应用 | `bun run create:app <name>` |
| 安装依赖 | `bun install` |
| 类型检查 | `bun run typecheck` |
| 代码检查 | `bun run lint` |
| 自动修复代码 | `bun run lint:fix` |
| 运行测试 | `bun run test` |
| 构建所有包 | `bun run build` |
| 构建 Lambda 函数 | `bun run build:functions` |
| SAM 构建 | `bun run sam:build` |
| 本地 API（需 Docker） | `bun run sam:local` |
| 清理构建产物 | `bun run clean` |

### 文件路径参考

| 文件类型 | 路径模式 |
| --- | --- |
| Lambda Handler | `functions/<name>/src/index.ts` |
| Lambda 构建输出 | `functions/<name>/dist/index.js` |
| 共享包入口 | `packages/<name>/src/index.ts` |
| 前端应用入口 | `apps/<name>/src/main.tsx` |
| SAM 模板 | `template.yaml` |
| SAM 配置 | `samconfig.toml` |
| TypeScript 配置 | `tsconfig.json`（根和子包） |
| Biome 配置 | `biome.json`（根目录） |
| Turborepo 配置 | `turbo.json` |
