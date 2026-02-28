import { config } from './config/index.js';
import { createServer } from './infrastructure/http/server.js';

async function main(): Promise<void> {
  const { listen } = createServer(config.port);
  await listen();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
