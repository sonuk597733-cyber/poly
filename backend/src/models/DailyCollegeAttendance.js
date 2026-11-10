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

const dailyCollegeAttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student reference is required"],
      index: true
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
      required: [true, "Attendance date is required"],
      index: true
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      default: "present",
      required: true,
      index: true
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    markedByName: {
      type: String,
      default: ""
    },
    markedByRole: {
      type: String,
      default: "teacher"
    },
    remarks: {
      type: String,
      trim: true,
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

// CRITICAL CONSTRAINT: A student can have ONLY ONE overall daily attendance record per college date
dailyCollegeAttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
dailyCollegeAttendanceSchema.index({ branch: 1, semester: 1, section: 1, date: 1 });

const DailyCollegeAttendance = mongoose.model(
  "DailyCollegeAttendance",
  dailyCollegeAttendanceSchema
);

export default DailyCollegeAttendance;
