import { z } from "zod";

export const emailSchema = z.string().email("Enter a valid email");
export const mobileSchema = z.string().regex(/^[0-9]{10}$/, "Enter a 10-digit mobile number");
export const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
export const pinSchema = z.string().regex(/^[0-9]{4,6}$/, "PIN must be 4-6 digits");
export const otpSchema = z.string().regex(/^[0-9]{4,6}$/, "Enter the OTP");

export const loginSchema = z.object({
  identifier: z.string().min(3, "Enter email, username, or mobile"),
  password: passwordSchema,
  remember: z.boolean().optional(),
});
export type LoginSchema = z.infer<typeof loginSchema>;

export const otpRequestSchema = z.object({
  identifier: z.string().min(3, "Enter email or mobile"),
});
export const otpVerifySchema = otpRequestSchema.extend({ otp: otpSchema });

export const pinLoginSchema = z.object({
  identifier: z.string().min(3, "Enter mobile or username"),
  pin: pinSchema,
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(3, "Enter email or mobile"),
});
