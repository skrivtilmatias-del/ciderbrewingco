import { z } from 'zod';

/**
 * Validation schemas using Zod for all user inputs
 * Prevents injection attacks and ensures data integrity
 */

// Authentication schemas
export const signUpSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: 'Please enter a valid email address' })
    .max(255, { message: 'Email must be less than 255 characters' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' })
    .max(100, { message: 'Password must be less than 100 characters' }),
  fullName: z
    .string()
    .trim()
    .min(1, { message: 'Full name is required' })
    .max(100, { message: 'Full name must be less than 100 characters' }),
});

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: 'Please enter a valid email address' })
    .max(255, { message: 'Email must be less than 255 characters' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' })
    .max(100, { message: 'Password must be less than 100 characters' }),
});

// Batch schemas
export const batchSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Batch name is required' })
    .max(100, { message: 'Batch name must be less than 100 characters' }),
  variety: z
    .string()
    .trim()
    .min(1, { message: 'Apple variety is required' })
    .max(100, { message: 'Apple variety must be less than 100 characters' }),
  volume: z
    .number({ invalid_type_error: 'Volume must be a number' })
    .positive({ message: 'Volume must be greater than 0' })
    .max(100000, { message: 'Volume must be less than 100,000 liters' }),
  notes: z
    .string()
    .trim()
    .max(1000, { message: 'Notes must be less than 1000 characters' })
    .optional(),
});

// Batch log schemas
export const batchLogSchema = z.object({
  stage: z.string().min(1, { message: 'Stage is required' }),
  role: z.string().min(1, { message: 'Role is required' }),
  title: z
    .string()
    .trim()
    .max(200, { message: 'Title must be less than 200 characters' })
    .optional(),
  content: z
    .string()
    .trim()
    .max(5000, { message: 'Content must be less than 5000 characters' })
    .optional(),
  tags: z
    .array(z.string().trim().max(50))
    .max(20, { message: 'Maximum 20 tags allowed' })
    .optional(),
  og: z
    .number()
    .min(0.9)
    .max(1.2)
    .optional()
    .nullable(),
  fg: z
    .number()
    .min(0.9)
    .max(1.2)
    .optional()
    .nullable(),
  ph: z
    .number()
    .min(0)
    .max(14)
    .optional()
    .nullable(),
  ta_gpl: z
    .number()
    .min(0)
    .max(20)
    .optional()
    .nullable(),
  temp_c: z
    .number()
    .min(-10)
    .max(50)
    .optional()
    .nullable(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type BatchInput = z.infer<typeof batchSchema>;
export type BatchLogInput = z.infer<typeof batchLogSchema>;
