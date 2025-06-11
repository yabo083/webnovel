# 小说写作系统

一个专注于核心码字功能的Web小说写作系统，提供简洁高效的创作体验。

## 功能特色

### 核心功能
- **用户认证**：注册、登录、安全的JWT身份验证
- **我的书架**：管理您的所有小说作品
- **章节目录**：清晰的章节结构管理
- **写作编辑器**：专业的码字环境，支持自动保存和实时字数统计

### 编辑器特性
- ✅ **自动保存**：2秒防抖自动保存，防止内容丢失
- ✅ **实时字数统计**：精确的中文字数统计
- ✅ **快捷键支持**：Ctrl+S快速保存
- ✅ **离开确认**：未保存时离开页面会提醒
- ✅ **移动端适配**：响应式设计，支持手机写作

## 技术栈

### 后端
- **Node.js** + **Express**：高性能的服务器框架
- **SQLite**：轻量级数据库（可切换至MySQL/PostgreSQL）
- **Sequelize**：强大的ORM工具
- **JWT**：安全的身份验证
- **bcryptjs**：密码加密

### 前端
- **Vue 3**：现代化的前端框架
- **Element Plus**：美观的UI组件库
- **Vue Router**：路由管理
- **Pinia**：状态管理
- **Axios**：HTTP客户端
- **Vite**：快速的构建工具

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖
```bash
# 安装所有依赖
npm run install:all
```

### 启动开发服务器
```bash
# 同时启动前后端开发服务器
npm run dev
```

服务器将在以下地址启动：
- 前端：http://localhost:5173
- 后端：http://localhost:3000

### 单独启动服务
```bash
# 只启动后端
npm run server:dev

# 只启动前端
npm run client:dev
```

## 项目结构

```
webnovel-writing-system/
├── server/                 # 后端代码
│   ├── models/            # 数据模型
│   ├── routes/            # API路由
│   ├── middleware/        # 中间件
│   └── server.js          # 服务器入口
├── client/                # 前端代码
│   ├── src/
│   │   ├── views/         # 页面组件
│   │   ├── stores/        # 状态管理
│   │   ├── utils/         # 工具函数
│   │   └── router/        # 路由配置
│   └── index.html         # 前端入口
└── README.md              # 项目说明
```

## 使用指南

### 1. 注册/登录
首次使用需要注册账号，支持用户名和邮箱登录。

### 2. 创建小说
在书架页面点击"创建新书"，填写小说信息。

### 3. 添加章节
进入小说详情页，点击"新建章节"开始创作。

### 4. 写作体验
- 编辑器支持大文本编写
- 自动保存功能确保内容安全
- 实时字数统计帮助掌控进度
- 支持章节发布状态管理

## API接口

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取用户信息

### 小说管理
- `GET /api/novels` - 获取用户小说列表
- `POST /api/novels` - 创建新小说
- `PUT /api/novels/:id` - 更新小说信息
- `DELETE /api/novels/:id` - 删除小说

### 章节管理
- `GET /api/novels/:id/chapters` - 获取章节列表
- `POST /api/chapters` - 创建新章节
- `GET /api/chapters/:id` - 获取章节内容
- `PUT /api/chapters/:id` - 更新章节
- `PUT /api/chapters/:id/autosave` - 自动保存
- `DELETE /api/chapters/:id` - 删除章节

## 数据库设计

### 用户表 (users)
- id, username, email, password, avatar, bio
- created_at, updated_at

### 小说表 (novels)
- id, user_id, title, description, category, status
- total_words, total_chapters, last_updated
- created_at, updated_at

### 章节表 (chapters)
- id, novel_id, title, content, word_count
- order_index, status, publish_time
- created_at, updated_at

## 开发说明

### 环境配置
复制 `server/.env.example` 为 `server/.env` 并修改配置：
```env
PORT=3000
JWT_SECRET=your_jwt_secret
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite
```

### 生产部署
1. 构建前端：`cd client && npm run build`
2. 配置生产环境变量
3. 启动后端服务器：`cd server && npm start`

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！ 