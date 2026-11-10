import mongoose from "mongoose";
import { ALLOWED_BRANCHES } from "./User.js";

const auditEntrySchema = new mongoose.Schema(
  {
    modifiedAt: {
      type: Date,
      default: Date.now
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    modifiedByName: {
      type: String,
      default: ""
    },
    previousStatus: {
      type: String,
      required: true
    },
    newStatus: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      default: "Manual correction by staff"
    }
  },
  { _id: true }
);

const subjectAttendanceRecordSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubjectAttendanceSession",
      required: [true, "Lecture session reference is required"],
      index: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student reference is required"],
      index: true
    },
    studentName: {
      type: String,
      default: ""
    },
    rollNumber: {
      type: String,
      default: ""
    },
    subject: {
      type: String,
      required: true,
      index: true
    },
    subjectCode: {
      type: String,
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
      default: "A"
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      default: "present",
      required: true,
      index: true
    },
    remarks: {
      type: String,
      default: ""
    },
    auditHistory: [auditEntrySchema]
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

// CRITICAL CONSTRAINT: A student can only have ONE attendance status per lecture session
subjectAttendanceRecordSchema.index(
  { sessionId: 1, studentId: 1 },
  { unique: true }
);
subjectAttendanceRecordSchema.index(
  { studentId: 1, subject: 1, date: 1 }
);

const SubjectAttendanceRecord = mongoose.model(
  "SubjectAttendanceRecord",
  subjectAttendanceRecordSchema
);

export default SubjectAttendanceRecord;
