const express = require('express');
const db = require('../models');
const { Novel, Chapter } = db;
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取当前用户的所有小说
router.get('/', authenticateToken, async (req, res) => {
  try {
    const novels = await Novel.findAll({
      where: { user_id: req.user.id },
      order: [['last_updated', 'DESC']],
      include: [{
        model: Chapter,
        as: 'chapters',
        attributes: ['id'],
        required: false
      }]
    });

    // 计算每本小说的章节数
    const novelsWithStats = novels.map(novel => {
      const novelData = novel.toJSON();
      novelData.chapter_count = novel.chapters ? novel.chapters.length : 0;
      delete novelData.chapters;
      return novelData;
    });

    res.json({ novels: novelsWithStats });
  } catch (error) {
    console.error('Get novels error:', error);
    res.status(500).json({ message: '获取小说列表失败' });
  }
});

// 获取单个小说详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const novel = await Novel.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id 
      }
    });

    if (!novel) {
      return res.status(404).json({ message: '小说不存在' });
    }

    res.json({ novel });
  } catch (error) {
    console.error('Get novel error:', error);
    res.status(500).json({ message: '获取小说详情失败' });
  }
});

// 创建新小说
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: '小说标题不能为空' });
    }

    const novel = await Novel.create({
      user_id: req.user.id,
      title: title.trim(),
      description: description?.trim() || '',
      category: category || '其他',
      last_updated: new Date()
    });

    res.status(201).json({
      message: '小说创建成功',
      novel
    });
  } catch (error) {
    console.error('Create novel error:', error);
    res.status(500).json({ message: '创建小说失败' });
  }
});

// 更新小说信息
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, status } = req.body;

    const novel = await Novel.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id 
      }
    });

    if (!novel) {
      return res.status(404).json({ message: '小说不存在' });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: '小说标题不能为空' });
    }

    await novel.update({
      title: title.trim(),
      description: description?.trim() || novel.description,
      category: category || novel.category,
      status: status || novel.status,
      last_updated: new Date()
    });

    res.json({
      message: '小说更新成功',
      novel
    });
  } catch (error) {
    console.error('Update novel error:', error);
    res.status(500).json({ message: '更新小说失败' });
  }
});

// 删除小说
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const novel = await Novel.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id 
      }
    });

    if (!novel) {
      return res.status(404).json({ message: '小说不存在' });
    }

    // 删除所有相关章节
    await Chapter.destroy({
      where: { novel_id: novel.id }
    });

    // 删除小说
    await novel.destroy();

    res.json({ message: '小说删除成功' });
  } catch (error) {
    console.error('Delete novel error:', error);
    res.status(500).json({ message: '删除小说失败' });
  }
});

// 获取小说的章节列表
router.get('/:id/chapters', authenticateToken, async (req, res) => {
  try {
    const novel = await Novel.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id 
      }
    });

    if (!novel) {
      return res.status(404).json({ message: '小说不存在' });
    }

    const chapters = await Chapter.findAll({
      where: { novel_id: req.params.id },
      order: [['order_index', 'ASC']],
      attributes: ['id', 'title', 'word_count', 'status', 'order_index', 'created_at', 'updated_at']
    });

    res.json({ 
      novel: { id: novel.id, title: novel.title },
      chapters 
    });
  } catch (error) {
    console.error('Get chapters error:', error);
    res.status(500).json({ message: '获取章节列表失败' });
  }
});

module.exports = router; 