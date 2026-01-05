# create-bun-fullstack-monorepo

一个基于 Bun 的全栈 Monorepo 项目模板，集成 TypeScript、AWS Lambda (SAM) 和 React。

[![npm version](https://img.shields.io/npm/v/create-bun-fullstack-monorepo.svg)](https://www.npmjs.com/package/create-bun-fullstack-monorepo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ 特性

- 🚀 **Bun** - 极速的 JavaScript 运行时和包管理器
- 📦 **Monorepo** - 使用 Bun workspaces 管理多个包
- ⚡ **Turborepo** - 智能任务编排和缓存
- 🔷 **TypeScript** - 完整的类型支持
- ☁️ **AWS SAM** - Lambda 函数本地开发和部署
- ⚛️ **React + Vite** - 现代前端开发体验
- 🧹 **Biome** - 超快的代码检查和格式化

## 🚀 快速开始

### 创建新项目

```bash
# 从 npm 创建（推荐）
bun create bun-fullstack-monorepo my-project

# 或从 GitHub 创建
bun create shazhou-ww/create-bun-fullstack-monorepo my-project
```

### 初始化项目

```bash
cd my-project
bun install
```

## 📁 生成的项目结构

```
my-project/
├── functions/          # Lambda 函数包
├── packages/           # 共享包
├── apps/               # 前端应用
├── templates/          # 模板文件
├── scripts/            # 工具脚本
├── template.yaml       # SAM 模板
└── package.json
```

## 📜 常用命令

### 创建新模块

| 命令 | 说明 |
|------|------|
| `bun run create:function <name>` | 创建新的 Lambda 函数 |
| `bun run create:package <name>` | 创建新的共享包 |
| `bun run create:app <name>` | 创建新的前端应用 |

### 开发与测试

| 命令 | 说明 |
|------|------|
| `bun run test` | 运行所有测试 |
| `bun run typecheck` | TypeScript 类型检查 |
| `bun run lint` | 代码检查（Biome + Markdown） |
| `bun run lint:fix` | 自动修复代码问题 |
| `bun run build` | 构建所有包 |
| `bun run build:functions` | 仅构建 Lambda 函数 |

### SAM 本地开发

| 命令 | 说明 |
|------|------|
| `bun run sam:merge` | 合并 Lambda 函数模板 |
| `bun run sam:build` | 构建函数并生成 SAM 模板 |
| `bun run sam:validate` | 验证 SAM 模板 |
| `bun run sam:local` | 启动本地 API Gateway |
| `bun run sam:invoke` | 本地调用 Lambda 函数 |

### SAM 部署

| 命令 | 说明 |
|------|------|
| `bun run sam:package` | 打包模板准备部署 |
| `bun run sam:deploy` | 部署到 AWS |
| `bun run sam:deploy:guided` | 交互式引导部署（首次推荐） |

### 清理

| 命令 | 说明 |
|------|------|
| `bun run clean` | 清理构建产物和缓存 |

## 🔧 前置要求

- [Bun](https://bun.sh/) 1.0+
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)（用于 Lambda 开发）
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)（用于本地运行 Lambda）

## 📖 使用示例

### 创建一个 Lambda 函数

```bash
# 创建函数
bun run create:function hello-world

# 构建并本地测试
bun run sam:local

# 访问 http://localhost:3000/hello-world
```

### 创建共享包

```bash
# 创建包
bun run create:package utils

# 在 Lambda 函数中使用
# import { something } from '@myorg/utils';
```

### 部署到 AWS

```bash
# 首次部署（交互式引导）
bun run sam:deploy:guided

# 后续部署
bun run sam:deploy
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

