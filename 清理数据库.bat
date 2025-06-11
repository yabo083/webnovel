@echo off
echo 正在清理数据库...
del /f /q server\database.sqlite 2>nul
echo 数据库清理完成！
echo 下次启动服务器时将自动创建新的干净数据库。
pause 