import mongoose from "mongoose";
import { ALLOWED_BRANCHES } from "./User.js";

const attendanceSchema = new mongoose.Schema(
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
      required: [true, "Branch is required"],
      index: true
    },
    academicYear: {
      type: String,
      enum: ["1st Year", "2nd Year", "3rd Year"],
      required: true
    },
    semester: {
      type: String,
      required: [true, "Semester is required"]
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true
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
      index: true
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    remarks: {
      type: String,
      trim: true,
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

// Compound index to prevent duplicate marks for the same student, subject, and date
attendanceSchema.index({ studentId: 1, subject: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
