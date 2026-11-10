import crypto from "node:crypto";

/**
 * Generate cryptographically secure 6-digit numeric OTP
 */
export function generateOtp() {
  const otpNumber = crypto.randomInt(100000, 1000000);
  return String(otpNumber);
}

/**
 * Compute SHA-256 hash of plaintext OTP
 */
export function hashOtp(otp) {
  return crypto
    .createHash("sha256")
    .update(String(otp).trim())
    .digest("hex");
}

/**
 * Constant-time comparison between entered OTP and stored hash
 */
export function verifyOtpConstantTime(enteredOtp, storedHash) {
  if (!enteredOtp || !storedHash) return false;
  const enteredHash = hashOtp(enteredOtp);

  try {
    const enteredBuf = Buffer.from(enteredHash, "hex");
    const storedBuf = Buffer.from(storedHash, "hex");
    if (enteredBuf.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(enteredBuf, storedBuf);
  } catch {
    return false;
  }
}

/**
 * Mask an email address for safe UI presentation
 * Example: "aarav.sharma@subharti.org" -> "a***a@subharti.org"
 */
export function maskEmail(email = "") {
  const clean = String(email).trim().toLowerCase();
  const atIndex = clean.indexOf("@");
  if (atIndex <= 1) return clean;

  const user = clean.slice(0, atIndex);
  const domain = clean.slice(atIndex);

  if (user.length <= 2) {
    return `${user[0]}*${domain}`;
  }

  const first = user[0];
  const last = user[user.length - 1];
  return `${first}***${last}${domain}`;
}
