import mongoose from "mongoose";
import { ALLOWED_ROLES } from "./User.js";

const pendingRegistrationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ALLOWED_ROLES,
      required: true
    },
    status: {
      type: String,
      default: "pending_verification"
    },
    roleData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    otpHash: {
      type: String,
      required: true
    },
    otpExpiresAt: {
      type: Date,
      required: true,
      index: true
    },
    otpAttempts: {
      type: Number,
      default: 0
    },
    resendAttempts: {
      type: Number,
      default: 0
    },
    lastResentAt: {
      type: Date,
      default: Date.now
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 1800 // TTL Index: automatically removes abandoned registrations after 30 minutes
    }
  },
  {
    timestamps: true
  }
);

const PendingRegistration = mongoose.model(
  "PendingRegistration",
  pendingRegistrationSchema
);

export default PendingRegistration;
