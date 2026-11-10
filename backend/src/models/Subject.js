import mongoose from "mongoose";
import { ALLOWED_BRANCHES } from "./User.js";

const syllabusUnitSchema = new mongoose.Schema(
  {
    unitNumber: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    topics: {
      type: [String],
      default: []
    },
    plannedHours: {
      type: Number,
      default: 10
    },
    completedHours: {
      type: Number,
      default: 0
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  { _id: true }
);

const subjectSchema = new mongoose.Schema(
  {
    branch: {
      type: String,
      enum: ALLOWED_BRANCHES,
      required: [true, "Branch / Department is required"],
      index: true
    },
    semester: {
      type: String,
      required: [true, "Semester is required"],
      index: true
    },
    academicYear: {
      type: String,
      default: "2025-2026",
      index: true
    },
    subjectCode: {
      type: String,
      required: [true, "Subject code is required"],
      trim: true,
      uppercase: true,
      index: true
    },
    subjectName: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true
    },
    credits: {
      type: Number,
      required: true,
      default: 4,
      min: 1,
      max: 10
    },
    type: {
      type: String,
      enum: ["Theory", "Practical", "Tutorial", "Elective", "Workshop", "Project"],
      default: "Theory"
    },
    // Configured Maximum Marks for Internal Sessional Examinations (Subject-Specific)
    sessionalMax: {
      type: Number,
      default: 20,
      min: 5,
      max: 100
    },
    sessional1Max: {
      type: Number,
      default: null
    },
    sessional2Max: {
      type: Number,
      default: null
    },
    sessional3Max: {
      type: Number,
      default: null
    },
    hoursPerWeek: {
      type: Number,
      default: 4,
      min: 1
    },
    // Total planned curriculum lectures for the entire semester term (default 33)
    plannedLectures: {
      type: Number,
      default: 33,
      min: 1
    },
    assignedTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    assignedTeacherName: {
      type: String,
      trim: true,
      default: ""
    },
    preferredRoomType: {
      type: String,
      default: "Classroom",
      trim: true
    },
    requiredConsecutivePeriods: {
      type: Number,
      default: 1,
      min: 1,
      max: 4
    },
    maxPeriodsPerDay: {
      type: Number,
      default: 2,
      min: 1,
      max: 4
    },
    syllabusUnits: {
      type: [syllabusUnitSchema],
      default: []
    },
    syllabusCompletionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    prerequisites: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: ["active", "archived", "draft"],
      default: "active",
      index: true
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

subjectSchema.index({ branch: 1, semester: 1, subjectCode: 1 }, { unique: true });

const Subject = mongoose.model("Subject", subjectSchema);
export default Subject;
