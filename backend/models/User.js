import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    perusahaan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Perusahaan",
      required: false,
    },
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
    role: {
      type: String,
      required: true,
      enum: ["perusahaan", "alumni", "admin"],
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

export default mongoose.model("User", UserSchema);
