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
    .min(12, { message: 'Password must be at least 12 characters for security' })
    .max(128, { message: 'Password must be less than 128 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
  fullName: z
    .string()
    .trim()
    .min(1, { message: 'Full name is required' })
    .max(100, { message: 'Full name must be less than 100 characters' })
    .regex(/^[a-zA-Z\s'-]+$/, { message: 'Full name can only contain letters, spaces, hyphens, and apostrophes' }),
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
  apple_origin: z
    .string()
    .trim()
    .max(100, { message: 'Apple origin must be less than 100 characters' })
    .optional(),
  volume: z
    .number({ invalid_type_error: 'Volume must be a number' })
    .positive({ message: 'Volume must be greater than 0' })
    .max(100000, { message: 'Volume must be less than 100,000 liters' }),
  target_og: z
    .number()
    .min(0.9)
    .max(1.2)
    .optional(),
  target_fg: z
    .number()
    .min(0.9)
    .max(1.2)
    .optional(),
  target_ph: z
    .number()
    .min(0)
    .max(14)
    .optional(),
  target_end_ph: z
    .number()
    .min(0)
    .max(14)
    .optional(),
  yeast_type: z
    .string()
    .trim()
    .max(100, { message: 'Yeast type must be less than 100 characters' })
    .optional(),
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

// Tasting analysis schemas
export const tastingAnalysisSchema = z.object({
  blend_batch_id: z.string().optional(),
  competitor_brand: z.string().trim().min(1, { message: 'Competitor brand name is required' }).max(100).optional(),
  taste: z.string().trim().max(500, { message: 'Aroma notes must be less than 500 characters' }).optional(),
  colour: z.string().trim().max(500, { message: 'Appearance notes must be less than 500 characters' }).optional(),
  palate: z.string().trim().max(500, { message: 'Palate notes must be less than 500 characters' }).optional(),
  overall_score: z.coerce.number().min(0, { message: 'Score must be at least 0' }).max(100, { message: 'Score must be at most 100' }),
  notes: z.string().trim().max(1000, { message: 'Additional notes must be less than 1000 characters' }).optional(),
  attachments: z.array(z.string()).optional(),
  serving_temp: z.string().trim().max(50).optional(),
  glass_type: z.string().trim().max(100).optional(),
  tasting_date: z.coerce.date().optional(),
}).refine(
  (data) => data.blend_batch_id || data.competitor_brand,
  { message: "Either blend batch or competitor brand is required", path: ["blend_batch_id"] }
);

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type BatchInput = z.infer<typeof batchSchema>;
export type BatchLogInput = z.infer<typeof batchLogSchema>;
export type TastingAnalysisInput = z.infer<typeof tastingAnalysisSchema>;
