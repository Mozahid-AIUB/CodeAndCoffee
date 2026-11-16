import { z } from "zod";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/config";

const emailBase = z.string().trim().toLowerCase().email("Enter a valid email address").max(120);

/** Registration: only the company domain is allowed (also enforced in the database). */
export const companyEmailSchema = emailBase.refine(
  (v) => v.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`),
  `Please use your Manus Technology email (@${ALLOWED_EMAIL_DOMAIN})`,
);

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "At most 72 characters");

export const loginSchema = z.object({
  email: emailBase,
  password: z.string().min(1).max(72),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(80),
    email: companyEmailSchema,
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });
