// 宠物成长记录模型 - 记录收养人/管理员对宠物状态的记录
import mongoose from 'mongoose'

const petGrowthSchema = new mongoose.Schema({
  // 关联的领养记录
  adoptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Adoption', required: true },
  // 关联的猫咪
  catId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cat', required: true },
  // 记录人信息
  recorderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recorderName: { type: String, required: true },
  recorderRole: { type: String, enum: ['user', 'admin', 'superadmin'], required: true },
  // 记录类型
  recordType: {
    type: String,
    enum: ['weight', 'health', 'behavior', 'feeding', 'growth', 'other'],
    default: 'other'
  },
  // 记录内容
  content: { type: String, required: true },
  // 附件图片
  images: [String],
  // 记录日期（可追溯历史）
  recordDate: { type: Date, default: Date.now }
}, {
  timestamps: true
})

// 索引优化查询
petGrowthSchema.index({ adoptionId: 1, createdAt: -1 })
petGrowthSchema.index({ catId: 1, createdAt: -1 })

export const PetGrowth = mongoose.model('PetGrowth', petGrowthSchema)