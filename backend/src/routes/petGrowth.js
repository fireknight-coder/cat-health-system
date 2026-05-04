import express from 'express'
import { PetGrowth } from '../models/PetGrowth.js'
import { Adoption } from '../models/Adoption.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 获取某只宠物的所有成长记录
router.get('/adoption/:adoptionId/records', authenticateToken, async (req, res) => {
  try {
    const { adoptionId } = req.params
    const currentUserId = String(req.user?._id)
    const currentUserRole = req.user?.role

    // 检查领养记录是否存在
    const adoption = await Adoption.findById(adoptionId)
    if (!adoption) {
      return res.status(404).json({ success: false, message: '领养记录不存在' })
    }

    // 权限检查：只有收养人本人或管理员可以查看
    const isAdopter = String(adoption.userId) === currentUserId
    const isAdmin = currentUserRole === 'admin' || currentUserRole === 'superadmin'

    if (!isAdopter && !isAdmin) {
      return res.status(403).json({ success: false, message: '无权查看此记录' })
    }

    const records = await PetGrowth.find({ adoptionId })
      .sort({ recordDate: -1, createdAt: -1 })

    res.json({ success: true, data: records })
  } catch (err) {
    console.error('获取成长记录失败:', err)
    res.status(500).json({ success: false, message: '获取记录失败' })
  }
})

// 添加成长记录
router.post('/adoption/:adoptionId/records', authenticateToken, async (req, res) => {
  try {
    const { adoptionId } = req.params
    const { content, recordType, images, recordDate } = req.body
    const currentUserId = String(req.user?._id)
    const currentUserRole = req.user?.role

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: '记录内容不能为空' })
    }

    // 检查领养记录是否存在
    const adoption = await Adoption.findById(adoptionId)
    if (!adoption) {
      return res.status(404).json({ success: false, message: '领养记录不存在' })
    }

    // 权限检查：只有收养人本人或管理员可以添加记录
    const isAdopter = String(adoption.userId) === currentUserId
    const isAdmin = currentUserRole === 'admin' || currentUserRole === 'superadmin'

    if (!isAdopter && !isAdmin) {
      return res.status(403).json({ success: false, message: '无权添加记录' })
    }

    const record = await PetGrowth.create({
      adoptionId,
      catId: adoption.catId,
      recorderId: req.user?._id,
      recorderName: req.user?.username || '未知用户',
      recorderRole: currentUserRole,
      content: content.trim(),
      recordType: recordType || 'other',
      images: images || [],
      recordDate: recordDate ? new Date(recordDate) : new Date()
    })

    res.json({ success: true, data: record })
  } catch (err) {
    console.error('添加成长记录失败:', err)
    res.status(500).json({ success: false, message: '添加记录失败' })
  }
})

// 删除成长记录（仅管理员和本人可删除）
router.delete('/records/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const currentUserId = String(req.user?._id)
    const currentUserRole = req.user?.role

    const record = await PetGrowth.findById(id)
    if (!record) {
      return res.status(404).json({ success: false, message: '记录不存在' })
    }

    // 权限检查：只有记录本人或管理员可以删除
    const isRecorder = String(record.recorderId) === currentUserId
    const isAdmin = currentUserRole === 'admin' || currentUserRole === 'superadmin'

    if (!isRecorder && !isAdmin) {
      return res.status(403).json({ success: false, message: '无权删除此记录' })
    }

    await PetGrowth.findByIdAndDelete(id)
    res.json({ success: true, message: '记录已删除' })
  } catch (err) {
    console.error('删除成长记录失败:', err)
    res.status(500).json({ success: false, message: '删除记录失败' })
  }
})

export default router