import mongoose from "mongoose";
import { ALLOWED_BRANCHES } from "./User.js";

export const EXAM_TYPES = [
  "Sessional 1",
  "Sessional 2",
  "Sessional 3",
  "Mid Term 1",
  "Mid Term 2",
  "Final Semester Examination",
  "Practical / Lab Assessment",
  "Continuous Evaluation",
  "Supplementary Examination"
];

export const EXAMINATION_CATEGORIES = [
  "Regular",
  "Supplementary",
  "Carry Over / Backlog",
  "Reappear"
];

export const WORKFLOW_STATUSES = [
  "draft",
  "submitted",
  "returned",
  "verified",
  "hod_approved",
  "principal_sanctioned",
  "published",
  "locked"
];

export const GRADE_OPTIONS = ["A+", "A", "B+", "B", "C", "D", "F", "PWG", "AB", "W"];

export const RESULT_STATUSES = ["PASS", "PCP", "PWG", "FAIL", "ABSENT", "WITHHELD"];

const examMarkSchema = new mongoose.Schema(
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
      default: "1st Year",
      index: true
    },
    semester: {
      type: String,
      required: [true, "Semester is required"],
      index: true
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true
    },
    subjectCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
      index: true
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null
    },
    examType: {
      type: String,
      enum: EXAM_TYPES,
      required: [true, "Examination type is required"],
      default: "Final Semester Examination",
      index: true
    },
    // Internal Sessional Examination Tracking (1, 2, 3)
    sessionalNumber: {
      type: Number,
      enum: [1, 2, 3],
      default: null,
      index: true
    },
    isInternalSessional: {
      type: Boolean,
      default: false,
      index: true
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    examinationCategory: {
      type: String,
      enum: EXAMINATION_CATEGORIES,
      default: "Regular",
      index: true
    },
    // Component Split (External Theory vs Sessional Internal vs Practical)
    externalMax: {
      type: Number,
      default: 60,
      min: 0
    },
    externalObtained: {
      type: Number,
      default: 0,
      min: 0
    },
    sessionalMax: {
      type: Number,
      default: 40,
      min: 0
    },
    sessionalObtained: {
      type: Number,
      default: 0,
      min: 0
    },
    practicalMax: {
      type: Number,
      default: 0,
      min: 0
    },
    practicalObtained: {
      type: Number,
      default: 0,
      min: 0
    },
    // Total aggregate for this subject
    maxMarks: {
      type: Number,
      default: 100,
      min: 1
    },
    marksObtained: {
      type: Number,
      required: [true, "Marks obtained is required"],
      min: 0
    },
    // Credit and GPA metrics
    creditEarned: {
      type: Number,
      default: 0,
      min: 0
    },
    creditPointEarned: {
      type: Number,
      default: 0,
      min: 0
    },
    grade: {
      type: String,
      enum: GRADE_OPTIONS,
      required: true,
      default: "F"
    },
    gradePoint: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    resultStatus: {
      type: String,
      enum: RESULT_STATUSES,
      default: "PASS"
    },
    academicSession: {
      type: String,
      default: "2024-2025",
      index: true
    },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    remarks: {
      type: String,
      trim: true,
      default: ""
    },
    // Multi-stage workflow governance
    workflowStatus: {
      type: String,
      enum: WORKFLOW_STATUSES,
      default: "draft",
      index: true
    },
    batchId: {
      type: String,
      default: "",
      index: true
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    submittedAt: {
      type: Date,
      default: null
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    sanctionedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    sanctionedAt: {
      type: Date,
      default: null
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    publishedAt: {
      type: Date,
      default: null
    },
    returnReason: {
      type: String,
      default: ""
    },
    returnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    returnedAt: {
      type: Date,
      default: null
    },
    graceMarksAwarded: {
      type: Number,
      default: 0
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

// Compound index supporting Regular, Supplementary, and Carry Over without overwriting
examMarkSchema.index(
  { studentId: 1, subject: 1, examType: 1, academicSession: 1, examinationCategory: 1 },
  { unique: true }
);

// Query optimization indexes for workflow pipelines
examMarkSchema.index({ branch: 1, semester: 1, academicSession: 1, workflowStatus: 1 });
examMarkSchema.index({ subjectCode: 1, workflowStatus: 1 });
examMarkSchema.index({ studentId: 1, isInternalSessional: 1, semester: 1, academicSession: 1 });

const ExamMark = mongoose.model("ExamMark", examMarkSchema);
export default ExamMark;
