// 文件路径: backend/src/models/Device.js
// 对应前端: src/api/modules/device.ts
import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  name: String,
  type: { 
    type: String, 
    enum: ['tracker', 'feeder', 'camera'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'maintenance'], 
    default: 'active' 
  },
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  batteryLevel: Number,
  lastSeen: Date,
  assignedCat: { type: mongoose.Schema.Types.ObjectId, ref: 'Cat' },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

export const Device = mongoose.model('Device', deviceSchema);