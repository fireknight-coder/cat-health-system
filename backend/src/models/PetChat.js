// 文件路径: backend/src/models/PetChat.js
// 对应功能: 宠物档案交流记录（仅领养人和管理员可见）
import mongoose from 'mongoose';

const petChatSchema = new mongoose.Schema({
  // 关联的领养记录
  adoptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Adoption', required: true },
  // 关联的猫咪
  catId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cat', required: true },
  // 发送者
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, enum: ['user', 'admin', 'superadmin'], required: true },
  // 消息内容
  content: { type: String, required: true, maxlength: 500 },
  // 消息类型
  type: {
    type: String,
    enum: ['general', 'health', 'status', 'intervention'],
    default: 'general'
  },
  // 是否重要标记
  isImportant: { type: Boolean, default: false }
}, {
  timestamps: true
});

// 索引：按领养记录查询，按时间倒序
petChatSchema.index({ adoptionId: 1, createdAt: -1 });
petChatSchema.index({ catId: 1, createdAt: -1 });

export const PetChat = mongoose.model('PetChat', petChatSchema);
