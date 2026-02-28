import { createApp } from './app.js';
import type { Application } from 'express';

export function createServer(port: number): { app: Application; listen: () => Promise<void> } {
  const app = createApp();
  return {
    app,
    listen: () =>
      new Promise((resolve) => {
        app.listen(port, () => {
          console.log(`Server listening on http://localhost:${port}`);
          resolve();
        });
      }),
  };
}
