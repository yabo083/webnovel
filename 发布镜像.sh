#!/bin/bash

# 发布 Docker 镜像到 Docker Hub 的脚本

# 配置变量
DOCKER_USERNAME="your-username"  # 替换为你的Docker Hub用户名
IMAGE_NAME="webnovel"
VERSION="latest"

echo "🐳 开始构建和发布小说创作系统镜像..."

# 1. 构建镜像
echo "📦 构建镜像中..."
docker build -t $DOCKER_USERNAME/$IMAGE_NAME:$VERSION .

if [ $? -ne 0 ]; then
    echo "❌ 镜像构建失败!"
    exit 1
fi

# 2. 检查镜像大小
echo "📊 镜像信息:"
docker images | grep $IMAGE_NAME

# 3. 登录 Docker Hub
echo "🔑 登录 Docker Hub..."
docker login

if [ $? -ne 0 ]; then
    echo "❌ Docker Hub 登录失败!"
    exit 1
fi

# 4. 推送镜像
echo "🚀 推送镜像到 Docker Hub..."
docker push $DOCKER_USERNAME/$IMAGE_NAME:$VERSION

if [ $? -ne 0 ]; then
    echo "❌ 镜像推送失败!"
    exit 1
fi

# 5. 创建多个标签（可选）
if [ ! -z "$1" ]; then
    echo "🏷️  创建版本标签: $1"
    docker tag $DOCKER_USERNAME/$IMAGE_NAME:$VERSION $DOCKER_USERNAME/$IMAGE_NAME:$1
    docker push $DOCKER_USERNAME/$IMAGE_NAME:$1
fi

echo "✅ 镜像发布成功!"
echo "📥 用户可以通过以下命令获取镜像:"
echo "   docker pull $DOCKER_USERNAME/$IMAGE_NAME:$VERSION"
echo ""
echo "🚀 快速启动命令:"
echo "   docker run -d -p 3000:3000 -p 5173:5173 -v webnovel_data:/app/data $DOCKER_USERNAME/$IMAGE_NAME:$VERSION" 