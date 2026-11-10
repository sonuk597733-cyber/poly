import mongoose from "mongoose";
import { ALLOWED_BRANCHES } from "./User.js";

const subjectAttendanceSessionSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null
    },
    subject: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
      index: true
    },
    subjectCode: {
      type: String,
      trim: true,
      default: ""
    },
    branch: {
      type: String,
      enum: ALLOWED_BRANCHES,
      required: true,
      index: true
    },
    semester: {
      type: String,
      required: true,
      index: true
    },
    section: {
      type: String,
      default: "A",
      trim: true
    },
    academicSession: {
      type: String,
      default: "2025-2026",
      trim: true
    },
    academicYear: {
      type: String,
      enum: ["1st Year", "2nd Year", "3rd Year"],
      default: "3rd Year"
    },
    date: {
      type: Date,
      required: [true, "Lecture date is required"],
      index: true
    },
    periodNumber: {
      type: Number,
      required: [true, "Period number is required"],
      min: 1,
      max: 12
    },
    startTime: {
      type: String,
      default: ""
    },
    endTime: {
      type: String,
      default: ""
    },
    roomNo: {
      type: String,
      default: ""
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    facultyName: {
      type: String,
      default: ""
    },
    facultyRole: {
      type: String,
      default: "teacher"
    },
    sessionType: {
      type: String,
      enum: ["theory", "lab", "tutorial", "activity"],
      default: "theory"
    },
    topic: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: ["conducted", "cancelled"],
      default: "conducted",
      index: true
    },
    totalEnrolled: {
      type: Number,
      default: 0
    },
    presentCount: {
      type: Number,
      default: 0
    },
    absentCount: {
      type: Number,
      default: 0
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    lastEditedAt: {
      type: Date,
      default: null
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    lastEditedByName: {
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

// Prevent duplicate lecture session for the same class, subject, date, and period
subjectAttendanceSessionSchema.index(
  { branch: 1, semester: 1, section: 1, subject: 1, date: 1, periodNumber: 1 },
  { unique: true }
);

const SubjectAttendanceSession = mongoose.model(
  "SubjectAttendanceSession",
  subjectAttendanceSessionSchema
);

export default SubjectAttendanceSession;
