// 文件路径: backend/src/routes/adoption.js
// 对应前端: src/api/modules/adoption.ts
import express from 'express'
import { Adoption } from '../models/Adoption.js'
import { Cat } from '../models/Cat.js'

import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 创建领养申请
router.post('/requests', authenticateToken, async (req, res) => {
  try {
    const { catId, phone, remark } = req.body
    
    // 检查3天内是否已对该猫申请过
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const recentAdoption = await Adoption.findOne({
      catId,
      userId: req.user._id,
      createdAt: { $gte: threeDaysAgo }
    });
    
    if (recentAdoption) {
      return res.status(400).json({
        success: false,
        message: '您已在3天内对该猫提交过领养申请，请3天后再申请'
      });
    }
    
    const adoption = new Adoption({
      catId,
      userId: req.user._id,
      phone,
      remark,
      status: 'PENDING'
    })
    
    await adoption.save()
    
    res.json({ success: true, data: { id: adoption._id } })
  } catch (error) {
    console.error('创建领养申请错误:', error)
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
      .populate('userId', 'username')
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

// 获取当前用户被批准的领养（宠物列表）
router.get('/my-pets', authenticateToken, async (req, res) => {
  try {
    const adoptions = await Adoption.find({ 
      userId: req.user._id, 
      status: 'APPROVED' 
    }).populate({ 
      path: 'catId', 
      select: 'name avatar images age gender color breed adoptionInfo'
    })
    
    const myPets = adoptions.filter(a => 
      a.catId && 
      a.catId.adoptionInfo &&
      a.catId.adoptionInfo.adoptedBy &&
      a.catId.adoptionInfo.adoptedBy.toString() === req.user._id.toString()
    );
    
    res.json({ success: true, data: myPets })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败' })
  }
})



// 批准领养申请
router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const adoption = await Adoption.findById(req.params.id)
    if (!adoption) {
      return res.status(404).json({ success: false, message: '申请不存在' })
    }
    
    adoption.status = 'APPROVED'
    await adoption.save()
    
    // 更新猫咪状态为已领养，同时设置领养人
    await Cat.findByIdAndUpdate(adoption.catId, { 
      status: 'ADOPTED',
      'adoptionInfo.available': false,
      'adoptionInfo.adoptedBy': adoption.userId,
      'adoptionInfo.adoptedAt': new Date()
    })
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: '操作失败' })
  }
})

// 拒绝领养申请
router.post('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const adoption = await Adoption.findById(req.params.id)
    if (!adoption) {
      return res.status(404).json({ success: false, message: '申请不存在' })
    }
    
    adoption.status = 'REJECTED'
    await adoption.save()
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: '操作失败' })
  }
})