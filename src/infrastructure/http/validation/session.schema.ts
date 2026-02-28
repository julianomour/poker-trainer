import { z } from 'zod';

export const createSessionSchema = z.object({
  handsPlayed: z.number().int().min(0),
});

export type CreateSessionBody = z.infer<typeof createSessionSchema>;
