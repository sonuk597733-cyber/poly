import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Notice title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"]
    },
    content: {
      type: String,
      required: [true, "Notice content is required"],
      trim: true
    },
    category: {
      type: String,
      enum: ["Academic", "Examination", "Placement", "Holiday", "Administrative"],
      default: "Academic",
      index: true
    },
    targetRoles: {
      type: [String],
      default: ["student", "teacher", "hod", "coordinator", "principal", "admin"]
    },
    targetBranches: {
      type: [String],
      default: ["ALL"]
    },
    priority: {
      type: String,
      enum: ["normal", "important", "urgent"],
      default: "normal"
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    publishedByName: {
      type: String,
      default: "Administration"
    },
    publishedByRole: {
      type: String,
      default: "admin"
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

const Notice = mongoose.model("Notice", noticeSchema);
export default Notice;
