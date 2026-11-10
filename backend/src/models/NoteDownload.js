import mongoose from "mongoose";

const noteDownloadSchema = new mongoose.Schema(
  {
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: true,
      index: true
    },
    noteTitle: {
      type: String,
      default: ""
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    studentName: {
      type: String,
      required: true
    },
    studentEnrollment: {
      type: String,
      default: ""
    },
    studentBranch: {
      type: String,
      default: ""
    },
    studentSemester: {
      type: String,
      default: ""
    },
    fileSize: {
      type: Number,
      default: 0
    },
    ipAddress: {
      type: String,
      default: ""
    },
    userAgent: {
      type: String,
      default: ""
    },
    downloadedAt: {
      type: Date,
      default: Date.now,
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

noteDownloadSchema.index({ noteId: 1, studentId: 1 });
noteDownloadSchema.index({ studentId: 1, downloadedAt: -1 });

const NoteDownload = mongoose.model("NoteDownload", noteDownloadSchema);
export default NoteDownload;
