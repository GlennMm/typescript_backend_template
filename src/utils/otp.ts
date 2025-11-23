import crypto from "node:crypto";
import { hashPassword } from "./password";

/**
 * Generate a secure OTP (One-Time Password)
 * @param length - Length of the OTP (default: 8)
 * @returns A random alphanumeric OTP
 */
export function generateOTP(length: number = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluded similar looking chars (0,O,1,I)
  let otp = "";

  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += chars[randomBytes[i] % chars.length];
  }

  return otp;
}

/**
 * Generate a numeric OTP
 * @param length - Length of the OTP (default: 6)
 * @returns A random numeric OTP
 */
export function generateNumericOTP(length: number = 6): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0);
  return String(min + (randomNumber % (max - min + 1))).padStart(length, "0");
}

/**
 * Hash an OTP for storage
 */
export async function hashOTP(otp: string): Promise<string> {
  return hashPassword(otp);
}

/**
 * Get OTP expiration time (15 minutes from now)
 */
export function getOTPExpiration(): Date {
  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 15);
  return expirationTime;
}
