import mongoose from 'mongoose';
const gameSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  developer: String,
  genre: { type: String, required: true, index: true },
  tags: [String],
  description: String,
  price: { type: Number, default: 0 },
  discount: { type: Number, default: 0, min: 0, max: 90 },
  rating: { type: Number, min: 0, max: 100, default: 0 },
  releaseDate: Date,
  featured: { type: Boolean, default: false },
}, { timestamps: true });
export default mongoose.model('Game', gameSchema);
