import mongoose from "mongoose";
import { ALLOWED_BRANCHES } from "./User.js";

const placedStudentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    studentName: {
      type: String,
      required: true,
      trim: true
    },
    rollNo: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      default: ""
    },
    packageOffered: {
      type: Number,
      default: 0 // LPA for placement or monthly stipend in INR for internship
    },
    offerDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ["offered", "accepted", "joined", "declined"],
      default: "offered"
    }
  },
  { _id: true }
);

const placementRecordSchema = new mongoose.Schema(
  {
    branch: {
      type: String,
      enum: ALLOWED_BRANCHES,
      required: true,
      index: true
    },
    academicBatch: {
      type: String,
      required: true,
      default: "2022-2025",
      index: true
    },
    type: {
      type: String,
      enum: ["Campus Placement", "Industrial Internship", "Skill Training & BootCamp", "Off-Campus Referral"],
      default: "Campus Placement",
      index: true
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    companyWebsite: {
      type: String,
      trim: true,
      default: ""
    },
    companyLocation: {
      type: String,
      trim: true,
      default: "Noida / Delhi NCR"
    },
    jobRole: {
      type: String,
      required: true,
      trim: true
    },
    packageLPA: {
      type: Number,
      required: true,
      default: 4.5,
      min: 0
    },
    driveDate: {
      type: Date,
      required: true,
      index: true
    },
    eligibilityCriteria: {
      minCgpa: { type: Number, default: 6.5 },
      maxBacklogs: { type: Number, default: 0 },
      allowedBranches: [{ type: String, default: "CSE" }]
    },
    selectionRounds: {
      type: [String],
      default: ["Online Aptitude Test", "Technical Coding Round", "HR Interview"]
    },
    currentStage: {
      type: String,
      default: "Applications Open"
    },
    status: {
      type: String,
      enum: ["upcoming", "active", "completed", "cancelled"],
      default: "upcoming",
      index: true
    },
    registeredStudentsCount: {
      type: Number,
      default: 0
    },
    placedStudents: {
      type: [placedStudentSchema],
      default: []
    },
    coordinatorFaculty: {
      type: String,
      trim: true,
      default: ""
    },
    instructions: {
      type: String,
      trim: true,
      default: "Students must carry formal resumes, academic transcripts, and college ID."
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

const PlacementRecord = mongoose.model("PlacementRecord", placementRecordSchema);
export default PlacementRecord;
