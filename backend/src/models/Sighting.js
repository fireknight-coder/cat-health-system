// 文件路径: backend/src/models/Sighting.js
// 猫咪出现记录 - 用于追踪猫咪活动轨迹
import mongoose from 'mongoose';

const sightingSchema = new mongoose.Schema({
  catId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cat', required: true },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  observedAt: Date,
  images: [String],
  description: String,
  healthScore: Number,
  healthNotes: String,
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

export const Sighting = mongoose.model('Sighting', sightingSchema);