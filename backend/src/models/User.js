import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

export const ALLOWED_ROLES = [
  "student",
  "teacher",
  "coordinator",
  "hod",
  "principal",
  "admin"
];

export const ALLOWED_BRANCHES = [
  "CSE",
  "Mechanical",
  "Electrical",
  "Civil",
  "ECE"
];

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name cannot exceed 100 characters"]
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address"
      ]
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false
    },
    role: {
      type: String,
      enum: {
        values: ALLOWED_ROLES,
        message: "{VALUE} is not a supported institutional role"
      },
      default: "student",
      index: true
    },
    status: {
      type: String,
      enum: [
        "verified",
        "pending_verification",
        "pending_approval",
        "active",
        "suspended"
      ],
      default: "pending_verification",
      index: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true
    },
    // LinkedIn-Style Profile customization fields
    avatarUrl: {
      type: String,
      default: null
    },
    avatarFileId: {
      type: String,
      default: null
    },
    coverUrl: {
      type: String,
      default: null
    },
    coverFileId: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      default: ""
    },
    phone: {
      type: String,
      trim: true,
      default: ""
    },
    headline: {
      type: String,
      trim: true,
      maxlength: [120, "Headline cannot exceed 120 characters"],
      default: ""
    },
    location: {
      type: String,
      trim: true,
      maxlength: [120, "Location cannot exceed 120 characters"],
      default: ""
    },
    // Personal Details & Contact
    dateOfBirth: {
      type: Date,
      default: null
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say", ""],
      default: ""
    },
    address: {
      type: String,
      trim: true,
      default: ""
    },
    city: {
      type: String,
      trim: true,
      default: ""
    },
    state: {
      type: String,
      trim: true,
      default: ""
    },
    pincode: {
      type: String,
      trim: true,
      default: ""
    },
    emergencyContact: {
      name: { type: String, trim: true, default: "" },
      relation: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" }
    },
    loginHistory: [
      {
        ipAddress: { type: String, default: "127.0.0.1" },
        userAgent: { type: String, default: "" },
        device: { type: String, default: "Desktop" },
        loggedInAt: { type: Date, default: Date.now }
      }
    ],
    // Password Recovery Fields (Never exposed in JSON)
    passwordResetTokenHash: {
      type: String,
      default: null,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      default: null,
      select: false
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    passwordChangedAt: {
      type: Date,
      default: null,
      select: false
    },
    preferences: {
      theme: {
        type: String,
        enum: ["dark", "light", "system"],
        default: "system"
      },
      tableDensity: {
        type: String,
        enum: ["comfortable", "compact"],
        default: "comfortable"
      },
      defaultLandingTab: {
        type: String,
        default: "overview"
      },
      tablePageSize: {
        type: Number,
        default: 10
      },
      reducedMotion: {
        type: Boolean,
        default: false
      },
      notifications: {
        emailNotifications: { type: Boolean, default: true },
        inAppNotifications: { type: Boolean, default: true },
        smsNotifications: { type: Boolean, default: false },
        whatsappNotifications: { type: Boolean, default: false },
        facultyLeaveAlerts: { type: Boolean, default: true },
        examSubmissionAlerts: { type: Boolean, default: true },
        nbaComplianceAlerts: { type: Boolean, default: true },
        lowAttendanceAlerts: { type: Boolean, default: true },
        academicRiskAlerts: { type: Boolean, default: true },
        emailDigest: { type: Boolean, default: false }
      },
      reports: {
        defaultPeriod: {
          type: String,
          enum: ["semester", "academic_year", "monthly"],
          default: "semester"
        },
        exportFormat: {
          type: String,
          enum: ["pdf", "csv", "excel"],
          default: "pdf"
        }
      }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.passwordResetTokenHash;
        delete ret.passwordResetExpires;
        delete ret.passwordChangedAt;
        return ret;
      }
    }
  }
);

/**
 * Compare entered password with stored bcrypt hash
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

/**
 * Generate cryptographically secure password reset token
 */
userSchema.methods.createPasswordResetToken = function (expiryMinutes = 15) {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = new Date(Date.now() + expiryMinutes * 60 * 1000);
  return resetToken;
};

/**
 * Static helper to hash plaintext password using bcrypt
 */
userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const User = mongoose.model("User", userSchema);
export default User;
