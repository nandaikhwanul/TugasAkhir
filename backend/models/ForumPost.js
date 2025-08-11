import mongoose from "mongoose";
const Schema = mongoose.Schema;

const ForumPostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    category: {
      type: Schema.Types.ObjectId,
      ref: "ForumCategory",
      required: true,
    },
    // Author can be Alumni, Admin, or Perusahaan
    alumni: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alumni",
      required: false,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: false,
    },
    perusahaan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Perusahaan",
      required: false,
    },
    comments: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    pinned: {
      type: Boolean,
      default: false,
    },
    highlighted: {
      type: Boolean,
      default: false,
    },
    popularity: {
      type: Number,
      default: 0,
    },
    replies: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

export default mongoose.model("ForumPost", ForumPostSchema);
