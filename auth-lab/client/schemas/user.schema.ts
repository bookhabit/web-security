import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  points: z.number(),
  role: z.string().optional(),
  isWithdrawn: z.boolean().optional(),
});

export type UserProfile = z.infer<typeof userSchema>;
