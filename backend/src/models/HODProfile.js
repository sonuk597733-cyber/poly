import mongoose from "mongoose";

const hodProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    employeeId: {
      type: String,
      trim: true,
      uppercase: true,
      default: null
    },
    leadershipDetails: {
      type: String,
      trim: true,
      default: ""
    },
    approvalStatus: {
      type: String,
      enum: ["pending_approval", "approved", "rejected"],
      default: "pending_approval",
      index: true
    },
    bio: {
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

const HODProfile = mongoose.model("HODProfile", hodProfileSchema);
export default HODProfile;
