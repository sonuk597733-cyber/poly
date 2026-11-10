import mongoose from "mongoose";

const lectureProgressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      required: true,
      index: true
    },
    branch: {
      type: String,
      required: true,
      index: true
    },
    semester: {
      type: String,
      required: true,
      index: true
    },
    subject: {
      type: String,
      required: true
    },
    lastPlaybackPosition: {
      type: Number,
      default: 0,
      min: 0
    },
    highestPlaybackPosition: {
      type: Number,
      default: 0,
      min: 0
    },
    totalWatchDuration: {
      type: Number,
      default: 0,
      min: 0
    },
    lectureDuration: {
      type: Number,
      default: 0,
      min: 0
    },
    sessionsCount: {
      type: Number,
      default: 1,
      min: 1
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true
    },
    firstWatchedAt: {
      type: Date,
      default: Date.now
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
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

lectureProgressSchema.index({ studentId: 1, lectureId: 1 }, { unique: true });
lectureProgressSchema.index({ studentId: 1, isCompleted: 1 });
lectureProgressSchema.index({ lectureId: 1, isCompleted: 1 });

const LectureProgress = mongoose.model("LectureProgress", lectureProgressSchema);
export default LectureProgress;
