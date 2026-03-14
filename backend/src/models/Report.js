// 文件路径: backend/src/models/Report.js
// 对应前端: src/api/modules/report.ts
import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  catId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cat' },
  type: { 
    type: String, 
    enum: ['sighting', 'health', 'behavior', 'emergency'], 
    required: true 
  },
  title: String,
  description: String,
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  images: [String],
  urgency: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  status: { 
    type: String, 
    enum: ['new', 'reviewing', 'processed', 'closed'], 
    default: 'new' 
  },
  adminNotes: String,
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: Date
}, {
  timestamps: true
})

export const Report = mongoose.model('Report', reportSchema);