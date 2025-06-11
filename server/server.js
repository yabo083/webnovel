require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// 限流设置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP最多100个请求
});

// 中间件
app.use(limiter);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/novels', require('./routes/novels'));
app.use('/api/chapters', require('./routes/chapters'));

// 健康检查端点
app.get('/api/auth/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 生产环境下提供静态文件服务
if (process.env.NODE_ENV === 'production') {
  // 提供前端静态文件
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // 处理前端路由，返回index.html
  app.get('*', (req, res) => {
    // 排除API路由
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器内部错误' });
});

// 数据库同步并启动服务器 - 改进版本，避免约束冲突
const initDatabase = async () => {
  try {
    // 首次尝试正常同步
    await db.sequelize.sync({ 
      force: false,
      alter: false,  // 禁用自动修改表结构，避免约束冲突
      logging: false 
    });
    console.log('数据库连接成功');
  } catch (err) {
    console.error('数据库同步失败:', err.message);
    
    // 如果是约束错误，强制重建数据库
    if (err.name === 'SequelizeUniqueConstraintError' || 
        err.message.includes('UNIQUE constraint failed') ||
        err.message.includes('constraint failed')) {
      console.log('检测到约束冲突，正在重建数据库...');
      try {
        await db.sequelize.sync({ force: true, logging: false });
        console.log('数据库重建成功');
      } catch (rebuildErr) {
        console.error('数据库重建失败:', rebuildErr.message);
        process.exit(1);
      }
    } else {
      console.error('无法解决的数据库错误');
      process.exit(1);
    }
  }
  
  // 启动服务器
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
  });
};

initDatabase(); 