import { Router } from 'express';
import { healthController } from '../controllers/health.controller.js';
import { createSessionController } from '../controllers/session.controller.js';

export function createRouter(): Router {
  const router = Router();
  router.get('/health', healthController);
  router.post('/sessions', createSessionController);
  return router;
}
