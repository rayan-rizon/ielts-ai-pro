import { z } from 'zod';
import { emailDomainSuggestion } from '../../supabase/functions/_shared/emailAddress';

/**
 * Authentication validation schemas
 */

// Copy/paste from rich text can add characters that are invisible but not
// whitespace to JavaScript. Removing them before validation keeps equivalent
// email input from creating a separate account or failing sign-in.
const INVISIBLE_EMAIL_CHARACTERS = /[\u200B-\u200D\u2060\uFEFF]/g;

export const normalizeEmailInput = (value: string): string =>
  value.replace(INVISIBLE_EMAIL_CHARACTERS, '').trim();

export const emailSchema = z
  .string()
  .transform(normalizeEmailInput)
  .pipe(z.string().min(1, 'Email is required').email('Please enter a valid email address'));

export const passwordSchema = z
  .string()
  .min(1, 'Password is required')
  .min(6, 'Password must be at least 6 characters');

export const usernameSchema = z
  .string()
  .min(1, 'Username is required')
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

// Sign In Schema
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Sign Up Schema - more strict password requirements
export const signUpSchema = z.object({
  email: emailSchema.superRefine((email, ctx) => {
    const suggestion = emailDomainSuggestion(email);
    if (suggestion)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Please check your email domain. Did you mean ${suggestion}?`,
      });
  }),
  username: usernameSchema,
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// Password change schema (for Settings)
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Profile update schema
export const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100),
  username: usernameSchema.optional(),
  target_band_score: z.number().min(1).max(9).optional(),
});

/**
 * Helper to validate a single field
 * @param schema - Zod schema to validate against
 * @param value - Value to validate
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateField(
  schema: z.ZodSchema,
  value: any
): { valid: boolean; error: string | null } {
  const result = schema.safeParse(value);
  if (result.success) {
    return { valid: true, error: null };
  }
  return { valid: false, error: result.error.errors[0]?.message || 'Invalid value' };
}

/**
 * Password strength calculator
 * @param password
 * @returns {{ score: number, label: string, color: string }}
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
  ];

  return {
    score: Math.min(score, 5),
    label: labels[Math.min(score, 5)],
    color: colors[Math.min(score, 5)],
  };
}
