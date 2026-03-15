import express from 'express'
import { Observation } from '../models/Observation.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 创建观察记录
router.post('/', async (req, res) => {
  try {
    const observation = new Observation(req.body)
    await observation.save()
    res.json({ success: true, data: { id: observation._id } })
  } catch (error) {
    console.error('创建观察记录错误:', error)
    res.status(500).json({ success: false, message: '创建观察记录失败' })
  }
})

// 获取猫咪的观察记录
router.get('/cat/:catId', async (req, res) => {
  try {
    const observations = await Observation.find({ catId: req.params.catId })
      .populate('recordedBy', 'username')
      .sort({ observedAt: -1 })
    res.json({ success: true, data: observations })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取观察记录失败' })
  }
})

export default router