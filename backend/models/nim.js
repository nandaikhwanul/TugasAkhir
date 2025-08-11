import mongoose from 'mongoose';

const nimSchema = new mongoose.Schema({
  nim: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
});

const Nim = mongoose.model('Nim', nimSchema);

export default Nim;
