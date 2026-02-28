import type { Request, Response } from 'express';
import { getHealth } from '../../../application/health/get-health.js';

export function healthController(_req: Request, res: Response): void {
  const status = getHealth();
  res.json(status);
}
