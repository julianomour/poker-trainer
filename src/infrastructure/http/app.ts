import express from 'express';
import { createRouter } from './routes/index.js';
import { errorHandler } from './middlewares/error-handler.js';

export function createApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use(createRouter());
  app.use(errorHandler);
  return app;
}
