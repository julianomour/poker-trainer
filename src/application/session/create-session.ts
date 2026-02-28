import type { TrainingSession } from '../../domain/session/index.js';
import { createSession } from '../../domain/session/index.js';
import { ValidationError } from '../../domain/errors.js';

export interface CreateSessionInput {
  handsPlayed: number;
}

export function createTrainingSession(input: CreateSessionInput): TrainingSession {
  if (input.handsPlayed < 0) {
    throw new ValidationError('handsPlayed deve ser não negativo');
  }
  const id = crypto.randomUUID();
  return createSession(id, input.handsPlayed);
}
