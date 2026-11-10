import { ALLOWED_ROLES, ALLOWED_BRANCHES } from "../models/User.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate registration input and prevent privileged role escalation
 */
export function validateRegistration(data = {}) {
  const errors = [];

  const fullName = typeof data.fullName === "string" ? data.fullName.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const password = typeof data.password === "string" ? data.password : "";
  let role = typeof data.role === "string" ? data.role.trim().toLowerCase() : "student";

  // 1. Full name validation
  if (!fullName || fullName.length < 2) {
    errors.push("Full name must be at least 2 characters long.");
  } else if (fullName.length > 100) {
    errors.push("Full name cannot exceed 100 characters.");
  }

  // 2. Email validation
  if (!email || !EMAIL_REGEX.test(email)) {
    errors.push("Please provide a valid institutional or personal email address.");
  }

  // 3. Password policy
  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters long.");
  } else {
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter.");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter.");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number.");
    }
  }

  // 4. Role validation & Public Escalation Defense
  if (role === "admin") {
    // Public registration CANNOT create administrator accounts
    errors.push("Administrator accounts cannot be provisioned via public registration.");
  } else if (!ALLOWED_ROLES.includes(role)) {
    errors.push(`Invalid role selected: ${role}.`);
  }

  // Determine initial status based on institutional policy:
  // Students receive pending_verification (academic records ledger sync)
  // Staff (teacher, coordinator, hod, principal) receive pending_approval (requires Dean authorization)
  const isStaff = role !== "student";
  const initialStatus = isStaff ? "pending_approval" : "pending_verification";

  // 5. Student-specific fields
  if (role === "student") {
    if (data.branch && !ALLOWED_BRANCHES.includes(data.branch)) {
      errors.push(`Branch must be one of: ${ALLOWED_BRANCHES.join(", ")}.`);
    }
  }

  // 6. Staff-specific fields
  if (isStaff) {
    if (!data.department || typeof data.department !== "string" || !data.department.trim()) {
      errors.push("Department is required for staff access requests.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      fullName,
      email,
      password,
      role,
      status: initialStatus,
      branch: data.branch || null,
      academicYear: data.academicYear || null,
      semester: data.semester || null,
      enrollmentNo: data.enrollmentNo ? data.enrollmentNo.trim().toUpperCase() : null,
      department: data.department ? data.department.trim() : null,
      employeeId: data.employeeId ? data.employeeId.trim().toUpperCase() : null,
      responsibilities: data.responsibilities ? data.responsibilities.trim() : null
    }
  };
}

/**
 * Validate login input
 */
