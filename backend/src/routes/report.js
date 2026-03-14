// 文件路径: backend/src/routes/report.js
// 对应前端: src/api/modules/report.ts
import express from 'express'
import { Report } from '../models/Report.js'

const router = express.Router()

// 创建报告
router.post('/', async (req, res) => {
  try {
    const report = new Report(req.body)
    await report.save()
    
    res.json({ success: true, data: { id: report._id } })
  } catch (error) {
    res.status(500).json({ success: false, message: '创建报告失败' })
  }
})

// 获取报告列表
router.get('/', async (req, res) => {
  try {
    const { status, type, page = 1, pageSize = 10 } = req.query
    const filter = {}
    
    if (status) filter.status = status
    if (type) filter.type = type
    
    const reports = await Report.find(filter)
      .populate('catId', 'name avatar')
      .populate('reporterId', 'username')
      .limit(parseInt(pageSize))
      .skip((parseInt(page) - 1) * parseInt(pageSize))
      .sort({ createdAt: -1 })
    
    const total = await Report.countDocuments(filter)
    
    res.json({
      success: true,
      data: {
        list: reports,
        total
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取报告列表失败' })
  }
})

// 获取报告详情
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('catId', 'name avatar status')
      .populate('reporterId', 'username phone')
    
    if (!report) {
      return res.status(404).json({ success: false, message: '报告不存在' })
    }
    
    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取报告详情失败' })
  }
})

// 更新报告状态
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, adminNotes } = req.body
    
    const updateData = { status }
    if (status === 'processed' || status === 'closed') {
      updateData.processedAt = new Date()
      updateData.processedBy = req.user?.id
    }
    if (adminNotes) updateData.adminNotes = adminNotes
    
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
    
    if (!report) {
      return res.status(404).json({ success: false, message: '报告不存在' })
    }
    
    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: '更新报告状态失败' })
  }
})

export default router