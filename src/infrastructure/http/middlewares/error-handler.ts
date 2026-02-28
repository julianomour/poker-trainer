import type { Request, Response, NextFunction } from 'express';
import { DomainError, NotFoundError, ValidationError } from '../../../domain/errors.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof NotFoundError) {
    res.status(404).json({ code: err.code, message: err.message });
    return;
  }
  if (err instanceof ValidationError) {
    res.status(400).json({ code: err.code, message: err.message });
    return;
  }
  if (err instanceof DomainError) {
    res.status(422).json({ code: err.code, message: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
}
