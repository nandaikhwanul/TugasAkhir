import mongoose from "mongoose";
const Schema = mongoose.Schema;

const ForumCommentSchema = new Schema(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "ForumPost",
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
    content: {
      type: String,
      required: true,
      trim: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "ForumComment",
      default: null,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

export default mongoose.model("ForumComment", ForumCommentSchema);
