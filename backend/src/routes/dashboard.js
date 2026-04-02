// 文件路径: backend/src/routes/dashboard.js
// 对应前端: src/api/modules/dashboard.ts
import express from 'express'
import { Cat } from '../models/Cat.js'
import { Report } from '../models/Report.js'
import { Intervention } from '../models/Intervention.js'
import { Adoption } from '../models/Adoption.js'

const router = express.Router()

// 获取仪表盘统计数据
router.get('/stats', async (req, res) => {
  try {
    const [
      totalCats,
      healthyCats,
      adoptableCats,
      totalReports,
      pendingReports,
      totalInterventions,
      activeInterventions,
      totalAdoptions,
      pendingAdoptions
    ] = await Promise.all([
      Cat.countDocuments(),
      Cat.countDocuments({ status: 'HEALTHY' }),
      Cat.countDocuments({ status: 'ADOPTABLE' }),
      Report.countDocuments(),
      Report.countDocuments({ status: 'PENDING_REVIEW' }),
      Intervention.countDocuments(),
      Intervention.countDocuments({ status: 'in-progress' }),
      Adoption.countDocuments(),
      Adoption.countDocuments({ status: 'pending' })
    ])
    
    res.json({
      success: true,
      data: {
        totalCats,
        healthyCats,
        adoptableCats,
        totalReports,
        pendingReports,
        totalInterventions,
        activeInterventions,
        totalAdoptions,
        pendingAdoptions
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取统计数据失败' })
  }
})

// 获取最近活动
router.get('/recent-activities', async (req, res) => {
  try {
    const recentReports = await Report.find()
      .populate('catId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
    
    const recentInterventions = await Intervention.find()
      .populate('catId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
    
    res.json({
      success: true,
      data: {
        recentReports,
        recentInterventions
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取最近活动失败' })
  }
})

export default router