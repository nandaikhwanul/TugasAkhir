import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        default: "admin",
        enum: ["admin"]
    }
}, {
    collection: "admin",
    timestamps: true
});

export default mongoose.model("Admin", AdminSchema);
