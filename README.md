# MTS 航运物流管理系统 — 前端

基于 Vue 3 + Element Plus 的企业级航运物流管理平台前端。

## 技术栈

| 技术 | 版本 |
|------|------|
| Vue | 3.5+ |
| Vue Router | 4.5+ |
| Element Plus | 2.9+ |
| Axios | 1.7+ |
| Vite | 6.3+ |

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`

## 项目结构

```
src/
├── api/           # API 请求层
│   ├── admin.js       # 管理员 CRUD
│   ├── auth.js        # 登录/注册/改密
│   ├── data.js        # 基础数据查询
│   ├── notification.js # 通知
│   ├── order.js       # 订单
│   ├── report.js      # 报表
│   ├── request.js     # Axios 拦截器(自动刷新token)
│   └── voyage.js      # 航次
├── components/    # 通用组件
│   ├── CompanyProfileDialog.vue
│   └── PasswordChangeDialog.vue
├── router/        # 路由
│   └── index.js
├── styles/        # 全局样式
│   ├── variables.css
│   └── global.css
└── views/         # 页面
    ├── admin/         # 管理员端 (9个页面)
    ├── login/         # 登录
    ├── register/      # 注册
    ├── shipper/       # 货主端 (12个页面)
    └── shipping/      # 海运公司端 (10个页面)
```

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | `admin` | `admin123` |
| 货主 | `shipper01` | `123456` |
| 货主 | `shipper02` | `123456` |
| 货主 | `shipper03` | `123456` |
| 海运公司 | `cosco` | `123456` |
| 海运公司 | `maersk` | `123456` |
| 海运公司 | `msc` | `123456` |
| 海运公司 | `cma` | `123456` |

## 环境配置

Vite 开发服务器代理 `/api/v1` → `localhost:8080`（后端地址），修改 `vite.config.js` 中的 proxy 配置可更改。

## 构建

```bash
npm run build    # 输出到 dist/
npm run preview  # 预览构建结果
```
