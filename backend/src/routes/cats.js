import express from 'express';
import { Cat } from '../models/Cat.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();


router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 50, status } = req.query
    const filter = {}
    if (status) filter.status = status
    
    console.log('获取猫咪列表, 用户:', req.user?.username, '角色:', req.user?.role)
    
    const cats = await Cat.find(filter)
      .populate({ path: 'adoptionInfo.adoptedBy', select: 'username' })
      .limit(parseInt(pageSize))
      .skip((parseInt(page) - 1) * parseInt(pageSize))
      .sort({ createdAt: -1 })
      
    
    const total = await Cat.countDocuments(filter)
    console.log(`找到 ${cats.length} 只猫咪, 总共 ${total} 只`)
    
    // 添加id字段别名
    const catList = cats.map(cat => ({
      ...cat.toObject(),
      id: cat._id,
      adopterName: cat.adoptionInfo?.adoptedBy?.username || null
    }))
    
    res.json({
      success: true,
      data: {
        list: catList,
        total
      }
    })
  } catch (error) {
    console.error('获取猫咪列表错误:', error)
    res.status(500).json({ success: false, message: '获取猫咪列表失败' })
  }
})

// 获取可领养猫咪列表（状态为ADOPTABLE）
router.get('/adoptable', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const filter = { status: 'ADOPTABLE' }
    
    console.log('获取可领养猫咪列表')
    
    const cats = await Cat.find(filter)
      .populate('adoptionInfo.adoptedBy', 'username')
      .limit(parseInt(pageSize))
      .skip((parseInt(page) - 1) * parseInt(pageSize))
      .sort({ updatedAt: -1 })
    
    const total = await Cat.countDocuments(filter)
    console.log(`找到 ${cats.length} 只可领养猫咪`)
    
    const catList = cats.map(cat => ({
      ...cat.toObject(),
      id: cat._id,
      adopterName: cat.adoptionInfo?.adoptedBy?.username || null
    }))
    
    res.json({
      success: true,
      data: {
        list: catList,
        total
      }
    })
  } catch (error) {
    console.error('获取可领养猫咪列表错误:', error)
    res.status(500).json({ success: false, message: '获取可领养猫咪列表失败' })
  }
})

// 获取单个猫咪
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const cat = await Cat.findById(req.params.id)
    if (!cat) {
      return res.status(404).json({ success: false, message: '猫咪不存在' })
    }
    res.json({
      success: true,
      data: {
        ...cat.toObject(),
        id: cat._id
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取猫咪详情失败' })
  }
})

// 更新猫咪
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const cat = await Cat.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    if (!cat) {
      return res.status(404).json({ success: false, message: '猫咪不存在' })
    }
    res.json({ success: true, data: cat })
  } catch (error) {
    res.status(500).json({ success: false, message: '更新猫咪失败' })
  }
})

export const catRouter = router;