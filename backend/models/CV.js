import mongoose from "mongoose";

const CVSchema = new mongoose.Schema({
  alumni: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Alumni",
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: () => Date.now(),
  },
});

const CV = mongoose.model("CV", CVSchema);

export default CV;
