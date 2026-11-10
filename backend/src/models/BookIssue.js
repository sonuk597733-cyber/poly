import mongoose from "mongoose";

const bookIssueSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LibraryBook",
      required: true,
      index: true
    },
    bookTitle: {
      type: String,
      required: true
    },
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
    enrollmentNo: {
      type: String,
      default: ""
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      required: true
    },
    returnDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ["issued", "returned", "overdue"],
      default: "issued",
      index: true
    },
    fineAmount: {
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

const BookIssue = mongoose.model("BookIssue", bookIssueSchema);
export default BookIssue;
