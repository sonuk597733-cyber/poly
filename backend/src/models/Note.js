import mongoose from "mongoose";
import { ALLOWED_BRANCHES } from "./User.js";

export const NOTE_CATEGORIES = [
  "Lecture Notes",
  "Syllabus",
  "Lab Manual",
  "Assignment Material",
  "Important Questions",
  "Previous Year Papers",
  "Reference Material",
  "Viva Preparation",
  "Model Question Paper",
  "Academic Guidelines",
  "Question Bank"
];

export const NOTE_FILE_TYPES = [
  "pdf",
  "pptx",
  "ppt",
  "docx",
  "doc",
  "xlsx",
  "xls",
  "zip",
  "rar",
  "png",
  "jpg",
  "jpeg",
  "txt"
];

const noteFileAttachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    originalFileName: { type: String, required: true },
    storedFileName: { type: String, required: true },
    filePath: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true, default: 0 },
    checksum: { type: String, default: "" }, // SHA-256
    fileExtension: { type: String, default: "pdf" }
  },
  { _id: true, timestamps: true }
);

const noteExternalResourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    url: { type: String, required: true, trim: true },
    provider: {
      type: String,
      enum: ["google-drive", "onedrive", "dropbox", "youtube", "github", "document", "educational", "website"],
      default: "website"
    },
    resourceType: {
      type: String,
      enum: [
        "view",
        "direct-download",
        "reference",
        "embed",
        "reference_guide",
        "cloud_folder",
        "video_explanation",
        "source_code",
        "documentation",
        "online_article"
      ],
      default: "view"
    },
    embedUrl: { type: String, default: null },
    description: { type: String, default: "" },
    expiryDate: { type: Date, default: null }
  },
  { _id: true, timestamps: true }
);

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Note title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"]
    },
    description: {
      type: String,
      trim: true,
      default: ""
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
    branch: {
      type: String,
      enum: ALLOWED_BRANCHES,
      required: [true, "Branch is required"],
      index: true
    },
    semester: {
      type: String,
      required: [true, "Semester is required"],
      index: true
    },
    academicYear: {
      type: String,
      enum: ["1st Year", "2nd Year", "3rd Year"],
      default: "1st Year"
    },
    unit: {
      type: String,
      trim: true,
      default: "Unit 1"
    },
    chapter: {
      type: String,
      trim: true,
      default: ""
    },
    category: {
      type: String,
      enum: NOTE_CATEGORIES,
      default: "Lecture Notes",
      index: true
    },
    uploadMode: {
      type: String,
      enum: ["file", "url", "both"],
      default: "file",
      index: true
    },
    uploaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    uploaderName: {
      type: String,
      required: true
    },
    uploaderRole: {
      type: String,
      enum: ["teacher", "coordinator", "hod", "principal", "admin"],
      required: true,
      index: true
    },
    uploaderDesignation: {
      type: String,
      default: "Faculty Lead"
    },
    uploaderDepartment: {
      type: String,
      default: ""
    },
    // Primary file for backward-compatibility with single-file endpoints
    file: {
      type: noteFileAttachmentSchema,
      required: false,
      default: null
    },
    // Multiple file attachments
    files: {
      type: [noteFileAttachmentSchema],
      default: []
    },
    // External Cloud & Educational Reference URLs
    externalResources: {
      type: [noteExternalResourceSchema],
      default: []
    },
    isImportant: {
      type: Boolean,
      default: false,
      index: true
    },
    publicationStatus: {
      type: String,
      enum: ["published", "draft", "archived"],
      default: "published",
      index: true
    },
    targetGroups: {
      type: [String],
      default: ["All Students"]
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0
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

noteSchema.index({ branch: 1, semester: 1, publicationStatus: 1 });
noteSchema.index({ subject: 1, unit: 1 });
noteSchema.index({ uploaderId: 1, publicationStatus: 1 });
noteSchema.index({ uploaderRole: 1, branch: 1 });
noteSchema.index({ uploadMode: 1, branch: 1 });
noteSchema.index({ createdAt: -1 });

const Note = mongoose.model("Note", noteSchema);
export default Note;
