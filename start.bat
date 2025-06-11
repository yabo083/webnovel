@echo off
echo 正在启动小说写作系统...
echo.

echo 安装依赖包...
call npm install
cd server
call npm install
cd ../client
call npm install
cd ..

echo.
echo 启动服务器...
start "后端服务器" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak >nul
start "前端服务器" cmd /k "cd client && npm run dev"

echo.
echo 系统启动完成！
echo 前端地址: http://localhost:5173
echo 后端地址: http://localhost:3000
pause 