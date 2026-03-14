// 文件路径: backend/src/routes/adoption.js
// 对应前端: src/api/modules/adoption.ts
import express from 'express'
import { Adoption } from '../models/Adoption.js'
import { Cat } from '../models/Cat.js'

const router = express.Router()

// 创建领养申请 - 对应前端的 createAdoptionRequest 函数
router.post('/requests', async (req, res) => {
  try {
    const { catId, phone, remark } = req.body
    
    // 检查猫咪是否存在且可领养
    const cat = await Cat.findById(catId)
    if (!cat || cat.status !== 'adoptable') {
      return res.status(400).json({ success: false, message: '该猫咪不可领养' })
    }
    
    const adoption = new Adoption({
      catId,
      userId: req.user?.id || 'anonymous',
      phone,
      remark
    })
    
    await adoption.save()
    
    res.json({ success: true, data: { id: adoption._id } })
  } catch (error) {
    res.status(500).json({ success: false, message: '创建领养申请失败' })
  }
})

// 获取领养申请列表 - 对应前端的 getAdoptionRequests 函数
router.get('/requests', async (req, res) => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query
    const filter = status ? { status } : {}
    
    const requests = await Adoption.find(filter)
      .populate('catId', 'name avatar status')
      .limit(parseInt(pageSize))
      .skip((parseInt(page) - 1) * parseInt(pageSize))
      .sort({ createdAt: -1 })
    
    const total = await Adoption.countDocuments(filter)
    
    res.json({
      success: true,
      data: {
        list: requests,
        total
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取领养申请列表失败' })
  }
})

export default router