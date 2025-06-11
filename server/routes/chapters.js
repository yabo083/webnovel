const express = require('express');
const db = require('../models');
const { Chapter, Novel } = db;
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 工具函数：计算字数
const countWords = (content) => {
  if (!content) return 0;
  // 去除HTML标签和空白字符，然后计算字数
  const plainText = content.replace(/<[^>]*>/g, '').replace(/\s/g, '');
  return plainText.length;
};

// 获取章节详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const chapter = await Chapter.findOne({
      where: { id: req.params.id },
      include: [{
        model: Novel,
        as: 'novel',
        attributes: ['id', 'title', 'user_id'],
        required: true
      }]
    });

    if (!chapter) {
      return res.status(404).json({ message: '章节不存在' });
    }

    // 检查权限
    if (chapter.novel.user_id !== req.user.id) {
      return res.status(403).json({ message: '无权访问此章节' });
    }

    res.json({ chapter });
  } catch (error) {
    console.error('Get chapter error:', error);
    res.status(500).json({ message: '获取章节失败' });
  }
});

// 创建新章节
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { novel_id, title, content } = req.body;

    if (!novel_id || !title || title.trim().length === 0) {
      return res.status(400).json({ message: '小说ID和章节标题不能为空' });
    }

    // 验证小说所有权
    const novel = await Novel.findOne({
      where: { 
        id: novel_id,
        user_id: req.user.id 
      }
    });

    if (!novel) {
      return res.status(404).json({ message: '小说不存在或无权限' });
    }

    // 获取最大的order_index
    const maxChapter = await Chapter.findOne({
      where: { novel_id },
      order: [['order_index', 'DESC']],
      attributes: ['order_index']
    });

    const nextOrderIndex = maxChapter ? maxChapter.order_index + 1 : 1;
    const wordCount = countWords(content);

    const chapter = await Chapter.create({
      novel_id,
      title: title.trim(),
      content: content || '',
      word_count: wordCount,
      order_index: nextOrderIndex
    });

    // 更新小说的章节数和总字数
    await updateNovelStats(novel_id);

    res.status(201).json({
      message: '章节创建成功',
      chapter
    });
  } catch (error) {
    console.error('Create chapter error:', error);
    res.status(500).json({ message: '创建章节失败' });
  }
});

// 更新章节内容
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, content, status } = req.body;

    const chapter = await Chapter.findOne({
      where: { id: req.params.id },
      include: [{
        model: Novel,
        as: 'novel',
        attributes: ['id', 'user_id'],
        required: true
      }]
    });

    if (!chapter) {
      return res.status(404).json({ message: '章节不存在' });
    }

    // 检查权限
    if (chapter.novel.user_id !== req.user.id) {
      return res.status(403).json({ message: '无权修改此章节' });
    }

    const updateData = {};
    
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return res.status(400).json({ message: '章节标题不能为空' });
      }
      updateData.title = title.trim();
    }

    if (content !== undefined) {
      updateData.content = content;
      updateData.word_count = countWords(content);
    }

    if (status !== undefined) {
      updateData.status = status;
      if (status === '已完结' && !chapter.publish_time) {
        updateData.publish_time = new Date();
      }
    }

    await chapter.update(updateData);

    // 更新小说统计
    await updateNovelStats(chapter.novel_id);

    res.json({
      message: '章节更新成功',
      chapter: await chapter.reload()
    });
  } catch (error) {
    console.error('Update chapter error:', error);
    res.status(500).json({ message: '更新章节失败' });
  }
});

