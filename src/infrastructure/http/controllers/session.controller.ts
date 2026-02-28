import type { Request, Response, NextFunction } from 'express';
import { createTrainingSession } from '../../../application/session/create-session.js';
import { createSessionSchema } from '../validation/session.schema.js';
import type { CreateSessionBody } from '../validation/session.schema.js';

export function createSessionController(req: Request, res: Response, next: NextFunction): void {
  const parsed = createSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: parsed.error.flatten().fieldErrors });
    return;
  }
  const body: CreateSessionBody = parsed.data;
  try {
    const session = createTrainingSession({ handsPlayed: body.handsPlayed });
    res.status(201).json({
      id: session.id,
      createdAt: session.createdAt.toISOString(),
      handsPlayed: session.handsPlayed,
    });
  } catch (err) {
    next(err);
  }
}
