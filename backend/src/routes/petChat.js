// 文件路径: backend/src/routes/petChat.js
// 对应功能: 宠物档案交流记录 API（仅领养人和管理员可访问）
import express from 'express';
import { PetChat } from '../models/PetChat.js';
import { Adoption } from '../models/Adoption.js';
import { authenticateToken as authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 获取特定宠物的交流记录
// GET /api/pet-chat/:catId
router.get('/:catId', authMiddleware, async (req, res) => {
  try {
    const { catId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // 管理员可以直接访问
    if (userRole === 'admin' || userRole === 'superadmin') {
      const messages = await PetChat.find({ catId })
        .sort({ createdAt: -1 })
        .limit(50);
      return res.json({ success: true, data: { messages } });
    }

    // 普通用户：验证是否为该宠物的领养人
    const adoption = await Adoption.findOne({
      catId,
      userId,
      status: { $in: ['APPROVED', 'COMPLETED'] }
    });

    if (!adoption) {
      return res.status(403).json({
        success: false,
        error: '您不是该宠物的领养人，无法查看交流记录'
      });
    }

    const messages = await PetChat.find({ catId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: { messages } });
  } catch (error) {
    console.error('获取宠物交流记录失败:', error);
    res.status(500).json({ success: false, error: '获取交流记录失败' });
  }
});

// 发送交流消息
// POST /api/pet-chat
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { catId, content, type = 'general', isImportant = false } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const userName = req.user.username || req.user.userId;

    // 验证内容
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '消息内容不能为空'
      });
    }

    if (content.length > 500) {
      return res.status(400).json({
        success: false,
        error: '消息内容不能超过500字'
      });
    }

    // 管理员可以直接发送
    let adoptionId = null;
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      // 普通用户：验证是否为该宠物的领养人
      const adoption = await Adoption.findOne({
        catId,
        userId,
        status: { $in: ['APPROVED', 'COMPLETED'] }
      });

      if (!adoption) {
        return res.status(403).json({
          success: false,
          error: '您不是该宠物的领养人，无法发送消息'
        });
      }
      adoptionId = adoption._id;
    } else {
      // 管理员发送时，查找对应的领养记录
      const adoption = await Adoption.findOne({
        catId,
        status: { $in: ['APPROVED', 'COMPLETED'] }
      });
      if (adoption) {
        adoptionId = adoption._id;
      }
    }

    const message = new PetChat({
      adoptionId,
      catId,
      senderId: userId,
      senderName: userName,
      senderRole: userRole,
      content: content.trim(),
      type,
      isImportant
    });

    await message.save();

    res.json({
      success: true,
      data: { message },
      message: '发送成功'
    });
  } catch (error) {
    console.error('发送宠物交流消息失败:', error);
    res.status(500).json({ success: false, error: '发送消息失败' });
  }
});

// 标记消息为重要（仅管理员）
// PATCH /api/pet-chat/:id/important
router.patch('/:id/important', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { isImportant } = req.body;
    const userRole = req.user.role;

    // 仅管理员可操作
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: '只有管理员可以标记消息重要性'
      });
    }

    const message = await PetChat.findByIdAndUpdate(
      id,
      { isImportant },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        error: '消息不存在'
      });
    }

    res.json({
      success: true,
      data: { message },
      message: isImportant ? '已标记为重要' : '已取消重要标记'
    });
  } catch (error) {
    console.error('标记消息重要性失败:', error);
    res.status(500).json({ success: false, error: '操作失败' });
  }
});

// 删除消息
// DELETE /api/pet-chat/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const message = await PetChat.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: '消息不存在'
      });
    }

    // 仅发送者或管理员可删除
    if (message.senderId.toString() !== userId &&
        userRole !== 'admin' && userRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: '您无权删除此消息'
      });
    }

    await PetChat.findByIdAndDelete(id);

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除宠物交流消息失败:', error);
    res.status(500).json({ success: false, error: '删除失败' });
  }
});

export default router;
