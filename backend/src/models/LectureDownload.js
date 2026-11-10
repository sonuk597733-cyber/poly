import mongoose from "mongoose";

const lectureDownloadSchema = new mongoose.Schema(
  {
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      required: true,
      index: true
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    resourceTitle: {
      type: String,
      default: ""
    },
    downloadType: {
      type: String,
      enum: ["video", "resource"],
      default: "resource"
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    userName: {
      type: String,
      required: true
    },
    userRole: {
      type: String,
      required: true
    },
    userBranch: {
      type: String,
      default: ""
    },
    userSemester: {
      type: String,
      default: ""
    },
    ipAddress: {
      type: String,
      default: ""
    },
    userAgent: {
      type: String,
      default: ""
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

lectureDownloadSchema.index({ lectureId: 1, createdAt: -1 });
lectureDownloadSchema.index({ userId: 1, createdAt: -1 });

const LectureDownload = mongoose.model("LectureDownload", lectureDownloadSchema);
export default LectureDownload;
