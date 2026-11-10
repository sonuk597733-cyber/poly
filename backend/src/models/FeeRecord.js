import mongoose from "mongoose";

const feeRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    enrollmentNo: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    branch: {
      type: String,
      required: true,
      index: true
    },
    semester: {
      type: String,
      required: true,
      index: true
    },
    academicYear: {
      type: String,
      default: "2024-2025"
    },
    feeType: {
      type: String,
      enum: ["Tuition Fee", "Examination Fee", "Laboratory & Library Fee", "Development Fee", "Hostel & Transport", "Miscellaneous"],
      default: "Tuition Fee"
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    dueAmount: {
      type: Number,
      required: true,
      min: 0
    },
    dueDate: {
      type: Date,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "unpaid", "overdue"],
      default: "unpaid",
      index: true
    },
    paymentHistory: [
      {
        receiptNo: { type: String, required: true },
        amount: { type: Number, required: true },
        paymentMethod: { type: String, default: "Online UPI / NetBanking" },
        transactionId: { type: String, required: true },
        paidAt: { type: Date, default: Date.now },
        receivedBy: { type: String, default: "Accounts Gateway" },
        notes: { type: String, default: "" }
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

feeRecordSchema.index({ studentId: 1, semester: 1, feeType: 1 });

const FeeRecord = mongoose.model("FeeRecord", feeRecordSchema);
export default FeeRecord;
