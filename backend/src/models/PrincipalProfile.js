import mongoose from "mongoose";

const principalProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    designation: {
      type: String,
      default: "Principal / Executive Director",
      trim: true
    },
    employeeId: {
      type: String,
      trim: true,
      uppercase: true,
      default: null
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

const PrincipalProfile = mongoose.model("PrincipalProfile", principalProfileSchema);
export default PrincipalProfile;
