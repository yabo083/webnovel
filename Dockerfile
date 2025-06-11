# ====================================
# 阶段1: 构建前端应用
# ====================================
FROM node:18-alpine AS frontend-builder

# 设置工作目录
WORKDIR /app/client

# 复制前端package文件
COPY client/package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制前端源码
COPY client/ .

# 构建前端应用
RUN npm run build

# ====================================
# 阶段2: 准备后端运行环境
# ====================================
FROM node:18-alpine AS backend-setup

# 设置工作目录
WORKDIR /app/server

# 复制后端package文件
COPY server/package*.json ./

# 安装后端依赖
RUN npm ci --only=production && npm cache clean --force

# ====================================
# 阶段3: 最终运行镜像
# ====================================
FROM node:18-alpine AS production

# 安装必要的系统工具
RUN apk add --no-cache \
    sqlite \
    curl \
    && rm -rf /var/cache/apk/*

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 设置工作目录
WORKDIR /app

# 复制后端依赖和代码
COPY --from=backend-setup /app/server/node_modules ./server/node_modules
COPY server/ ./server/

# 复制构建好的前端静态文件
COPY --from=frontend-builder /app/client/dist ./client/dist

# 复制根目录的package.json和启动脚本
COPY package*.json ./

# 创建数据目录
RUN mkdir -p /app/data && \
    chown -R nextjs:nodejs /app

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000 5173

# 设置环境变量
ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/database.sqlite

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/auth/health || exit 1

# 启动命令
CMD ["npm", "start"] 