// 自动保存章节内容
router.put('/:id/autosave', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;

    const chapter = await Chapter.findOne({
      where: { id: req.params.id },
      include: [{
        model: Novel,
        as: 'novel',
        attributes: ['id', 'user_id'],
        required: true
      }]
    });

    if (!chapter) {
      return res.status(404).json({ message: '章节不存在' });
    }

    // 检查权限
    if (chapter.novel.user_id !== req.user.id) {
      return res.status(403).json({ message: '无权修改此章节' });
    }

    const wordCount = countWords(content);

    await chapter.update({
      content: content || '',
      word_count: wordCount
    });

    // 静默更新小说统计
    await updateNovelStats(chapter.novel_id);

    res.json({
      message: '自动保存成功',
      word_count: wordCount,
      last_saved: new Date()
    });
  } catch (error) {
    console.error('Autosave chapter error:', error);
    res.status(500).json({ message: '自动保存失败' });
  }
});

// 删除章节
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const chapter = await Chapter.findOne({
      where: { id: req.params.id },
      include: [{
        model: Novel,
        as: 'novel',
        attributes: ['id', 'user_id'],
        required: true
      }]
    });

    if (!chapter) {
      return res.status(404).json({ message: '章节不存在' });
    }

    // 检查权限
    if (chapter.novel.user_id !== req.user.id) {
      return res.status(403).json({ message: '无权删除此章节' });
    }

    const novelId = chapter.novel_id;

    await chapter.destroy();

    // 更新小说统计
    await updateNovelStats(novelId);

    res.json({ message: '章节删除成功' });
  } catch (error) {
    console.error('Delete chapter error:', error);
    res.status(500).json({ message: '删除章节失败' });
  }
});

// 更新章节顺序
router.put('/:id/order', authenticateToken, async (req, res) => {
  try {
    const { new_order_index } = req.body;

    if (typeof new_order_index !== 'number' || new_order_index < 1) {
      return res.status(400).json({ message: '无效的排序索引' });
    }

    const chapter = await Chapter.findOne({
      where: { id: req.params.id },
      include: [{
        model: Novel,
        as: 'novel',
        attributes: ['id', 'user_id'],
        required: true
      }]
    });

    if (!chapter) {
      return res.status(404).json({ message: '章节不存在' });
    }

    // 检查权限
    if (chapter.novel.user_id !== req.user.id) {
      return res.status(403).json({ message: '无权修改此章节' });
    }

    const oldOrderIndex = chapter.order_index;
    
    if (oldOrderIndex === new_order_index) {
      return res.json({ message: '章节顺序未改变' });
    }

    // 更新其他章节的排序
    if (new_order_index > oldOrderIndex) {
      // 向后移动，其他章节前移
      await Chapter.update(
        { order_index: db.Sequelize.literal('order_index - 1') },
        {
          where: {
            novel_id: chapter.novel_id,
            order_index: { [db.Sequelize.Op.gt]: oldOrderIndex, [db.Sequelize.Op.lte]: new_order_index }
          }
        }
      );
    } else {
      // 向前移动，其他章节后移
      await Chapter.update(
        { order_index: db.Sequelize.literal('order_index + 1') },
        {
          where: {
            novel_id: chapter.novel_id,
            order_index: { [db.Sequelize.Op.gte]: new_order_index, [db.Sequelize.Op.lt]: oldOrderIndex }
          }
        }
      );
    }

    // 更新当前章节的排序
    await chapter.update({ order_index: new_order_index });

    res.json({ message: '章节顺序更新成功' });
  } catch (error) {
    console.error('Update chapter order error:', error);
    res.status(500).json({ message: '更新章节顺序失败' });
  }
});

// 工具函数：更新小说统计信息
async function updateNovelStats(novelId) {
  try {
    const chapters = await Chapter.findAll({
      where: { novel_id: novelId },
      attributes: ['word_count']
    });

    const totalWords = chapters.reduce((sum, chapter) => sum + (chapter.word_count || 0), 0);
    const totalChapters = chapters.length;

    await Novel.update(
      { 
        total_words: totalWords,
        total_chapters: totalChapters,
        last_updated: new Date()
      },
      { where: { id: novelId } }
    );
  } catch (error) {
    console.error('Update novel stats error:', error);
  }
}

module.exports = router; 