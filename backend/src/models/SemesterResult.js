import mongoose from "mongoose";
import { ALLOWED_BRANCHES } from "./User.js";

const carryOverPaperSchema = new mongoose.Schema(
  {
    subjectCode: { type: String, trim: true, uppercase: true, default: "" },
    subjectName: { type: String, trim: true, default: "" },
    marksObtained: { type: Number, default: 0 },
    maxMarks: { type: Number, default: 100 }
  },
  { _id: false }
);

const semesterResultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    enrollmentNo: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true
    },
    studentName: {
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
    academicYear: {
      type: String,
      default: "1st Year",
      index: true
    },
    academicSession: {
      type: String,
      default: "2024-2025",
      index: true
    },
    semester: {
      type: String,
      required: true,
      index: true
    },
    totalMax: {
      type: Number,
      default: 0
    },
    totalObtained: {
      type: Number,
      default: 0
    },
    totalCredits: {
      type: Number,
      default: 0
    },
    totalCreditPoints: {
      type: Number,
      default: 0
    },
    sgpa: {
      type: Number,
      default: 0
    },
    cgpa: {
      type: Number,
      default: 0
    },
    overallPercentage: {
      type: Number,
      default: 0
    },
    standing: {
      type: String,
      default: "Pending Evaluation"
    },
    resultStatus: {
      type: String,
      enum: ["PASS", "PCP", "PWG", "FAIL", "WITHHELD", "INCOMPLETE"],
      default: "PASS",
      index: true
    },
    carryOverPapers: {
      type: [carryOverPaperSchema],
      default: []
    },
    copCount: {
      type: Number,
      default: 0
    },
    graceMarksAwarded: {
      type: Number,
      default: 0
    },
    graceSubjectCode: {
      type: String,
      default: ""
    },
    isAllSubjectsCleared: {
      type: Boolean,
      default: true
    },
    workflowStatus: {
      type: String,
      enum: ["draft", "calculated", "sanctioned", "published", "locked"],
      default: "calculated",
      index: true
    },
    calculatedAt: {
      type: Date,
      default: Date.now
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    publishedAt: {
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

semesterResultSchema.index(
  { studentId: 1, semester: 1, academicSession: 1 },
  { unique: true }
);

semesterResultSchema.index({ branch: 1, semester: 1, academicSession: 1, workflowStatus: 1 });

const SemesterResult = mongoose.model("SemesterResult", semesterResultSchema);
export default SemesterResult;
