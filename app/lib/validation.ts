import { z } from 'zod';

// 8+ chars with at least one uppercase, one lowercase, and one number.
export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long.' })
  .regex(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter.',
  })
  .regex(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter.',
  })
  .regex(/[0-9]/, { message: 'Password must contain at least one number.' });

export const emailSchema = z
  .string()
  .min(1, { message: 'Email is required.' })
  .email({ message: 'Please enter a valid email address.' });

export const SignUpFormSchema = z
  .object({
    name: z.string().trim().min(1, { message: 'Name is required.' }),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: 'Please confirm your password.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const ForgotPasswordFormSchema = z.object({
  email: emailSchema,
});

export const ResetPasswordFormSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: 'Please confirm your password.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });
