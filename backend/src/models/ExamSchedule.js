import mongoose from "mongoose";
import { ALLOWED_BRANCHES } from "./User.js";

const examScheduleSchema = new mongoose.Schema(
  {
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
    academicSession: {
      type: String,
      default: "2025-2026",
      index: true
    },
    examType: {
      type: String,
      enum: [
        "Mid Term 1",
        "Mid Term 2",
        "Final Semester Examination",
        "Practical / Lab Assessment",
        "Continuous Evaluation"
      ],
      default: "Mid Term 1",
      index: true
    },
    subjectCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    subjectName: {
      type: String,
      required: true,
      trim: true
    },
    examDate: {
      type: Date,
      required: true,
      index: true
    },
    startTime: {
      type: String,
      required: true,
      trim: true
    },
    endTime: {
      type: String,
      required: true,
      trim: true
    },
    roomNo: {
      type: String,
      required: true,
      trim: true,
      default: "Exam Hall A"
    },
    maxMarks: {
      type: Number,
      required: true,
      default: 100,
      min: 10
    },
    passingMarks: {
      type: Number,
      default: 40
    },
    invigilatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    invigilatorName: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "evaluated", "cancelled"],
      default: "scheduled",
      index: true
    },
    totalStudents: {
      type: Number,
      default: 60
    },
    presentCount: {
      type: Number,
      default: 0
    },
    absentCount: {
      type: Number,
      default: 0
    },
    guidelines: {
      type: String,
      trim: true,
      default: "Standard Polytechnic Board Examination Rules apply. Carry Student ID card and Hall ticket."
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

const ExamSchedule = mongoose.model("ExamSchedule", examScheduleSchema);
export default ExamSchedule;
