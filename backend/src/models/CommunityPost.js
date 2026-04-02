import mongoose from 'mongoose'

const communityCommentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  userRole: { type: String, enum: ['user', 'admin', 'superadmin', 'pending_admin'], default: 'user' },
  content: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now }
}, {
  _id: true
})

const communityPostSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  authorRole: { type: String, enum: ['user', 'admin', 'superadmin', 'pending_admin'], default: 'user' },
  content: { type: String, default: '' },
  images: [String],
  videos: [String],
  isAnnouncement: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  tags: [String],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [communityCommentSchema]
}, {
  timestamps: true
})

communityPostSchema.index({ isPinned: -1, isAnnouncement: -1, createdAt: -1 })

export const CommunityPost = mongoose.model('CommunityPost', communityPostSchema)
