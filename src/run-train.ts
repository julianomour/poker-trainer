import {
  trainHandStrengthModel,
  saveModelWeights,
  DEFAULT_WEIGHTS_PATH,
} from './train-hand-strength.js';
import type { TrainOptions } from './train-hand-strength.js';

const DEFAULT_SAMPLES = 30_000;
const DEFAULT_EPOCHS = 20;
const DEFAULT_VALIDATION_SPLIT = 0.2;

function parseEnvInt(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return defaultValue;
  const n = parseInt(raw, 10);
  if (!Number.isInteger(n) || n < 1) return defaultValue;
  return n;
}

function parseEnvFloat(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return defaultValue;
  const n = parseFloat(raw);
  if (!Number.isFinite(n) || n <= 0 || n >= 1) return defaultValue;
  return n;
}

function parseArgv(): Partial<TrainOptions> {
  const opts: Partial<TrainOptions> = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--samples' && next !== undefined) {
      const n = parseInt(next, 10);
      if (Number.isInteger(n) && n > 0) opts.samples = n;
      i++;
    } else if (arg === '--epochs' && next !== undefined) {
      const n = parseInt(next, 10);
      if (Number.isInteger(n) && n > 0) opts.epochs = n;
      i++;
    } else if (
      (arg === '--validation-split' || arg === '--validationSplit') &&
      next !== undefined
    ) {
      const n = parseFloat(next);
      if (Number.isFinite(n) && n > 0 && n < 1) opts.validationSplit = n;
      i++;
    }
  }
  return opts;
}

async function main(): Promise<void> {
  const envOptions: TrainOptions = {
    samples: parseEnvInt('TRAIN_SAMPLES', DEFAULT_SAMPLES),
    epochs: parseEnvInt('TRAIN_EPOCHS', DEFAULT_EPOCHS),
    validationSplit: parseEnvFloat(
      'TRAIN_VALIDATION_SPLIT',
      DEFAULT_VALIDATION_SPLIT
    ),
  };
  const cliOptions = parseArgv();
  const options: TrainOptions = { ...envOptions, ...cliOptions };

  const { model } = await trainHandStrengthModel(options);
  console.log('Treino concluído.');
  model.summary();
  saveModelWeights(model, DEFAULT_WEIGHTS_PATH);
  console.log(`Pesos salvos em ${DEFAULT_WEIGHTS_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
