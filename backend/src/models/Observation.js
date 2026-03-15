import mongoose from 'mongoose';

const observationSchema = new mongoose.Schema({
  catId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cat', required: true },
  content: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['general', 'health', 'behavior', 'feeding', 'incident'], 
    default: 'general' 
  },
  observedAt: { type: Date, default: Date.now },
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  images: [String],
  isImportant: { type: Boolean, default: false },
  tags: [String],
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

export const Observation = mongoose.model('Observation', observationSchema);