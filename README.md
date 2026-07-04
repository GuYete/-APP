# 记账APP

简洁易用的个人记账桌面应用，帮你记录和管理日常花销。

## ✨ 功能

- **记账** — 记录金额、日期、分类、账户、备注，支持拍照和语音输入
- **明细** — 按月份、分类、账户筛选查看，支持搜索和删除
- **统计** — 饼图、折线图、分类排行、环比/同比对比、消费预测
- **预算** — 设置月度预算和分类预算，超支自动提醒
- **存钱目标** — 设定储蓄目标，追踪进度
- **定期账单** — 房租、订阅等周期性账单自动记录
- **分类管理** — 自定义添加、修改、删除记账分类
- **导入导出** — 支持微信/支付宝账单导入，Excel/PDF/JSON 导出
- **中英文切换** — 界面支持中文和英文
- **深色模式** — 浅色/深色主题切换
- **应用锁** — 密码保护，保护隐私

## 🖥️ 运行平台

Windows 和 macOS 桌面应用

## 🚀 开发

```bash
# 安装依赖
npm install

# 启动开发模式
npm run dev

# 构建生产版本
npm run build

# 打包 Windows 安装包
npm run package:win

# 打包 macOS 安装包
npm run package:mac
```

## 🛠️ 技术栈

| 层级 | 技术 |
|---|---|
| 桌面框架 | Electron |
| 前端框架 | Vue 3 + TypeScript |
| 构建工具 | Vite + electron-vite |
| UI 组件 | Element Plus |
| 图表 | ECharts |
| 状态管理 | Pinia |
| 数据库 | Dexie.js (IndexedDB) |
| 国际化 | vue-i18n |
| 路由 | Vue Router |

## 📁 项目结构

```
├── electron/          # Electron 主进程
├── src/
│   ├── components/    # 公共组件
│   ├── data/          # 分类和账户数据
│   ├── db/            # 数据库配置
│   ├── i18n/          # 中英文翻译
│   ├── router/        # 路由配置
│   ├── stores/        # Pinia 状态管理
│   ├── styles/        # 全局样式
│   ├── utils/         # 工具函数
│   └── views/         # 页面组件
├── index.html
└── package.json
```

## 📝 许可

MIT License
