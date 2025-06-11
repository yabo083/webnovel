#!/bin/bash

echo "🔄 快速更新 Docker 镜像..."

# 检查是否有未提交的更改
if [[ -n $(git status -s) ]]; then
    echo "📝 发现未提交的更改，正在提交..."
    git add .
    git commit -m "更新: $(date '+%Y-%m-%d %H:%M:%S')"
fi

# 构建新镜像
echo "🔨 构建新镜像..."
docker build -t webnovel . --no-cache

if [ $? -ne 0 ]; then
    echo "❌ 构建失败!"
    exit 1
fi

# 测试本地启动
echo "🧪 测试本地启动..."
docker run --rm -d --name test-webnovel -p 3001:3000 webnovel
sleep 5

# 检查健康状态
if curl -f http://localhost:3001/api/auth/health >/dev/null 2>&1; then
    echo "✅ 本地测试通过!"
    docker stop test-webnovel
else
    echo "❌ 本地测试失败!"
    docker stop test-webnovel
    exit 1
fi

echo "🎉 镜像构建并测试成功!"
echo "📦 现在可以运行发布脚本推送到 Docker Hub" 