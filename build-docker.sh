#!/bin/bash

echo "🐳 开始构建小说创作系统Docker镜像..."

# 清理之前的构建
echo "🧹 清理Docker缓存..."
docker system prune -f

# 构建镜像
echo "📦 构建镜像..."
docker build -t webnovel . --no-cache

if [ $? -eq 0 ]; then
    echo "✅ 镜像构建成功!"
    echo "📊 镜像信息:"
    docker images | grep webnovel
    echo ""
    echo "🚀 可以使用以下命令启动:"
    echo "   docker-compose up -d"
    echo "   或者"
    echo "   docker run -d -p 3000:3000 -p 5173:5173 -v webnovel_data:/app/data webnovel"
else
    echo "❌ 镜像构建失败!"
    exit 1
fi 