import mongoose from "mongoose";
import { ALLOWED_BRANCHES } from "./User.js";

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Material title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"]
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    type: {
      type: String,
      enum: ["notes", "video", "lab_manual", "syllabus"],
      default: "notes"
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
      required: [true, "Academic year is required"]
    },
    semester: {
      type: String,
      required: [true, "Semester is required"],
      index: true
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      index: true
    },
    fileUrl: {
      type: String,
      default: null
    },
    videoUrl: {
      type: String,
      default: null
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    uploadedByName: {
      type: String,
      required: true
    },
    uploadedByRole: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

materialSchema.index({ branch: 1, semester: 1, subject: 1 });

const Material = mongoose.model("Material", materialSchema);
export default Material;
