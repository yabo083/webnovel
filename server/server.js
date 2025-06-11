require('dotenv').config();
const express = require('express');
const cors = require('cors');
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

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/novels', require('./routes/novels'));
app.use('/api/chapters', require('./routes/chapters'));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器内部错误' });
});

// 数据库同步并启动服务器
db.sequelize.sync({ alter: true }).then(() => {
  console.log('数据库连接成功');
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
  });
}).catch(err => {
  console.error('数据库连接失败:', err);
}); 