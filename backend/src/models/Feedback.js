import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    studentName: {
      type: String,
      required: true
    },
    branch: {
      type: String,
      default: "CSE",
      index: true
    },
    category: {
      type: String,
      enum: ["Academic Curriculum", "Faculty & Lectures", "Laboratory Facilities", "Library & Books", "Campus Infrastructure", "Cafeteria & Hygiene", "Examinations & Grading", "General Grievance"],
      default: "Academic Curriculum",
      index: true
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    status: {
      type: String,
      enum: ["submitted", "in_review", "resolved", "dismissed"],
      default: "submitted",
      index: true
    },
    response: {
      type: String,
      default: ""
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    respondedByName: {
      type: String,
      default: ""
    },
    respondedAt: {
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

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
