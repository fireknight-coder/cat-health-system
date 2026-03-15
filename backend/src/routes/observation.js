import express from 'express'
import mongoose from 'mongoose'
import { Observation } from '../models/Observation.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 创建观察记录
router.post('/', async (req, res) => {
  try {
    console.log('收到观察记录请求:', req.body)
    const observation = new Observation(req.body)
    await observation.save()
    console.log('保存成功:', observation._id)
    res.json({ success: true, data: { id: observation._id } })
  } catch (error) {
    console.error('保存观察记录失败:', error)
    res.status(500).json({ success: false, message: '创建观察记录失败' })
  }
})

// 获取猫咪的观察记录
router.get('/cat/:catId', async (req, res) => {
  try {
    const catId = req.params.catId
    let query = { catId }
    if (mongoose.Types.ObjectId.isValid(catId)) {
      query = { catId: new mongoose.Types.ObjectId(catId) }
    }
    const observations = await Observation.find(query)
      .populate('recordedBy', 'username')
      .sort({ observedAt: -1 })
    console.log('查询结果:', observations.length)
    res.json({ success: true, data: observations })
  } catch (error) {
    console.error('获取观察记录失败:', error)
    res.status(500).json({ success: false, message: '获取观察记录失败' })
  }
})

// 删除观察记录
router.delete('/:id', async (req, res) => {
  try {
    await Observation.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('删除观察记录失败:', error)
    res.status(500).json({ success: false, message: '删除观察记录失败' })
  }
})

export default router