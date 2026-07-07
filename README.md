# MTS 航运物流管理系统 — 前端

一站式海运运力交易与订单管理平台的前端实现。支持多角色（管理员、货主、海运公司）协同操作，涵盖航线申请、货物运输、订单管理、实时追踪等完整业务流程。

---

## 目录

- [技术栈](#技术栈)
- [系统架构](#系统架构)
- [功能清单](#功能清单)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [路由设计](#路由设计)
- [API 对接](#api-对接)
- [认证与鉴权](#认证与鉴权)
- [数据权限模型](#数据权限模型)
- [测试账号](#测试账号)
- [开发指南](#开发指南)
- [部署指南](#部署指南)
- [常见问题](#常见问题)
- [许可证](#许可证)

---

## 技术栈

| 技术 | 用途 | 版本 | 备注 |
|------|------|------|------|
| Vue 3 | 前端框架 | ^3.5.0 | Composition API + `<script setup>` |
| Vue Router 4 | 路由管理 | ^4.5.0 | createWebHistory 模式 |
| Element Plus | UI 组件库 | ^2.9.0 | 中文语言包 |
| @element-plus/icons-vue | 图标库 | ^2.3.0 | 全局注册，可直接在模板中使用 |
| Axios | HTTP 客户端 | ^1.7.0 | 拦截器实现 token 自动刷新 |
| Vite | 构建工具 | ^6.3.0 | 快速 HMR |

### 依赖安装

```bash
npm install
```

安装后所有依赖位于 `node_modules/`，约 200MB。

---

## 系统架构

### 前端架构图

```
┌─────────────────────────────────────────────────────┐
│                     App.vue                         │
│                   <router-view />                   │
├─────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐  │
│  │                  Layout                      │  │
│  │  ┌─────────┐  ┌───────────────────────────┐ │  │
│  │  │ Sidebar  │  │      Header               │ │  │
│  │  │ - Logo   │  │  - Breadcrumb            │ │  │
│  │  │ - Menu   │  │  - Clock                 │ │  │
│  │  │ - User   │  │  - Notifications (Bell)  │ │  │
│  │  └─────────┘  │  - User Dropdown          │ │  │
│  │               │  - Password Change Dialog │ │  │
│  │               └───────────────────────────┘ │  │
│  │               ┌───────────────────────────┐ │  │
│  │               │       Content             │ │  │
│  │               │    <router-view />        │ │  │
│  │               └───────────────────────────┘ │  │
│  └──────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│                   API Layer                         │
│  request.js (Axios + Token Refresh + Error Handler) │
│    ├─ auth.js      登录/注册/改密                   │
│    ├─ order.js     订单 CRUD/追踪/支付               │
│    ├─ data.js      基础数据查询                      │
│    ├─ admin.js     管理员 CRUD                      │
│    ├─ voyage.js    航次靠泊                          │
│    ├─ report.js    统计报表                          │
│    └─ notification.js  通知                         │
├─────────────────────────────────────────────────────┤
│              WebSocket Connection                    │
│  ws://.../ws?token=xxx  (实时订单状态推送)           │
└─────────────────────────────────────────────────────┘
```

### 三种 Layout

系统有三种 Layout，分别对应三个角色：

| Layout | 侧栏菜单 | 可用页面数 |
|--------|---------|-----------|
| `shipper/Layout.vue` | 工作台、订单管理（列表/创建）、基础数据（港口/船舶/航线） | 12 |
| `shipping/Layout.vue` | 工作台、订单管理、航线申请、航次管理、基础数据、统计报表 | 10 |
| `admin/Layout.vue` | 工作台、货主管理、海运公司管理、管理员管理、城市管理、港口管理、船舶管理、航线管理、订单管理、货物管理、发送通知 | 11 |

### 路由守卫

```js
// router/index.js 导航守卫逻辑
1. 检查 whitelist（/login, /register）→ 已登录则跳转仪表盘
2. 无 token → 跳转 /login
3. 角色无效 → 清除登录信息 → 跳转 /login
4. 角色路径不匹配 → 跳转该角色仪表盘
5. 放行
```

---

## 功能清单

### 管理员端（11 个页面）

#### 工作台 (`/admin/dashboard`)
- 6 项统计卡片：货主数、海运公司数、城市数、港口数、船舶数、航线数
- 8 个管理导航卡片，点击进入对应管理页面
- 数据来自：`ShipperListApi`、`ShippingListApi`、`CityListApi`、`PortListApi`、`VesselListApi`、`LineListApi`

#### 城市管理 (`/admin/city`)
- 表格展示：ID、城市名、国家、国家代码、时区
- 操作：添加、编辑、删除（软删除）
- 搜索：按城市名模糊搜索（后端 LIKE 查询）

#### 港口管理 (`/admin/port`)
- 表格展示：ID、港口名、代码、城市、类型、纬度、经度
- 操作：添加（关联城市）、编辑、删除
- **导入/导出 Excel**：`POST /import/ports` + `GET /export/ports`

#### 船舶管理 (`/admin/vessel`)
- 表格展示：ID、船名、IMO、载重、集装箱容量、航速、类型
- 操作：添加（IMO+呼号+船公司+类型+载重+吨位+航速）、编辑、删除
- **导入/导出 Excel**

#### 航线管理 (`/admin/line`)
- 表格展示：ID、航线名、起始港、目的港、总距离
- 操作：添加（关联船公司+起止港名+港口序列JSON+距离）、编辑、删除
- **导入/导出 Excel**

#### 货主管理 (`/admin/shipper`)
- 表格展示：ID、公司名、法定代表人、电话、用户名、状态
- 操作：编辑（公司名+用户名+法定代表人+电话+地址+状态）、删除

#### 海运公司管理 (`/admin/shipping`)
- 表格展示：ID、公司名、联系人、电话、用户名、状态
- 操作：编辑（公司名+用户名+联系人+电话+地址+状态）、删除

#### 管理员管理 (`/admin/admin/list`)
- 表格展示：ID、用户名、姓名、角色、创建时间
- 操作：创建（用户名+密码+姓名+角色：超级/普通管理员）

#### 订单管理 (`/admin/order/list`)
- 表格展示：订单号、货主公司、起运港、目的港、重量、费用、状态、时间
- 搜索：按订单号模糊搜索、按下拉状态筛选
- 查看详情弹窗（完整订单信息）
- **导出 Excel**

#### 货物管理 (`/admin/cargo`)
- 表格展示：ID、货物名、类型、重量、体积、关联订单号、创建时间

#### 发送通知 (`/admin/notification`)
- 表单：用户ID（数字）、角色（下拉：货主/海运公司/管理员）、标题、内容
- 提交后调用 `POST /admin/notifications`

---

### 货主端（12 个页面）

#### 工作台 (`/shipper/dashboard`)
- 4 项统计卡片：总订单、运输中、已完成、已取消（来自 `/reports/orders`）
- 3 项辅助统计：总重量、总费用、已完成订单数
- 最近订单表格（8 条）

#### 创建订单 (`/shipper/order/create`) — 5 步向导

| 步骤 | 内容 | 验证 |
|------|------|------|
| 1. 选择港口 | 出发城市→起运港、目的城市→目的港、预估吨位 | 城市/港口必选 |
| 2. 航程推荐 | 自动加载可用航线（按剩余容量排序），单选用radio选择 | 必须选一条 |
| 3. 货物信息 | 动态表格：名称、类型（散货/集装箱/液体）、数量、重量、体积 | 名称+重量必填 |
| 4. 联系方式 | 发货联系人、收货联系人、期望发/到货日期 | 可选 |
| 5. 确认提交 | 订单概览（港口、航线、船舶、货物、联系人） | 提交确认 |

提交后 `POST /orders`，状态设为 **待确认**，等待海运公司审核。

#### 订单列表 (`/shipper/order/list`)
- 搜索：订单号（模糊）、状态（下拉）
- 操作：查看详情、跟踪、取消（待确认/已确认状态可取消）
- 详情弹窗：完整订单信息（含货主公司、城市、联系人、日期、费用等）

#### 订单详情 (`/shipper/order/detail/:id`)
- 基本信息：订单号、状态、起运港、目的港、重量、体积、费用、支付状态、联系人、时间
- **航线信息**：自动加载航线港口序列，展示完整路线（起运港 → 途经港 → 目的港）
- 货物清单表格
- 装货/卸货通知
- 操作：取消订单、去支付、跟踪

#### 订单追踪 (`/shipper/tracking`)
- **分栏布局**：
  - 左栏：订单列表（按状态筛选），点击行自动查询追踪
  - 右栏：追踪详情（订单号、状态、船舶、航线、计划/实际时间）
  - 顶栏：保留手动输入订单ID查询功能

#### 基础数据查看
- **港口列表/详情**：分页列表 + 详情（含城市、国家、坐标）
- **船舶列表/详情**：分页列表 + 详情（IMO、载重、航速、集装箱容量、船公司）
- **航线列表/详情**：分页列表 + 详情（含港口顺序时间线，自动从 port_sequence 解析港口名）

---

### 海运公司端（10 个页面）

#### 工作台 (`/shipping/dashboard`)
- 4 项统计卡片：船舶数、航线数、待处理、运输中
- 最近订单表格

#### 订单管理 (`/shipping/order/list`)
- 搜索：订单号、状态
- 操作：查看详情弹窗、**更新状态**（待确认→已确认→运输中→已完成）、取消
- 数据隔离：只能看到本公司航线相关的订单

#### 航线申请 (`/shipping/voyage/create`)
- 表单：航线（下拉，显示起止港+总距离）、船舶（下拉，显示航速）、启航日期、单价（元/吨）
- **多停靠港表格**：动态添加行，每行包含港口（下拉+国家）、计划到达/离港时间
- 表格行类型标注：**起始港**（蓝色）、**途经**（灰色）、**目的港**（黄色）
- 航次概览：自动生成路线预览 `广州港 → 新加坡港 → ...`
- 提交后逐一创建靠泊记录 + 自动生成货物通知单

#### 航次管理 (`/shipping/voyage/manage`)
- 表格展示本公司所有靠泊记录：日期、顺序、港口、计划/实际到达/离港时间
- 操作：更新实际到达/离港时间

#### 统计报表 (`/shipping/report`)
- 订单统计：选日期范围，展示总订单数、总重量、总费用、已完成/取消/运输中
- 航次利用率：选航线+船舶+航次日期，展示最大载重、已使用吨位、利用率百分比

#### 基础数据查看（按公司隔离）
- 只能看到本公司拥有的船舶和航线

---

## 快速开始

### 环境要求

- Node.js >= 18.x（推荐 20.x LTS）
- npm >= 9.x
- Git（可选，用于版本控制）

### 安装

```bash
# 进入项目目录
cd frontend

# 安装依赖
npm install
```

### 开发运行

```bash
npm run dev
```

终端显示：

```
VITE v6.4.0  ready in 300ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

### 构建

```bash
# 生产构建
npm run build

# 预览构建结果
npm run preview
```

构建产物输出到 `dist/` 目录。

---

## 项目结构

```
frontend/
├── index.html                     # HTML 入口（挂载 #app）
├── vite.config.js                 # Vite 配置（代理、别名）
├── package.json                   # 依赖和脚本
├── README.md                      # 本文件
├── public/                        # 静态资源
└── src/
    ├── main.js                    # 应用入口（ElementPlus 注册 + 全局错误处理）
    ├── App.vue                    # 根组件（<router-view />）
    ├── api/                       # API 请求层
    │   ├── request.js             # Axios 实例 + 请求/响应拦截器
    │   ├── auth.js                # 登录、注册、改密
    │   ├── order.js               # 订单 CRUD + 追踪
    │   ├── data.js                # 基础数据查询
    │   ├── admin.js               # 管理员功能
    │   ├── voyage.js              # 航次靠泊
    │   ├── report.js              # 统计报表
    │   └── notification.js        # 通知
    ├── router/
    │   └── index.js               # 路由配置 + 导航守卫
    ├── styles/
    │   ├── variables.css          # CSS 变量
    │   └── global.css             # Element Plus 样式覆盖
    ├── components/
    │   ├── PasswordChangeDialog.vue   # 密码修改弹窗
    │   └── CompanyProfileDialog.vue   # 公司资料弹窗
    └── views/
        ├── login/LoginPage.vue
        ├── register/RegisterPage.vue
        ├── NotFoundPage.vue
        ├── shipper/               # 12 个页面
        │   ├── Layout.vue
        │   ├── DashboardPage.vue
        │   ├── OrderListPage.vue
        │   ├── CreateOrderPage.vue
        │   ├── OrderDetailPage.vue
        │   ├── TrackingPage.vue
        │   ├── PortListPage.vue
        │   ├── PortDetailPage.vue
        │   ├── VesselListPage.vue
        │   ├── VesselDetailPage.vue
        │   ├── LineListPage.vue
        │   └── LineDetailPage.vue
        ├── shipping/              # 10 个页面
        │   ├── Layout.vue
        │   ├── DashboardPage.vue
        │   ├── OrderListPage.vue
        │   ├── CreateVoyagePage.vue
        │   ├── VoyageManagePage.vue
        │   ├── ReportPage.vue
        │   ├── PortListPage.vue
        │   ├── PortDetailPage.vue
        │   ├── VesselListPage.vue
        │   ├── VesselDetailPage.vue
        │   ├── LineListPage.vue
        │   └── LineDetailPage.vue
        └── admin/                 # 11 个页面
            ├── Layout.vue
            ├── DashboardPage.vue
            ├── ShipperPage.vue
            ├── ShippingPage.vue
            ├── AdminListPage.vue
            ├── CityManagePage.vue
            ├── PortManagePage.vue
            ├── VesselManagePage.vue
            ├── LineManagePage.vue
            ├── OrderListPage.vue
            ├── CargoPage.vue
            └── NotificationPage.vue
```

---

## 路由设计

| 路径 | 角色 | 页面 |
|------|------|------|
| `/` | - | 重定向到 `/login` |
| `/login` | 公开 | 登录 |
| `/register` | 公开 | 注册 |
| `/shipper/*` | 货主 | Layout + 子页面 |
| `/shipping/*` | 海运公司 | Layout + 子页面 |
| `/admin/*` | 管理员 | Layout + 子页面 |
| `/:pathMatch(.*)*` | 公开 | 404 页面 |

### 子路由

**shipper 子路由：**
- `dashboard`、`order/list`、`order/create`、`order/detail/:id`、`tracking`、`port/list`、`port/detail/:id`、`vessel/list`、`vessel/detail/:id`、`line/list`、`line/detail/:id`

**shipping 子路由：**
- `dashboard`、`order/list`、`port/list`、`port/detail/:id`、`vessel/list`、`vessel/detail/:id`、`line/list`、`line/detail/:id`、`voyage/create`、`voyage/manage`、`report`

**admin 子路由：**
- `dashboard`、`shipper`、`shipping`、`admin/list`、`port`、`vessel`、`line`、`order/list`、`cargo`、`city`、`notification`

---

## API 对接

### 基础配置

```js
// vite.config.js
server: {
  port: 5173,
  proxy: {
    '/api/v1': { target: 'http://localhost:8080', changeOrigin: true },
    '/ws': { target: 'http://localhost:8080', ws: true }
  }
}
```

### Axios 请求拦截

```js
// src/api/request.js
1. 请求拦截：从 localStorage 读取 access_token，附加到 Authorization header
2. 响应成功拦截：检查 code === 0，非零则 reject
3. 响应错误拦截：
   - 401 时自动用 refresh_token 获取新 access_token
   - 刷新成功则重试原请求
   - 刷新失败则清除登录信息跳转登录页
   4. 并发 401 请求排队，只刷新一次 token
```

### API 列表

#### 认证
| 方法 | 路径 | 说明 | 前端调用 |
|------|------|------|---------|
| POST | `/auth/login` | 登录（返回 token + role + company_name） | `loginApi()` |
| POST | `/auth/refresh` | 刷新 access_token | 拦截器自动调用 |
| GET | `/auth/me` | 获取当前用户信息 | `getCurrentUserApi()` |

#### 注册
| 方法 | 路径 | 说明 | 前端调用 |
|------|------|------|---------|
| POST | `/shipper/register` | 货主注册 | `shipperRegisterApi()` |
| POST | `/shipping/register` | 海运公司注册 | `shippingRegisterApi()` |

#### 订单
| 方法 | 路径 | 说明 | 前端调用 |
|------|------|------|---------|
| POST | `/orders` | 创建订单 | `createOrderApi()` |
| GET | `/orders/:id` | 订单详情（含关联数据） | `getOrderDetailApi()` |
| GET | `/orders` | 订单列表（支持搜索/排序/分页） | `getOrderListApi()` |
| POST | `/orders/:id/cancel` | 取消订单 | `cancelOrderApi()` |
| PUT | `/orders/:id/status` | 更新状态 `{status: int}` | `updateOrderStatusApi()` |
| POST | `/orders/:id/pay` | 虚拟支付 | `payOrderApi()` |
| GET | `/orders/:id/tracking` | 订单追踪信息 | `getOrderTrackingApi()` |

#### 航次
| 方法 | 路径 | 说明 | 前端调用 |
|------|------|------|---------|
| GET | `/voyages/recommend` | 推荐航线 | `getVoyageRecommendApi()` |
| POST | `/voyages/berthing` | 创建靠泊记录 | `createVoyageBerthingApi()` |
| GET | `/voyages/my` | 本公司航次列表 | `request.get()` |

#### 基础数据
| 方法 | 路径 | 说明 | 前端调用 |
|------|------|------|---------|
| GET | `/cities` | 城市列表 | `getCityListApi()` |
| GET | `/ports` | 港口列表（支持 city_id 筛选） | `getPortListApi()` |
| GET | `/ports/:id` | 港口详情（含城市对象） | `getPortDetailApi()` |
| GET | `/vessels` | 船舶列表（shipping 角色自动过滤） | `getVesselListApi()` |
| GET | `/vessels/:id` | 船舶详情（含船公司） | `getVesselDetailApi()` |
| GET | `/shipping-lines` | 航线列表（shipping 角色自动过滤） | `getLineListApi()` |
| GET | `/shipping-lines/:id` | 航线详情 | `getLineDetailApi()` |
| GET | `/shipping-lines/:id/port-sequence` | 港口序列 `{"port_sequence":[1,2,3]}` | `getLinePortSequenceApi()` |

#### 报表
| 方法 | 路径 | 说明 | 前端调用 |
|------|------|------|---------|
| GET | `/reports/orders` | 订单统计（需 start_date/end_date） | `getOrderStatsApi()` |
| GET | `/reports/voyage-utilization` | 航次利用率 | `getVoyageUtilizationApi()` |

#### 管理员
| 方法 | 路径 | 说明 | 前端调用 |
|------|------|------|---------|
| POST | `/admin/cities` | 创建城市 | `createCityApi()` |
| PUT | `/admin/cities/:id` | 更新城市 | `updateCityApi()` |
| DELETE | `/admin/cities/:id` | 删除城市 | `deleteCityApi()` |
| POST | `/admin/ports` | 创建港口 | `createPortApi()` |
| ... | ... | ... | ... |

---

## 认证与鉴权

### 双 Token 机制

| Token | 有效期 | 用途 |
|-------|--------|------|
| access_token | 24 小时 | API 请求认证（Authorization header） |
| refresh_token | 7 天 | 换取新的 access_token |

### 自动刷新流程

```
1. 请求 → 401 响应
2. 检查是否有 refresh_token
3. 有 → POST /auth/refresh {refresh_token}
4. 成功 → 保存新 access_token → 重试原请求
5. 失败 → 清除登录信息 → 跳转登录页
```

### 角色

| 角色值 | 中文名 | 说明 |
|--------|--------|------|
| `shipper` | 货主 | 创建和管理订单 |
| `shipping` | 海运公司 | 管理航线、航次、订单状态 |
| `admin` | 管理员 | 系统管理 |

### 数据隔离

| 数据 | 货主 | 海运公司 | 管理员 |
|------|------|---------|-------|
| 订单 | 仅自己的 | 仅本公司航线相关的 | 全部 |
| 船舶 | 全部（查看） | 仅本公司的 | 全部 |
| 航线 | 全部（查看） | 仅本公司的 | 全部 |
| 靠泊记录 | - | 仅本公司的 | - |
| 城市/港口 | 全部 | 全部 | 全部 |

---

## 数据权限模型

### 后端隔离实现

| 端点 | 隔离方式 |
|------|---------|
| `GET /orders` | shipper→`shipper_company_id = JWT user_id` |
| | shipping→JOIN shipping_line WHERE shipping_company_id = JWT user_id |
| `GET /orders/:id` | shipping→CheckOrderBelongsToShippingCompany |
| | shipper→CheckOrderBelongsToShipper |
| `POST /orders/:id/pay` | 仅 shipper 可支付，且必须是自己公司的订单 |
| `PUT /orders/:id/status` | 仅 shipping/admin 可更新状态 |
| `GET /vessels` | shipping→仅本公司船舶 |
| `GET /shipping-lines` | shipping→仅本公司航线 |
| `POST /voyages/berthing` | 仅 shipping/admin 可创建 |
| `GET /reports/orders` | shipping→仅本公司数据 |
| | shipper→仅本公司数据 |

---

## 测试账号

运行后端种子数据后可用：

```bash
# 运行种子（清空并重建数据）
cd backend && go run ./cmd/seed
```

| 角色 | 用户名 | 密码 | 公司名 | 说明 |
|------|--------|------|--------|------|
| 管理员 | `admin` | `admin123` | 系统管理员 | 全部管理权限 |
| 货主 | `shipper01` | `123456` | 中国远洋贸易有限公司 | 3个订单(已确认/待确认/运输中) |
| 货主 | `shipper02` | `123456` | 上海国际矿业资源公司 | 2个订单(待确认/待确认) |
| 货主 | `shipper03` | `123456` | 深圳华远物流有限公司 | 2个订单(待确认/待确认) |
| 海运公司 | `cosco` | `123456` | 中国远洋海运集团 | 4艘船、5条航线、3个订单 |
| 海运公司 | `maersk` | `123456` | 马士基航运(中国)有限公司 | 4艘船、3条航线、1个订单 |
| 海运公司 | `msc` | `123456` | 地中海航运有限公司 | 4艘船、3条航线、1个订单 |
| 海运公司 | `cma` | `123456` | 达飞轮船(中国)有限公司 | 4艘船、3条航线、1个订单 |

### 种子数据量

| 表 | 数量 |
|----|------|
| 城市 | 20 个（含广州/上海/东京/鹿特丹等） |
| 港口 | 20 个 |
| 泊位 | 40 个 |
| 货主 | 3 家 |
| 海运公司 | 4 家 |
| 船舶 | 16 艘（每家4艘） |
| 航线 | 15 条（覆盖亚欧/跨太平洋/中非/欧美） |
| 航次 | 10 个（共50条靠泊记录） |
| 订单 | 10 个（含多种状态） |

---

## 开发指南

### 编码规范

- 使用 Vue 3 Composition API + `<script setup>`
- 不使用 `lang="ts"`（纯 JavaScript）
- 组件名使用 PascalCase
- API 函数使用 `xxxApi` 命名规范
- 所有文本使用中文
- 样式使用 scoped CSS

### 新增页面步骤

1. 在对应角色目录下创建 `.vue` 文件
2. 在 `router/index.js` 添加路由
3. 在 Layout 中添加侧栏菜单项
4. 在 Layout 的 `pageTitle` map 中添加标题映射
5. 在 Layout 的 `activeMenu` computed 中添加路径映射

### 新增 API 步骤

1. 在 `src/api/` 下对应文件添加函数
2. 函数命名：`资源操作Api`（如 `createOrderApi`）
3. 使用 `request.get/post/put/delete` 方法

### 状态标签

```js
// 所有页面统一的订单状态标签
const tagType = s => ({ 0: 'info', 1: 'primary', 2: 'warning', 3: 'success', 4: 'danger' })[s] || 'info'
const tagLabel = s => ({ 0: '待确认', 1: '已确认', 2: '运输中', 3: '已完成', 4: '已取消' })[s] || s
```

### 费用显示

```js
// 统一格式
`¥${(row.total_cost || 0).toFixed(2)}`
```

### 分页处理

```js
const res = await getOrderListApi(params)
list.value = res.data || []      // 数据数组
total.value = res.meta?.total || 0  // 总记录数
```

---

## 部署指南

### 生产构建

```bash
npm run build
```

构建产物在 `dist/` 目录。

### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/frontend/dist;
    index index.html;

    # SPA 路由支持：所有路径返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端
    location /api/v1 {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket 代理
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_BASE` | API 基础路径 | `/api/v1`（在 request.js 中配置） |

---

## 常见问题

### Q: 页面白屏，控制台报 `Cannot read properties of undefined (reading 'getItem')`
A: 这是浏览器缓存问题，清除缓存（Ctrl+F5）或硬刷新即可。如持续出现，检查浏览器是否禁用了 localStorage。

### Q: 登录后跳转到空白页
A：检查网络请求是否正常返回。打开 F12 → Network，看 `/auth/login` 是否返回 200。如果登录失败，确认用户名密码正确且后端已启动。如果登录成功但页面空白，清除缓存后重试。

### Q: 接口返回 401
A：Token 过期或无效。检查后端配置中 `jwt.access_expire` 是否足够长（建议 24h）。前端的自动刷新机制会处理续期。

### Q: 创建订单时找不到推荐航线
A：需要海运公司先在该航线上创建航次靠泊记录（航线申请），系统会自动生成货物通知单，该航次才会出现在推荐列表中。检查种子数据是否已运行。

### Q: `npm install` 报错
A：确认 Node.js 版本 >= 18。尝试删除 `node_modules` 后重新安装：
```bash
Remove-Item -Recurse -Force node_modules
npm install
```

### Q: 端口被占用
A：修改 `vite.config.js` 中的 `server.port`。

---

## 许可证

MIT
