// 文件路径: backend/src/routes/report.js
// 对应前端: src/api/modules/report.ts
import express from 'express';
import { Report } from '../models/Report.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { reportUpload } from '../middleware/upload.js';

const router = express.Router()

function createSeededRandom(seedText) {
  let h = 2166136261
  for (let i = 0; i < seedText.length; i += 1) {
    h ^= seedText.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let state = h >>> 0
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return ((state >>> 0) % 10000) / 10000
  }
}

function pickRiskAndScore(rand) {
  const r = rand()
  if (r < 0.75) {
    return {
      aiRiskLevel: 'low',
      aiHealthScore: 82 + Math.floor(rand() * 11),
      aiHealthNotes: '整体状态较稳，建议持续观察。'
    }
  }
  if (r < 0.95) {
    return {
      aiRiskLevel: 'medium',
      aiHealthScore: 65 + Math.floor(rand() * 18),
      aiHealthNotes: '存在轻度风险，建议管理员复核。'
    }
  }
  return {
    aiRiskLevel: 'high',
    aiHealthScore: 40 + Math.floor(rand() * 26),
    aiHealthNotes: '高风险预警，建议优先处理。'
  }
}

async function buildAiDraft(reportId, refreshCount = 0) {
  const { Cat } = await import('../models/Cat.js')
  const rand = createSeededRandom(`${reportId}-${refreshCount}`)
  const hasSimilar = rand() < 0.5
  const suggestionConfidence = Number((0.55 + rand() * 0.35).toFixed(2))
  const riskAndScore = pickRiskAndScore(rand)

  const candidateCats = await Cat.find({}).sort({ updatedAt: -1 }).limit(30).select('_id name avatar')
  let aiTopK = []

  if (hasSimilar && candidateCats.length) {
    const pickIndex = Math.floor(rand() * candidateCats.length)
    const chosen = candidateCats[pickIndex]
    aiTopK = [{
      catId: chosen._id,
      avatar: chosen.avatar,
      similarity: Number((0.74 + rand() * 0.21).toFixed(3))
    }]
  }

  const suggestion = aiTopK.length ? 'existing' : 'new'

  return {
    aiProcessed: true,
    aiSuggestion: suggestion,
    aiSuggestionConfidence: suggestionConfidence,
    ...riskAndScore,
    aiTopK,
    aiLastRefreshedAt: new Date()
  }
}

// 上传上报图片到本地目录
router.post('/upload', authenticateToken, reportUpload.array('files', 6), async (req, res) => {
  try {
    const files = req.files || []
    const urls = files.map((file) => `${req.protocol}://${req.get('host')}/uploads/reports/${file.filename}`)
    res.json({ success: true, data: { urls } })
  } catch (error) {
    res.status(500).json({ success: false, message: '上传失败' })
  }
})

// 创建报告
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { mediaUrls, videos, lat, lng, address, reportedAt, remark, type, ...rest } = req.body
    
    const reportData = {
      ...rest,
      reporterId: req.user?.id,
      images: mediaUrls || [],
      videos: videos || [],
      location: lat || lng ? { lat: Number(lat), lng: Number(lng), address } : undefined,
      reportedAt: reportedAt ? new Date(reportedAt) : undefined,
      type: type || 'sighting',
      description: remark,
      status: 'PENDING_REVIEW'
    }
    
    const report = new Report(reportData)
    await report.save()

    const aiDraft = await buildAiDraft(report._id.toString(), 0)
    report.set({ ...aiDraft, aiRefreshCount: 0 })
    await report.save()
    
    res.json({ success: true, data: { id: report._id, status: report.status } })
  } catch (error) {
    res.status(500).json({ success: false, message: '创建报告失败' })
  }
})

// 刷新AI建议（随机种子方案）
router.post('/:id/refresh-ai', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
    if (!report) {
      return res.status(404).json({ success: false, message: '报告不存在' })
    }

    const nextCount = (report.aiRefreshCount || 0) + 1
    const aiDraft = await buildAiDraft(report._id.toString(), nextCount)
    report.set({ ...aiDraft, aiRefreshCount: nextCount })
    await report.save()

    const populated = await Report.findById(report._id)
      .populate('catId', 'name avatar status')
      .populate('reporterId', 'username phone')
      .populate('aiTopK.catId', 'name avatar')

    res.json({ success: true, data: populated, message: 'AI建议已刷新' })
  } catch (error) {
    res.status(500).json({ success: false, message: '刷新AI建议失败' })
  }
})

// 获取报告列表（暂时简化认证）
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, type, page = 1, pageSize = 10 } = req.query
    const filter = {}
    
    if (status) filter.status = status
    if (type) filter.type = type
    
    console.log('获取报告列表, filter:', filter)
    
    const reports = await Report.find(filter)
      .populate('catId', 'name avatar')
      .populate('reporterId', 'username')
      .limit(parseInt(pageSize))
      .skip((parseInt(page) - 1) * parseInt(pageSize))
      .sort({ createdAt: -1 })
    
    const total = await Report.countDocuments(filter)
    
    console.log(`找到 ${reports.length} 条报告, 总共 ${total} 条`)
    
    // 添加id字段别名
    const reportList = reports.map(r => ({
      ...r.toObject(),
      id: r._id
    }))
    
    res.json({
      success: true,
      data: {
        list: reportList,
        total
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取报告列表失败' })
  }
})

