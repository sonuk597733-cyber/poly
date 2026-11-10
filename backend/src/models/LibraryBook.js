import mongoose from "mongoose";

const libraryBookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    author: {
      type: String,
      required: true,
      trim: true
    },
    isbn: {
      type: String,
      trim: true,
      default: ""
    },
    category: {
      type: String,
      enum: ["Computer Science", "Mechanical", "Electrical", "Civil", "Electronics", "Applied Mathematics", "Physics & Chemistry", "General Reference"],
      default: "Computer Science",
      index: true
    },
    totalCopies: {
      type: Number,
      required: true,
      default: 5
    },
    availableCopies: {
      type: Number,
      required: true,
      default: 5
    },
    shelfLocation: {
      type: String,
      default: "Stack A-12"
    },
    coverUrl: {
      type: String,
      default: ""
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

const LibraryBook = mongoose.model("LibraryBook", libraryBookSchema);
export default LibraryBook;
