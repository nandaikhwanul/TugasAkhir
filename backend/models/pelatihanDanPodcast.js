import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  // Menyimpan jalur file lokal atau URL link embed
  contentUrl: {
    type: String,
    required: true,
  },
  // Tipe konten: 'training_video' atau 'podcast'
  contentType: {
    type: String,
    required: true,
    enum: ['training_video', 'podcast'],
  },
});

const Content = mongoose.model('Content', contentSchema);

export default Content;