const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../models');
const { User } = db;
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 验证输入
    if (!username || !email || !password) {
      return res.status(400).json({ message: '用户名、邮箱和密码都是必填项' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: '密码长度至少6位' });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.username === username ? '用户名已存在' : '邮箱已被注册' 
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    // 生成token
    const token = generateToken(user.id);

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: '注册失败，请稍后再试' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码都是必填项' });
    }

    // 查找用户
    const user = await User.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { username },
          { email: username }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 生成token
    const token = generateToken(user.id);

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '登录失败，请稍后再试' });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        avatar: req.user.avatar,
        bio: req.user.bio
      }
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ message: '获取用户信息失败' });
  }
});

module.exports = router; 