export function validateLogin(data = {}) {
  const errors = [];
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const password = typeof data.password === "string" ? data.password : "";

  if (!email || !EMAIL_REGEX.test(email)) {
    errors.push("Please provide a valid email address.");
  }
  if (!password) {
    errors.push("Password is required.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: { email, password }
  };
}

/**
 * Validate forgot password input
 */
export function validateForgotPassword(data = {}) {
  const errors = [];
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";

  if (!email || !EMAIL_REGEX.test(email)) {
    errors.push("Please provide a valid email address.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: { email }
  };
}

/**
 * Validate reset password input
 */
export function validateResetPassword(data = {}) {
  const errors = [];
  const token = typeof data.token === "string" ? data.token.trim() : "";
  const newPassword = typeof data.newPassword === "string" ? data.newPassword : "";

  if (!token) {
    errors.push("Password reset token is required.");
  }

  if (!newPassword || newPassword.length < 8) {
    errors.push("New password must be at least 8 characters long.");
  } else {
    if (!/[A-Z]/.test(newPassword)) {
      errors.push("New password must contain at least one uppercase letter.");
    }
    if (!/[a-z]/.test(newPassword)) {
      errors.push("New password must contain at least one lowercase letter.");
    }
    if (!/[0-9]/.test(newPassword)) {
      errors.push("New password must contain at least one number.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: { token, newPassword }
  };
}

/**
 * Map arbitrary department or branch string to standard ALLOWED_BRANCHES ("CSE", "Mechanical", etc.)
 */
export function resolveDepartmentBranch(department) {
  if (!department || typeof department !== "string") return "CSE";
  const clean = department.trim();
  const lower = clean.toLowerCase();
  if (lower.includes("computer") || lower === "cse") return "CSE";
  if (lower.includes("mech")) return "Mechanical";
  if (lower.includes("elec") && !lower.includes("comm")) return "Electrical";
  if (lower.includes("civil")) return "Civil";
  if (lower.includes("ece") || lower.includes("electronic") || lower.includes("communication")) return "ECE";
  const stripped = clean.replace(/Engineering|Department of|Dept of/gi, "").trim();
  return stripped || clean;
}

/**
 * Return branch key, aliases, and MongoDB query filter for cross-matching department and branch names
 */
export function getDepartmentQueryFilter(department) {
  const branchKey = resolveDepartmentBranch(department);
  const aliases = [
    branchKey,
    department,
    ...(branchKey === "CSE" ? ["Computer Science & Engineering", "Computer Science"] : []),
    ...(branchKey === "Mechanical" ? ["Mechanical Engineering"] : []),
    ...(branchKey === "Electrical" ? ["Electrical Engineering"] : []),
    ...(branchKey === "Civil" ? ["Civil Engineering"] : []),
    ...(branchKey === "ECE" ? ["Electronics & Communication", "Electronics & Communication Engineering"] : [])
  ].filter(Boolean);

  const uniqueAliases = Array.from(new Set(aliases));
  return {
    branchKey,
    aliases: uniqueAliases,
    queryFilter: { $in: uniqueAliases }
  };
}

/**
 * Return canonical semester variants and MongoDB query filter for cross-matching semester formats
 * E.g., "5th Semester", "Semester 5", "5", "Sem 5"
 */
export function getSemesterQueryFilter(rawSemester) {
  if (!rawSemester) {
    return {
      num: null,
      canonical: "Semester 1",
      ordinal: "1st Semester",
      variants: [],
      queryFilter: { $exists: true }
    };
  }

  const str = String(rawSemester).trim();
  const match = str.match(/\d+/);
  if (!match) {
    return {
      num: null,
      canonical: str,
      ordinal: str,
      variants: [str],
      queryFilter: str
    };
  }

  const num = parseInt(match[0], 10);
  const ordSuffix = num === 1 ? "st" : num === 2 ? "nd" : num === 3 ? "rd" : "th";

  const variants = [
    `Semester ${num}`,
    `${num}${ordSuffix} Semester`,
    `${num}${ordSuffix} Sem`,
    `Sem ${num}`,
    `Semester-${num}`,
    `Sem-${num}`,
    `${num}${ordSuffix}`,
    `${num}`
  ];

  const uniqueVariants = Array.from(new Set(variants));

  return {
    num,
    canonical: `Semester ${num}`,
    ordinal: `${num}${ordSuffix} Semester`,
    variants: uniqueVariants,
    queryFilter: { $in: uniqueVariants }
  };
}

/**
 * Check if two semester strings refer to the same academic semester
 */
export function isSameSemester(semA, semB) {
  if (!semA || !semB) return false;
  const strA = String(semA).trim().toLowerCase();
  const strB = String(semB).trim().toLowerCase();
  if (strA === strB) return true;

  const matchA = strA.match(/\d+/);
  const matchB = strB.match(/\d+/);
  if (matchA && matchB) {
    return parseInt(matchA[0], 10) === parseInt(matchB[0], 10);
  }
  return false;
}

/**
 * Check if two branch strings refer to the same academic department/branch
 */
export function isSameBranch(branchA, branchB) {
  if (!branchA || !branchB) return false;
  const strA = String(branchA).trim().toUpperCase();
  const strB = String(branchB).trim().toUpperCase();
  if (strA === "ALL" || strB === "ALL") return true;
  return resolveDepartmentBranch(branchA) === resolveDepartmentBranch(branchB);
}


