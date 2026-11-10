import mongoose from "mongoose";
import { ALLOWED_BRANCHES } from "./User.js";

/* ==========================================================================
   SUB-SCHEMAS: ATTACHMENTS, RESOURCES, RUBRIC & SUBMISSIONS
   ========================================================================== */

const assignmentFileAttachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    originalFileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    fileExtension: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    checksum: { type: String, default: null }
  },
  { _id: true, timestamps: true }
);

const assignmentExternalResourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    provider: {
      type: String,
      enum: ["google-drive", "onedrive", "dropbox", "youtube", "github", "website"],
      default: "website"
    },
    description: { type: String, default: "", trim: true }
  },
  { _id: true }
);

const rubricCriteriaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    maxPoints: { type: Number, required: true, min: 1 },
    description: { type: String, default: "", trim: true }
  },
  { _id: true }
);

const rubricScoreSchema = new mongoose.Schema(
  {
    criteriaTitle: { type: String, required: true },
    awardedPoints: { type: Number, required: true, min: 0 },
    maxPoints: { type: Number, required: true }
  },
  { _id: false }
);

const submissionVersionSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now },
    submissionReceipt: { type: String, default: "" },
    answerText: { type: String, default: "" },
    answerHtml: { type: String, default: "" },
    attachments: [assignmentFileAttachmentSchema],
    status: { type: String, default: "submitted" },
    feedback: { type: String, default: "" }
  },
  { _id: true }
);

const submissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "late",
        "under_review",
        "correction_required",
        "resubmitted",
        "evaluated"
      ],
      default: "submitted",
      index: true
    },
    submissionText: {
      type: String,
      trim: true,
      default: ""
    },
    answerHtml: {
      type: String,
      default: ""
    },
    answerText: {
      type: String,
      default: ""
    },
    wordCount: {
      type: Number,
      default: 0
    },
    fileUrl: {
      type: String,
      default: null
    },
    attachments: [assignmentFileAttachmentSchema],
    submissionReceipt: {
      type: String,
      default: null
    },
    version: {
      type: Number,
      default: 1
    },
    previousVersions: [submissionVersionSchema],

    // Grading & Evaluation
    grade: {
      type: Number,
      default: null
    },
    percentage: {
      type: Number,
      default: null
    },
    isPassed: {
      type: Boolean,
      default: null
    },
    feedback: {
      type: String,
      trim: true,
      default: ""
    },
    correctionInstructions: {
      type: String,
      trim: true,
      default: ""
    },
    privateRemarks: {
      type: String,
      trim: true,
      default: ""
    },
    rubricScores: [rubricScoreSchema],
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    evaluatorName: {
      type: String,
      default: ""
    },
    evaluatedAt: {
      type: Date,
      default: null
    },
    isResultPublished: {
      type: Boolean,
      default: false
    }
  },
  { _id: true, timestamps: true }
);

/* ==========================================================================
   ASSIGNMENT ROOT SCHEMA
   ========================================================================== */

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Assignment title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"]
    },
    shortDescription: {
      type: String,
      trim: true,
      default: ""
    },
    description: {
      type: String,
      required: [true, "Assignment description/instructions are required"],
      trim: true
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
      required: [true, "Semester is required"],
      index: true
    },
    section: {
      type: String,
      default: "All",
      trim: true
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      index: true
    },
    subjectCode: {
      type: String,
      trim: true,
      default: ""
    },
    unit: {
      type: String,
      trim: true,
      default: ""
    },
    chapter: {
      type: String,
      trim: true,
      default: ""
    },
    category: {
      type: String,
      enum: [
        "Lab Assignment",
        "Homework Problem Set",
        "Mini Project / Capstone",
        "Case Study",
        "Viva Preparation",
        "Theory Problem Set"
      ],
      default: "Lab Assignment"
    },
    type: {
      type: String,
      enum: ["individual", "group"],
      default: "individual"
    },
    priority: {
      type: String,
      enum: ["high", "medium", "normal"],
      default: "normal"
    },
    status: {
      type: String,
      enum: ["draft", "published", "scheduled", "closed", "cancelled", "archived"],
      default: "published",
      index: true
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    },
    totalPoints: {
      type: Number,
      default: 100,
      min: [1, "Total marks must be at least 1"]
    },
    maxMarks: {
      type: Number,
      default: 100
    },
    passingMarks: {
      type: Number,
      default: 40
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
      index: true
    },
    dueTime: {
      type: String,
      default: "23:59"
    },
    lateSubmissionPolicy: {
      type: String,
      enum: ["allowed_penalty", "allowed_no_penalty", "disallowed"],
      default: "allowed_penalty"
    },
    latePenaltyPercent: {
      type: Number,
      default: 10,
      min: 0,
      max: 100
    },
    maxFileSizeMB: {
      type: Number,
      default: 50
    },
    allowedFileFormats: {
      type: [String],
      default: [".pdf", ".docx", ".doc", ".zip", ".png", ".jpg"]
    },

    // Reference Materials & Cloud Links
    referenceAttachments: [assignmentFileAttachmentSchema],
    externalResources: [assignmentExternalResourceSchema],

    // Rubric / Evaluation Criteria
    rubricCriteria: [rubricCriteriaSchema],

    // Academic Target Scope
    targetScope: {
      scopeType: {
        type: String,
        enum: ["entire_branch", "specific_semester", "specific_section", "selected_students"],
        default: "specific_semester"
      },
      studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
    },

    // Creator & Audit Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    creatorRole: {
      type: String,
      enum: ["teacher", "coordinator", "hod", "principal", "admin"],
      default: "teacher"
    },
    creatorName: {
      type: String,
      default: ""
    },
    publishedAt: {
      type: Date,
      default: Date.now
    },

    // Student Submissions Collection
    submissions: [submissionSchema]
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

// Synchronize maxMarks and totalPoints
assignmentSchema.pre("save", function (next) {
  if (this.totalPoints && !this.maxMarks) {
    this.maxMarks = this.totalPoints;
  } else if (this.maxMarks && !this.totalPoints) {
    this.totalPoints = this.maxMarks;
  }
  next();
});

// Compound indexes for optimal multi-role query speed
assignmentSchema.index({ branch: 1, semester: 1, status: 1 });
assignmentSchema.index({ createdBy: 1, status: 1 });

const Assignment = mongoose.model("Assignment", assignmentSchema);
export default Assignment;
