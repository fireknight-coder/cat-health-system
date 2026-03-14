// 文件路径: backend/src/models/Report.js
// 对应前端: src/api/modules/report.ts
import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  catId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cat' },
  type: { 
    type: String, 
    enum: ['sighting', 'health', 'behavior', 'emergency'], 
    default: 'sighting'
  },
  title: String,
  description: String,
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  reportedAt: Date,
  images: [String],
  videos: [String],
  urgency: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  // AI处理相关字段
  aiProcessed: { type: Boolean, default: false },
  aiEmbedding: [Number],
  aiHealthScore: { type: Number, min: 0, max: 100 },
  aiRiskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  aiTopK: [{
    catId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cat' },
    similarity: Number,
    avatar: String
  }],
  aiHealthNotes: String,
  // 审核相关
  status: { 
    type: String, 
    enum: ['PENDING_REVIEW', 'AI_PROCESSING', 'AI_PROCESSED', 'APPROVED_MATCH_EXISTING', 'APPROVED_NEW_CAT', 'REJECTED'], 
    default: 'PENDING_REVIEW' 
  },
  adminNotes: String,
  rejectReason: String,
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: Date
}, {
  timestamps: true
})

export const Report = mongoose.model('Report', reportSchema);