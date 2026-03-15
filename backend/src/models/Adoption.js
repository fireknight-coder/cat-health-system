// 文件路径: backend/src/models/Adoption.js
// 对应前端: src/api/modules/adoption.ts
import mongoose from 'mongoose';

const adoptionSchema = new mongoose.Schema({
  catId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cat', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phone: { type: String, required: true },
  remark: String,
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'], 
    default: 'PENDING' 
  },
  contactLogs: [{
    time: Date,
    result: String,
    note: String
  }],
  followUpRecords: [{
    time: Date,
    env: String,
    relation: String,
    needIntervention: Boolean,
    note: String
  }]
}, {
  timestamps: true
})

export const Adoption = mongoose.model('Adoption', adoptionSchema);