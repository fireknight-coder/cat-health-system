// 对应前端: src/api/modules/cat.ts
import mongoose from 'mongoose';

const catSchema = new mongoose.Schema({
  // 身份证ID - 系统唯一标识
  catId: { type: String, unique: true },
  // 基本信息
  name: String,
  age: Number,
  gender: { type: String, enum: ['unknown', 'male', 'female'], default: 'unknown' },
  breed: String,
  color: String,
  // 状态
  status: { 
    type: String, 
    enum: ['HEALTHY', 'SICK', 'ADOPTABLE', 'ADOPTED', 'UNDER_TREATMENT', 'MISSING'], 
    default: 'HEALTHY' 
  },
  // 健康相关
  healthScore: { type: Number, min: 0, max: 100, default: 80 },
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  healthNotes: String,
  vaccinationRecords: [{
    vaccine: String,
    date: Date,
    nextDue: Date,
    vet: String
  }],
  // 图片
  avatar: String,
  images: [String],
  // 轨迹相关
  sightingCount: { type: Number, default: 0 },
  lastSeenAt: Date,
  location: { lat: Number, lng: Number, address: String },
  locationHistory: [{
    lat: Number,
    lng: Number,
    address: String,
    observedAt: Date
  }],
  // AI特征向量
  embedding: [Number],
  // 描述和标签
  description: String,
  tags: [String],
  // 领养信息
  adoptionInfo: {
    available: { type: Boolean, default: false },
    adoptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adoptedAt: Date
  },
  // 创建信息
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isLocked: { type: Boolean, default: false },
  lockReason: String
}, {
  timestamps: true
})

// 创建时自动生成catId
catSchema.pre('save', async function(next) {
  if (!this.catId) {
    const count = await mongoose.model('Cat').countDocuments();
    this.catId = `CAT${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const Cat = mongoose.model('Cat', catSchema);