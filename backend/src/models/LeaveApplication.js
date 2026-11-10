import mongoose from "mongoose";

const leaveApplicationSchema = new mongoose.Schema(
  {
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Applicant is required"],
      index: true
    },
    applicantRole: {
      type: String,
      required: true,
      index: true
    },
    applicantName: {
      type: String,
      required: true
    },
    department: {
      type: String,
      default: ""
    },
    leaveType: {
      type: String,
      enum: ["Medical", "Casual", "Academic / Duty", "Personal", "Emergency", "Other"],
      required: [true, "Leave type is required"]
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"]
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"]
    },
    reason: {
      type: String,
      required: [true, "Reason for leave is required"],
      trim: true,
      maxlength: [500, "Reason cannot exceed 500 characters"]
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    reviewerRemarks: {
      type: String,
      trim: true,
      default: ""
    },
    attachmentUrl: {
      type: String,
      default: ""
    },
    emergencyContact: {
      type: String,
      trim: true,
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

const LeaveApplication = mongoose.model(
  "LeaveApplication",
  leaveApplicationSchema
);
export default LeaveApplication;
