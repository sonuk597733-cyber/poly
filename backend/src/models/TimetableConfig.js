import mongoose from "mongoose";
import { ALLOWED_BRANCHES } from "./User.js";

const timetableSlotDefSchema = new mongoose.Schema(
  {
    slotNumber: { type: Number, required: true },
    label: { type: String, required: true, trim: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    isBreak: { type: Boolean, default: false },
    breakType: {
      type: String,
      enum: ["none", "short_break", "lunch", "assembly", "activity"],
      default: "none"
    }
  },
  { _id: true }
);

const breakDefSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    afterPeriod: { type: Number, required: true },
    breakType: {
      type: String,
      enum: ["short_break", "lunch", "assembly", "activity"],
      default: "short_break"
    }
  },
  { _id: true }
);

const specialExceptionSchema = new mongoose.Schema(
  {
    date: { type: String, trim: true },
    dayOfWeek: { type: String, trim: true },
    isHoliday: { type: Boolean, default: true },
    reason: { type: String, trim: true, default: "" }
  },
  { _id: true }
);

const timetableConfigSchema = new mongoose.Schema(
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
      trim: true,
      index: true
    },
    section: {
      type: String,
      default: "A",
      trim: true,
      uppercase: true,
      index: true
    },
    workingDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    },
    collegeStartTime: {
      type: String,
      default: "09:00",
      trim: true
    },
    collegeEndTime: {
      type: String,
      default: "17:00",
      trim: true
    },
    periodDuration: {
      type: Number,
      default: 50,
      min: 30,
      max: 120
    },
    dailyPeriods: {
      type: Number,
      default: 7,
      min: 4,
      max: 12
    },
    slots: [timetableSlotDefSchema],
    breaks: [breakDefSchema],
    specialExceptions: [specialExceptionSchema],
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    updatedBy: {
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

timetableConfigSchema.index(
  { academicSession: 1, branch: 1, semester: 1, section: 1 },
  { unique: true }
);

const TimetableConfig = mongoose.model("TimetableConfig", timetableConfigSchema);
export default TimetableConfig;
