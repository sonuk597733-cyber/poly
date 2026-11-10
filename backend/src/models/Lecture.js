import mongoose from "mongoose";
import { ALLOWED_BRANCHES } from "./User.js";

const resourceAttachmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Resource title is required"],
      trim: true,
      maxlength: 120
    },
    resourceType: {
      type: String,
      enum: [
        "notes_pdf",
        "slides_ppt",
        "reference_doc",
        "audio_lecture",
        "code_archive",
        "image_attachment",
        "spreadsheet",
        "other"
      ],
      default: "notes_pdf"
    },
    fileUrl: {
      type: String,
      required: [true, "Resource file URL is required"]
    },
    filename: {
      type: String,
      default: ""
    },
    originalname: {
      type: String,
      default: ""
    },
    filesize: {
      type: Number,
      default: 0
    },
    mimetype: {
      type: String,
      default: ""
    },
    downloadCount: {
      type: Number,
      default: 0
    }
  },
  { _id: true, timestamps: true }
);

const lectureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Lecture title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"]
    },
    description: {
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
    subjectCode: {
      type: String,
      trim: true,
      default: ""
    },
    topic: {
      type: String,
      required: [true, "Topic / Chapter is required"],
      trim: true,
      index: true
    },
    unitNumber: {
      type: Number,
      default: 1
    },
    lectureType: {
      type: String,
      enum: [
        "Theory",
        "Practical / Lab Demo",
        "Practical",
        "Tutorial",
        "Revision",
        "Guest Lecture",
        "Notes",
        "Study Material"
      ],
      default: "Theory",
      index: true
    },
    videoSource: {
      type: String,
      enum: ["upload", "youtube", "external", "none", "documents"],
      default: "upload"
    },
    videoUrl: {
      type: String,
      default: ""
    },
    videoFile: {
      filename: { type: String, default: "" },
      originalname: { type: String, default: "" },
      mimetype: { type: String, default: "" },
      size: { type: Number, default: 0 },
      path: { type: String, default: "" }
    },
    durationMinutes: {
      type: Number,
      default: 45
    },
    durationSeconds: {
      type: Number,
      default: 2700
    },
    thumbnailUrl: {
      type: String,
      default: ""
    },
    thumbnailFile: {
      filename: { type: String, default: "" },
      mimetype: { type: String, default: "" },
      path: { type: String, default: "" }
    },
    resources: {
      type: [resourceAttachmentSchema],
      default: []
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    uploadedByName: {
      type: String,
      required: true
    },
    uploadedByRole: {
      type: String,
      required: true
    },
    uploadedByDesignation: {
      type: String,
      default: "Faculty"
    },
    uploadedByDepartment: {
      type: String,
      default: ""
    },
    uploadedByAvatar: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["published", "draft", "archived"],
      default: "published",
      index: true
    },
    viewsCount: {
      type: Number,
      default: 0
    },
    completionsCount: {
      type: Number,
      default: 0
    },
    downloadsCount: {
      type: Number,
      default: 0
    },
    tags: {
      type: [String],
      default: []
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

lectureSchema.index({ branch: 1, semester: 1, subject: 1, createdAt: -1 });

const Lecture = mongoose.model("Lecture", lectureSchema);
export default Lecture;
