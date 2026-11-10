import mongoose from "mongoose";
import { ALLOWED_BRANCHES } from "./User.js";

const holidayItemSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["holiday", "vacation", "declared", "institutional"],
      default: "holiday"
    }
  },
  { _id: true }
);

const specialWorkingDaySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: true }
);

const academicAttendanceConfigSchema = new mongoose.Schema(
  {
    academicSession: {
      type: String,
      required: true,
      default: "2025-2026",
      trim: true,
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
    academicYear: {
      type: String,
      enum: ["1st Year", "2nd Year", "3rd Year"],
      default: "3rd Year"
    },
    section: {
      type: String,
      default: "A",
      trim: true
    },
    // The official date when classes commenced - all calculations start from here
    commencementDate: {
      type: Date,
      required: [true, "Class commencement date is required"],
      default: () => new Date("2026-11-01T00:00:00.000Z")
    },
    academicEndDate: {
      type: Date,
      default: () => new Date("2027-04-30T00:00:00.000Z")
    },
    // Configured or target eligible working days for the semester (default 67)
    totalWorkingDays: {
      type: Number,
      default: 67,
      min: 1
    },
    // Default planned lectures per curriculum subject in the semester (e.g. 33)
    defaultPlannedLecturesPerSubject: {
      type: Number,
      default: 33,
      min: 1
    },
    // Specific planned lecture overrides per subject
    subjectPlannedLectures: [
      {
        subject: { type: String, required: true },
        plannedLectures: { type: Number, required: true, default: 33, min: 1 }
      }
    ],
    workingDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    },
    holidays: [holidayItemSchema],
    specialWorkingDays: [specialWorkingDaySchema],
    minAttendancePercentage: {
      type: Number,
      required: true,
      default: 60,
      min: 1,
      max: 100
    },
    configuredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

// Compound unique index per academic cohort
academicAttendanceConfigSchema.index(
  { academicSession: 1, branch: 1, semester: 1, section: 1 },
  { unique: true }
);

const AcademicAttendanceConfig = mongoose.model(
  "AcademicAttendanceConfig",
  academicAttendanceConfigSchema
);

export default AcademicAttendanceConfig;