// 获取报告详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('catId', 'name avatar status')
      .populate('reporterId', 'username phone')
      .populate('aiTopK.catId', 'name avatar')
    
    if (!report) {
      return res.status(404).json({ success: false, message: '报告不存在' })
    }
    
    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取报告详情失败' })
  }
})

// 更新报告状态
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
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

// 审核通过 - 绑定已有猫咪（老猫归档）
router.post('/:id/approve-match', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { catId, adminNotes } = req.body
    const { Cat } = await import('../models/Cat.js')
    const { Sighting } = await import('../models/Sighting.js')
    
    const report = await Report.findById(req.params.id)
    if (!report) {
      return res.status(404).json({ success: false, message: '报告不存在' })
    }
    
    // 检查猫咪是否存在
    const cat = await Cat.findById(catId)
    if (!cat) {
      return res.status(404).json({ success: false, message: '猫咪不存在' })
    }
    
    // 1. 绑定猫咪到报告
    report.catId = catId
    report.status = 'APPROVED_MATCH_EXISTING'
    report.adminNotes = adminNotes
    report.processedAt = new Date()
    await report.save()
    
    // 2. 创建出现记录 Sighting
    const sighting = new Sighting({
      catId: catId,
      reportId: report._id,
      location: report.location,
      observedAt: report.reportedAt || report.createdAt,
      images: report.images,
      description: report.description,
      healthScore: report.aiHealthScore,
      healthNotes: report.aiHealthNotes,
      reportedBy: report.reporterId
    })
    await sighting.save()
    
    // 3. 更新猫咪的发现次数、最后发现时间、位置
    cat.sightingCount = (cat.sightingCount || 0) + 1
    cat.lastSeenAt = new Date()
    if (report.location) {
      cat.location = report.location
      // 更新位置历史
      cat.locationHistory = cat.locationHistory || []
      cat.locationHistory.push({
        lat: report.location.lat,
        lng: report.location.lng,
        address: report.location.address,
        observedAt: new Date()
      })
    }
    // 更新健康评分（取最新）
    if (report.aiHealthScore) {
      cat.healthScore = report.aiHealthScore
    }
    if (report.aiRiskLevel) {
      cat.riskLevel = report.aiRiskLevel
    }
    await cat.save()
    
    res.json({ 
      success: true, 
      data: { 
        reportId: report._id, 
        catId: cat._id,
        catIdCard: cat.catId,
        sightingId: sighting._id
      },
      message: '已绑定老猫，创建出现记录'
    })
  } catch (error) {
    console.error('绑定猫咪失败:', error)
    res.status(500).json({ success: false, message: '绑定猫咪失败: ' + error.message })
  }
})

// 审核通过 - 创建新猫咪档案（新猫建档）
router.post('/:id/approve-new', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, age, gender, breed, color, healthNotes, adminNotes } = req.body
    const { Cat } = await import('../models/Cat.js')
    const { Sighting } = await import('../models/Sighting.js')
    
    const report = await Report.findById(req.params.id)
    if (!report) {
      return res.status(404).json({ success: false, message: '报告不存在' })
    }
    
    // 1. 创建新猫咪档案
    const newCat = new Cat({
      name: name || `咪咪-${Date.now().toString().slice(-4)}`,
      age: age,
      gender: gender || 'unknown',
      breed: breed,
      color: color,
      status: 'HEALTHY',
      healthScore: report.aiHealthScore || 80,
      riskLevel: report.aiRiskLevel || 'low',
      healthNotes: healthNotes || report.aiHealthNotes,
      avatar: report.images?.[0] || '',
      images: report.images,
      sightingCount: 1,
      lastSeenAt: report.reportedAt || report.createdAt,
      location: report.location,
      locationHistory: [{
        lat: report.location?.lat,
        lng: report.location?.lng,
        address: report.location?.address,
        observedAt: new Date()
      }],
      embedding: report.aiEmbedding,
      description: report.description || '',
      tags: ['新发现'],
      createdBy: req.user?.id
    })
    
    await newCat.save()
    
    // 2. 绑定猫咪到报告
    report.catId = newCat._id
    report.status = 'APPROVED_NEW_CAT'
    report.adminNotes = adminNotes
    report.processedAt = new Date()
    await report.save()
    
    // 3. 创建首条出现记录
    const sighting = new Sighting({
      catId: newCat._id,
      reportId: report._id,
      location: report.location,
      observedAt: report.reportedAt || report.createdAt,
      images: report.images,
      description: report.description,
      healthScore: report.aiHealthScore,
      healthNotes: report.aiHealthNotes,
      reportedBy: report.reporterId
    })
    await sighting.save()
    
    res.json({ 
      success: true, 
      data: { 
        reportId: report._id, 
        catId: newCat._id,
        catIdCard: newCat.catId
      },
      message: '新猫建档成功，已生成身份ID卡'
    })
  } catch (error) {
    console.error('创建猫咪档案失败:', error)
    res.status(500).json({ success: false, message: '创建猫咪档案失败: ' + error.message })
  }
})

// 审核驳回
router.post('/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body
    
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status: 'REJECTED',
        rejectReason: reason,
        adminNotes: reason || '审核驳回',
        processedAt: new Date()
      },
      { new: true }
    )
    
    if (!report) {
      return res.status(404).json({ success: false, message: '报告不存在' })
    }
    
    res.json({ success: true, data: report, message: '已驳回上报' })
  } catch (error) {
    res.status(500).json({ success: false, message: '驳回失败' })
  }
})

export default router