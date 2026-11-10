import mongoose from "mongoose";
import { ALLOWED_BRANCHES } from "./User.js";

const timetableVersionSchema = new mongoose.Schema(
  {
    originalTimetableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Timetable",
      required: true,
      index: true
    },
    academicSession: {
      type: String,
      required: true,
      default: "2025-2026",
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
      required: true
    },
    semester: {
      type: String,
      required: true,
      index: true
    },
    section: {
      type: String,
      default: "A",
      index: true
    },
    version: {
      type: Number,
      required: true,
      index: true
    },
    title: {
      type: String,
      default: ""
    },
    collegeName: {
      type: String,
      default: "Swami Vivekanand Subharti University - Subharti Polytechnic"
    },
    effectiveDate: {
      type: String,
      default: ""
    },
    timetableType: {
      type: String,
      enum: ["structured", "image_based"],
      default: "structured"
    },
    creationMode: {
      type: String,
      enum: ["manual", "automatic", "ocr_import", "photo_direct"],
      default: "manual"
    },
    imageUrl: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["published", "archived", "superseded"],
      default: "published"
    },
    snapshotDays: [
      {
        dayOfWeek: { type: String, required: true },
        slots: [
          {
            slotId: { type: String },
            periodNumber: { type: Number },
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
            subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
            subject: { type: String, required: true },
            subjectCode: { type: String },
            teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            teacherName: { type: String },
            teacherDesignation: { type: String, default: "" },
            lectureTitle: { type: String, default: "" },
            notes: { type: String, default: "" },
            roomId: { type: mongoose.Schema.Types.ObjectId, ref: "CampusRoom" },
            roomNo: { type: String },
            type: {
              type: String,
              enum: ["Theory", "Practical", "Tutorial", "Workshop", "Break", "Lunch", "Seminar", "Activity", "Lecture", "Lab"],
              default: "Theory"
            },
            isBreak: { type: Boolean, default: false },
            isConsecutive: { type: Boolean, default: false },
            consecutiveIndex: { type: Number, default: 1 },
            color: { type: String, default: "#FF6B0A" }
          }
        ]
      }
    ],
    summary: {
      totalPeriods: { type: Number, default: 0 },
      theoryPeriods: { type: Number, default: 0 },
      practicalPeriods: { type: Number, default: 0 },
      facultyCount: { type: Number, default: 0 },
      roomCount: { type: Number, default: 0 }
    },
    publishedAt: {
      type: Date,
      default: Date.now
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    publishedByName: {
      type: String,
      default: ""
    },
    changeNotes: {
      type: String,
      default: "Official publication"
    },
    auditLog: [
      {
        user: { type: String, default: "" },
        role: { type: String, default: "" },
        action: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now },
        remarks: { type: String, default: "" }
      }
    ]
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

timetableVersionSchema.index(
  { branch: 1, semester: 1, section: 1, version: 1 },
  { unique: true }
);

const TimetableVersion = mongoose.model("TimetableVersion", timetableVersionSchema);
export default TimetableVersion;
