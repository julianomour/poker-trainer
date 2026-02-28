import * as tf from '@tensorflow/tfjs';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomHand } from './texas-holdem/deck.js';
import { TexasHoldem } from './texas-holdem/rules.js';
import type { HandStrengthCategory } from './texas-holdem/rules.js';
import { TensorFlowPatterns } from './tensorflow-patterns.js';
import type { PokerHand } from './texas-holdem/deck.js';

const INPUT_DIM = TensorFlowPatterns.ONE_HOT_FEATURE_LENGTH; // 34
const NUM_CLASSES = TexasHoldem.hand_strength.length; // 6

/** Caminho padrão para o arquivo de pesos (na raiz do projeto). */
export const DEFAULT_WEIGHTS_PATH = join(process.cwd(), 'model-weights.json');

/**
 * Cria o modelo para classificação da força da mão (6 categorias).
 * Entrada: vetor one-hot da mão (34 dims). Saída: softmax sobre as 6 categorias.
 */
export function createModel(): tf.Sequential {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      inputShape: [INPUT_DIM],
      units: 64,
      activation: 'relu',
    })
  );
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(
    tf.layers.dense({
      units: NUM_CLASSES,
      activation: 'softmax',
    })
  );
  model.compile({
    optimizer: 'adam',
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });
  return model;
}

/**
 * Gera dados de treino: N mãos aleatórias com features (X) e labels one-hot (y).
 */
function generateTrainingData(nSamples: number): {
  X: number[][];
  y: number[][];
} {
  const encoder = new TensorFlowPatterns();
  const hands: PokerHand[] = [];
  for (let i = 0; i < nSamples; i++) {
    hands.push(randomHand());
  }
  const X = encoder.handsToBatch(hands, true);
  const y = hands.map((hand) => {
    const category = TexasHoldem.classifyHand(hand);
    return TexasHoldem.handStrengthToOneHot({
      ...hand,
      hand_strength: category,
    });
  });
  return { X, y };
}

export interface TrainOptions {
  /** Número de mãos geradas para treino */
  samples?: number;
  /** Épocas de treino */
  epochs?: number;
  /** Fração dos dados para validação (0–1) */
  validationSplit?: number;
}

const DEFAULT_OPTIONS: Required<TrainOptions> = {
  samples: 30_000,
  epochs: 20,
  validationSplit: 0.2,
};

/**
 * Treina o modelo para prever a força da mão a partir do vetor one-hot da mão.
 * Retorna o modelo treinado e o histórico.
 */
export async function trainHandStrengthModel(
  options: TrainOptions = {}
): Promise<{ model: tf.Sequential; history: tf.History }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const model = createModel();

  console.log('Gerando dados de treino...');
  const { X, y } = generateTrainingData(opts.samples);

  const XTensor = tf.tensor2d(X);
  const yTensor = tf.tensor2d(y);

  console.log(
    `Treinando: ${opts.samples} amostras, ${opts.epochs} épocas, validação ${(opts.validationSplit * 100).toFixed(0)}%`
  );
  const history = await model.fit(XTensor, yTensor, {
    epochs: opts.epochs,
    validationSplit: opts.validationSplit,
    callbacks: {
      onEpochEnd: (epoch: number, logs?: Record<string, number>) => {
        if (logs != null && typeof logs === 'object') {
          console.log(
            `Época ${epoch + 1}/${opts.epochs} — loss: ${logs.loss?.toFixed(4) ?? '-'} — acc: ${logs.acc?.toFixed(4) ?? '-'} — val_acc: ${logs.val_acc?.toFixed(4) ?? '-'}`
          );
        }
      },
    },
  });

  tf.dispose([XTensor, yTensor]);
  return { model, history };
}

/** Formato do arquivo de pesos (um array por camada). */
interface SavedWeights {
  weights: { shape: number[]; data: number[] }[];
}

/**
 * Salva os pesos do modelo em JSON (para recriação com createModel + setWeights).
 */
export function saveModelWeights(
  model: tf.Sequential,
  filePath: string = DEFAULT_WEIGHTS_PATH
): void {
  const weights = model.getWeights();
  const saved: SavedWeights = {
    weights: weights.map((t) => ({
      shape: t.shape as number[],
      data: Array.from(t.dataSync()),
    })),
  };
  writeFileSync(filePath, JSON.stringify(saved), 'utf-8');
  weights.forEach((t) => t.dispose());
}

/**
 * Carrega os pesos de um arquivo JSON e retorna o modelo (mesma arquitetura que createModel).
 * Retorna null se o arquivo não existir ou estiver corrompido.
 */
export function loadModelWeights(
  filePath: string = DEFAULT_WEIGHTS_PATH
): tf.Sequential | null {
  if (!existsSync(filePath)) return null;
  const raw = readFileSync(filePath, 'utf-8');
  let saved: SavedWeights;
  try {
    saved = JSON.parse(raw) as SavedWeights;
  } catch (err) {
    throw new Error(
      `Invalid model-weights.json: ${err instanceof Error ? err.message : String(err)}`,
      {
        cause: err,
      }
    );
  }
  const model = createModel();
  const tensors = saved.weights.map((w) => tf.tensor(w.data, w.shape));
  model.setWeights(tensors);
  tensors.forEach((t) => t.dispose());
  return model;
}

const encoder = new TensorFlowPatterns();

/**
 * Classifica a força da mão usando o modelo treinado.
 * Retorna a categoria [tipo, nível] no mesmo formato das regras.
 */
export function predictHandStrength(
  model: tf.Sequential,
  hand: PokerHand
): HandStrengthCategory {
  const vec = encoder.handToFeatureVectorOneHot(hand);
  const input = tf.tensor2d([vec]);
  const out = model.predict(input) as tf.Tensor;
  const probs = Array.from(out.dataSync());
  input.dispose();
  out.dispose();
  let maxIdx = 0;
  for (let i = 1; i < probs.length; i++) {
    if (probs[i] > probs[maxIdx]) maxIdx = i;
  }
  const [type, level] = TexasHoldem.hand_strength[maxIdx];
  return [type, level];
}
