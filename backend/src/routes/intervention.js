// 文件路径: backend/src/routes/intervention.js
// 对应前端: src/api/modules/intervention.ts
import express from 'express'
import { Intervention } from '../models/Intervention.js'
import { User } from '../models/User.js'

const router = express.Router()

// 创建干预记录
router.post('/', async (req, res) => {
  try {
    const intervention = new Intervention(req.body)
    if (!intervention.createdBy && req.user?._id) {
      intervention.createdBy = req.user._id
    }
    await intervention.save()
    
    res.json({ success: true, data: { id: intervention._id } })
  } catch (error) {
    res.status(500).json({ success: false, message: '创建干预记录失败' })
  }
})

// 获取干预列表
router.get('/', async (req, res) => {
  try {
    const { status, type, page = 1, pageSize = 10 } = req.query
    const filter = {}
    
    if (status) filter.status = status
    if (type) filter.type = type
    
    const interventions = await Intervention.find(filter)
      .populate('catId', 'name avatar')
      .populate('assignedTo', 'username')
      .limit(parseInt(pageSize))
      .skip((parseInt(page) - 1) * parseInt(pageSize))
      .sort({ createdAt: -1 })
    
    const total = await Intervention.countDocuments(filter)
    
    res.json({
      success: true,
      data: {
        list: interventions,
        total
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取干预列表失败' })
  }
})

// 获取干预详情
router.get('/:id', async (req, res) => {
  try {

    const intervention = await Intervention.findById(req.params.id)
      .populate('catId', 'name avatar status')
      .populate('assignedTo', 'username phone')
    
    if (!intervention) {
      return res.status(404).json({ success: false, message: '干预记录不存在' })
    }
    
    // 手动处理 createdBy（因为它存的是字符串ID）
    let createdByInfo = null
    if (intervention.createdBy) {
      const user = await User.findById(intervention.createdBy).select('username phone')
      if (user) {
        createdByInfo = { _id: user._id.toString(), username: user.username, phone: user.phone }
      }
    }
    
    const result = intervention.toObject()
    result.createdBy = createdByInfo
    
    console.log('返回干预详情 - createdBy:', JSON.stringify(createdByInfo))
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('获取干预详情失败:', error)
    res.status(500).json({ success: false, message: '获取干预详情失败' })
  }
})

// 更新干预状态
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, outcome, notes } = req.body
    
    const updateData = { status }
    if (outcome) updateData.outcome = outcome
    if (notes) updateData.notes = notes
    
    if (status === 'in-progress') {
      updateData.startTime = new Date()
    } else if (status === 'completed') {
      updateData.endTime = new Date()
    }
    
    const intervention = await Intervention.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
    
    if (!intervention) {
      return res.status(404).json({ success: false, message: '干预记录不存在' })
    }
    
    res.json({ success: true, data: intervention })
  } catch (error) {
    res.status(500).json({ success: false, message: '更新干预状态失败' })
  }
})

// 添加回复
router.post('/:id/reply', async (req, res) => {
  try {
    const { content } = req.body
    const intervention = await Intervention.findByIdAndUpdate(
      req.params.id,
      { $push: { replies: { content, createdBy: req.user?._id } } },
      { new: true }
    )
    if (!intervention) {
      return res.status(404).json({ success: false, message: '干预记录不存在' })
    }
    res.json({ success: true, data: intervention })
  } catch (error) {
    res.status(500).json({ success: false, message: '添加回复失败' })
  }
})

export default router