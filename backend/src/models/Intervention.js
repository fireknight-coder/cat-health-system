// 文件路径: backend/src/models/Intervention.js
// 对应前端: src/api/modules/intervention.ts
import mongoose from 'mongoose';

const interventionSchema = new mongoose.Schema({
  catId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cat', required: true },
  type: { 
    type: String, 
    enum: ['medical', 'rescue', 'feeding', 'sterilization'], 
    required: true 
  },
  description: String,
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startTime: Date,
  endTime: Date,
  outcome: String,
  cost: Number,
  images: [String]
}, {
  timestamps: true
})

export const Intervention = mongoose.model('Intervention', interventionSchema);