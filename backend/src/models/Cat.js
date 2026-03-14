// 对应前端: src/api/modules/cat.ts
import mongoose from 'mongoose';

const catSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['healthy', 'sick', 'adoptable', 'adopted'], 
    default: 'healthy' 
  },
  healthScore: { type: Number, min: 0, max: 100, default: 80 },
  riskLevel: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'low' 
  },
  avatar: String,
  sightingCount: { type: Number, default: 0 },
  lastSeenAt: Date,
  location: {
    lat: Number,
    lng: Number
  },
  description: String,
  tags: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

export const Cat = mongoose.model('Cat', catSchema);