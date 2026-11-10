import mongoose from "mongoose";
import { ALLOWED_BRANCHES } from "./User.js";

const slotSchema = new mongoose.Schema(
  {
    slotId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    periodNumber: {
      type: Number,
      default: 1
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
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    subjectCode: {
      type: String,
      trim: true,
      default: ""
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    teacherName: {
      type: String,
      trim: true,
      default: ""
    },
    teacherDesignation: {
      type: String,
      trim: true,
      default: ""
    },
    lectureTitle: {
      type: String,
      trim: true,
      default: ""
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CampusRoom",
      default: null
    },
    roomNo: {
      type: String,
      trim: true,
      default: "Room 101"
    },
    type: {
      type: String,
      enum: [
        "Theory",
        "Practical",
        "Tutorial",
        "Workshop",
        "Break",
        "Lunch",
        "Seminar",
        "Activity",
        "Lecture",
        "Lab"
      ],
      default: "Theory"
    },
    isBreak: {
      type: Boolean,
      default: false
    },
    isConsecutive: {
      type: Boolean,
      default: false
    },
    consecutiveIndex: {
      type: Number,
      default: 1
    },
    color: {
      type: String,
      default: "#FF6B0A"
    }
  },
  { _id: true }
);

const scheduleDaySchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: true
    },
    slots: [slotSchema]
  },
  { _id: true }
);

const approvalAuditSchema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: { type: String, required: true },
    action: {
      type: String,
      enum: [
        "created",
        "generated",
        "edited",
        "submitted_for_approval",
        "approved",
        "rejected",
        "changes_requested",
        "published",
        "unshared",
        "archived",
        "restored"
      ],
      required: true
    },
    timestamp: { type: Date, default: Date.now },
    remarks: { type: String, default: "" }
  },
  { _id: true }
);

const timetableSchema = new mongoose.Schema(
  {
    academicSession: {
      type: String,
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
    academicYear: {
      type: String,
      default: "3rd Year",
      trim: true
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
    title: {
      type: String,
      trim: true,
      default: ""
    },
    collegeName: {
      type: String,
      trim: true,
      default: "Swami Vivekanand Subharti University - Subharti Polytechnic"
    },
    effectiveDate: {
      type: String,
      trim: true,
      default: ""
    },
    timetableType: {
      type: String,
      enum: ["structured", "image_based"],
      default: "structured",
      index: true
    },
    creationMode: {
      type: String,
      enum: ["manual", "automatic", "ocr_import", "photo_direct"],
      default: "manual",
      index: true
    },
    imageUrl: {
      type: String,
      default: ""
    },
    imageOriginalName: {
      type: String,
      default: ""
    },
    imageMimeType: {
      type: String,
      default: ""
    },
    imageSizeBytes: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: [
        "draft",
        "generated",
        "under_review",
        "changes_requested",
        "approved",
        "published",
        "archived"
      ],
      default: "draft",
      index: true
    },
    version: {
      type: Number,
      default: 1,
      index: true
    },
    isCurrentPublished: {
      type: Boolean,
      default: false,
      index: true
    },
    isMaster: {
      type: Boolean,
      default: true,
      index: true
    },
    // Multi-day weekly timetable
    scheduleDays: [scheduleDaySchema],

    // Legacy daily compatibility fields
    dayOfWeek: {
      type: String,
      default: null
    },
    slots: [slotSchema],

    // Workflow & Audit
    approvalHistory: [approvalAuditSchema],
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    submittedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    publishedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "" },

    // Metrics summary cache
    metrics: {
      totalPeriods: { type: Number, default: 0 },
      theoryPeriods: { type: Number, default: 0 },
      practicalPeriods: { type: Number, default: 0 },
      facultyCount: { type: Number, default: 0 },
      roomCount: { type: Number, default: 0 },
      weeklyCompletionRate: { type: Number, default: 0 }
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

// Indexes
timetableSchema.index(
  { branch: 1, semester: 1, section: 1, isMaster: 1, isCurrentPublished: 1 }
);
timetableSchema.index(
  { branch: 1, semester: 1, section: 1, isMaster: 1, status: 1 }
);

const Timetable = mongoose.model("Timetable", timetableSchema);
export default Timetable;
