# Index ICP 前端

ICP 区块链浏览器前端项目，专为 VUSD 和 LIKE 代币的交易数据查看和分析而构建。

## 📋 项目概述

基于 React + TypeScript 的现代区块链浏览器前端应用，提供直观的界面来查看 ICP 网络上 VUSD 和 LIKE 代币的实时交易数据、账户信息和代币统计。

## 🚀 快速开始

### 环境要求
- Node.js >= 16
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 环境配置
在项目根目录创建 `.env` 文件：
```env
REACT_APP_API_URL=https://index-service.zkid.app/api
```

### 启动开发服务器
```bash
npm start
```
访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本
```bash
npm run build
```

### 运行测试
```bash
npm test
```

## 📁 项目结构

```
src/
├── components/          # 可复用组件
│   ├── Header.tsx      # 头部导航组件
│   ├── TokenCard.tsx   # 代币卡片组件
│   ├── TransactionTable.tsx  # 交易表格组件
│   ├── BalanceChart.tsx      # 余额图表组件
│   └── ...
├── pages/              # 页面组件
│   ├── HomePage.tsx    # 首页
│   ├── TransactionDetail.tsx  # 交易详情页
│   ├── AddressDetail.tsx      # 地址详情页
│   └── TokenDetail.tsx        # 代币详情页
├── services/           # 服务层
│   ├── api.ts         # API 服务
│   └── globalCache.ts # 全局缓存服务
├── contexts/           # React Context
│   └── GlobalCacheContext.tsx
├── hooks/              # 自定义 Hooks
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
└── App.tsx            # 应用入口
```

## 🔌 API 集成

项目通过 RESTful API 与后端服务通信，支持以下功能：
- 获取代币信息和统计数据
- 查询最新交易记录
- 获取账户余额和交易历史
- 搜索特定交易或地址
- 获取交易详情

## 🌐 路由配置

- `/` - 首页，展示代币概览和最新交易
- `/transaction/:index` - 交易详情页
- `/address/:address` - 地址详情页  
- `/token/:symbol` - 代币详情页

## 📊 性能优化
- **预加载策略**: 使用 instant.page 进行智能预加载
- **缓存机制**: 全局缓存常用数据，减少重复请求
- **懒加载**: 图表组件按需加载
- **请求去重**: 避免重复的 API 调用

## 功能特性

### 首页功能
- 📊 代币概览卡片，显示 LIKE 和 VUSD 的关键统计数据
- 📈 实时交易列表，展示最新 100 条交易记录
- 🔄 自动刷新功能（20秒间隔），确保数据实时性
- 📱 响应式设计，完美支持移动端和桌面端

### 详细页面
- **交易详情页**：查看单笔交易的完整信息
- **地址详情页**：查看账户余额、交易历史和图表分析
- **代币详情页**：查看特定代币的统计信息和交易记录

### 技术特性
- 💾 全局缓存系统，优化性能
- 🔁 请求重试机制，提高稳定性
- 📈 交互式图表（Recharts）
- 🎯 TypeScript 类型安全
- 🎨 Tailwind CSS 样式框架

## 技术栈

- **框架**: React 18.2.0
- **语言**: TypeScript 4.9.5
- **路由**: React Router Dom 6.30.1
- **状态管理**: React Context + Hooks
- **样式**: Tailwind CSS 3.4.0
- **图表**: Recharts 2.15.3
- **HTTP客户端**: Axios 1.9.0
- **图标**: React Icons 4.12.0
- **日期处理**: date-fns 4.1.0


## 开发指南

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 ESLint 规则
- 组件采用函数式编程和 Hooks
- 使用 Tailwind CSS 进行样式编写

### 新增功能
1. 在 `types/` 目录定义相关类型
2. 在 `services/` 目录添加 API 调用
3. 在 `components/` 或 `pages/` 创建组件
4. 更新路由配置（如需要）
