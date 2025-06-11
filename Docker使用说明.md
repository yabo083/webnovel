# 🐳 小说创作系统 Docker 部署指南

## 📋 系统要求

- Docker 20.10 或更高版本
- Docker Compose v2.0 或更高版本
- 至少 2GB 可用内存
- 至少 5GB 可用磁盘空间

## 🚀 快速开始

### 方法1：使用 Docker Compose（推荐）

```bash
# 1. 下载项目
git clone https://github.com/你的用户名/webnovel.git
cd webnovel

# 2. 启动服务
docker-compose up -d

# 3. 访问应用
# 前端界面：http://localhost:5173
# 后端API：http://localhost:3000
```

### 方法2：使用 Docker 命令

```bash
# 1. 构建镜像
docker build -t webnovel .

# 2. 创建数据卷
docker volume create webnovel_data

# 3. 运行容器
docker run -d \
  --name webnovel-app \
  -p 3000:3000 \
  -p 5173:5173 \
  -v webnovel_data:/app/data \
  webnovel
```

### 方法3：从 Docker Hub 拉取（发布后）

```bash
# 1. 拉取镜像
docker pull 你的用户名/webnovel:latest

# 2. 运行容器
docker run -d \
  --name webnovel-app \
  -p 3000:3000 \
  -p 5173:5173 \
  -v webnovel_data:/app/data \
  你的用户名/webnovel:latest
```

## 📁 数据持久化

### 数据存储位置
- **容器内路径**：`/app/data/database.sqlite`
- **Docker卷**：`webnovel_data`

### 备份数据
```bash
# 创建备份
docker run --rm -v webnovel_data:/data -v $(pwd):/backup alpine tar czf /backup/webnovel-backup.tar.gz -C /data .

# 恢复备份
docker run --rm -v webnovel_data:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/webnovel-backup.tar.gz"
```

## 🔧 常用命令

### 查看日志
```bash
# 查看实时日志
docker-compose logs -f

# 查看最近100行日志
docker-compose logs --tail 100
```

### 重启服务
```bash
# 重启所有服务
docker-compose restart

# 重启单个服务
docker-compose restart webnovel
```

### 停止服务
```bash
# 停止服务（保留数据）
docker-compose down

# 停止服务并删除数据
docker-compose down -v
```

### 更新应用
```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```

## 🌐 端口配置

| 服务 | 默认端口 | 说明 |
|------|---------|------|
| 前端应用 | 5173 | Vue.js 用户界面 |
| 后端API | 3000 | Node.js 接口服务 |

### 自定义端口
修改 `docker-compose.yml` 文件中的端口映射：

```yaml
ports:
  - "8080:5173"  # 将前端映射到8080端口
  - "8081:3000"  # 将后端映射到8081端口
```

## 🔒 安全建议

### 1. 生产环境配置
```yaml
# docker-compose.prod.yml
environment:
  - NODE_ENV=production
  - JWT_SECRET=your-super-secret-key
  - API_RATE_LIMIT=50  # 每15分钟最多50次请求
```

### 2. 防火墙设置
```bash
# 只允许特定IP访问
sudo ufw allow from 192.168.1.0/24 to any port 5173
sudo ufw allow from 192.168.1.0/24 to any port 3000
```

### 3. 反向代理（推荐）
使用 Nginx 或 Traefik 作为反向代理，提供 HTTPS 支持。

## 🛠 故障排查

### 常见问题

#### 1. 端口占用
```bash
# 检查端口占用
netstat -tulpn | grep :5173
netstat -tulpn | grep :3000

# 停止占用进程
sudo kill -9 [进程ID]
```

#### 2. 数据库连接失败
```bash
# 检查数据卷
docker volume ls | grep webnovel

# 检查权限
docker exec -it webnovel-app ls -la /app/data/
```

#### 3. 内存不足
```bash
# 限制容器内存使用
docker-compose up -d --memory=1g
```

### 日志分析
```bash
# 查看详细错误日志
docker-compose logs webnovel | grep ERROR

# 检查健康状态
docker-compose ps
```

## 📊 性能优化

### 1. 资源限制
```yaml
# docker-compose.yml
services:
  webnovel:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

### 2. 镜像优化
- 使用 Alpine Linux 基础镜像
- 多阶段构建减少镜像大小
- 清理包管理器缓存

### 3. 监控指标
```bash
# 查看资源使用情况
docker stats webnovel-app

# 查看镜像大小
docker images | grep webnovel
```

## 🔄 自动更新

### 使用 Watchtower 自动更新
```yaml
# docker-compose.yml
version: '3.8'
services:
  webnovel:
    # ... 现有配置
    
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 30 webnovel-app
```

这样您的小说创作系统就可以轻松部署到任何支持 Docker 的环境了！🎉 