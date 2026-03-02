import * as tf from '@tensorflow/tfjs';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { PokerHand } from './texas-holdem/deck.js';
import {
  DECISION_FEATURE_DIM,
  handAndContextToDecisionFeatures,
  type DecisionActionCategory,
  type DecisionContext,
} from './decision-features.js';
import {
  generateDecisionTrainingData,
  type DecisionTrainingData,
} from './train-decision-dataset.js';

const NUM_DECISION_CLASSES = 3;

/** Caminho padrão para o arquivo de pesos do modelo de decisão (na raiz do projeto). */
export const DEFAULT_DECISION_WEIGHTS_PATH = join(
  process.cwd(),
  'decision-model-weights.json'
);

/**
 * Cria o modelo para decisão pré-flop (fold/call/raise).
 * Entrada: vetor de features DECISION_FEATURE_DIM. Saída: softmax em 3 ações.
 */
export function createDecisionModel(): tf.Sequential {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      inputShape: [DECISION_FEATURE_DIM],
      units: 64,
      activation: 'relu',
    })
  );
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(
    tf.layers.dense({
      units: NUM_DECISION_CLASSES,
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

export interface DecisionTrainOptions {
  samples?: number;
  epochs?: number;
  validationSplit?: number;
}

const DEFAULT_DECISION_OPTIONS: Required<DecisionTrainOptions> = {
  samples: 50_000,
  epochs: 20,
  validationSplit: 0.2,
};

/**
 * Gera dados e treina o modelo de decisão fold/call/raise.
 */
export async function trainDecisionModel(
  options: DecisionTrainOptions = {}
): Promise<{ model: tf.Sequential; history: tf.History; data: DecisionTrainingData }> {
  const opts = { ...DEFAULT_DECISION_OPTIONS, ...options };
  const model = createDecisionModel();

  console.log('Gerando dados de treino de decisão...');
  const data = generateDecisionTrainingData(opts.samples);

  const XTensor = tf.tensor2d(data.X);
  const yTensor = tf.tensor2d(data.y);

  console.log(
    `Treinando modelo de decisão: ${opts.samples} amostras, ${opts.epochs} épocas, validação ${(opts.validationSplit * 100).toFixed(0)}%`
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
  return { model, history, data };
}

/** Formato do arquivo de pesos do modelo de decisão. */
interface DecisionSavedWeights {
  weights: { shape: number[]; data: number[] }[];
}

/**
 * Salva os pesos do modelo de decisão em JSON (para recriação com createDecisionModel + setWeights).
 */
export function saveDecisionModelWeights(
  model: tf.Sequential,
  filePath: string = DEFAULT_DECISION_WEIGHTS_PATH
): void {
  const weights = model.getWeights();
  const saved: DecisionSavedWeights = {
    weights: weights.map((t) => ({
      shape: t.shape as number[],
      data: Array.from(t.dataSync()),
    })),
  };
  writeFileSync(filePath, JSON.stringify(saved), 'utf-8');
  weights.forEach((t) => t.dispose());
}

/**
 * Carrega os pesos do modelo de decisão de um arquivo JSON.
 * Retorna null se o arquivo não existir ou estiver corrompido.
 */
export function loadDecisionModelWeights(
  filePath: string = DEFAULT_DECISION_WEIGHTS_PATH
): tf.Sequential | null {
  if (!existsSync(filePath)) return null;
  const raw = readFileSync(filePath, 'utf-8');
  let saved: DecisionSavedWeights;
  try {
    saved = JSON.parse(raw) as DecisionSavedWeights;
  } catch (err) {
    throw new Error(
      `Invalid decision-model-weights.json: ${err instanceof Error ? err.message : String(err)}`,
      {
        cause: err,
      }
    );
  }
  const model = createDecisionModel();
  const tensors = saved.weights.map((w) => tf.tensor(w.data, w.shape));
  try {
    model.setWeights(tensors);
  } catch {
    tensors.forEach((t) => t.dispose());
    return null;
  }
  tensors.forEach((t) => t.dispose());
  return model;
}

/**
 * Prediz a ação (fold/call/raise) para uma mão + contexto usando o modelo de decisão treinado.
 */
export function predictDecisionAction(
  model: tf.Sequential,
  hand: PokerHand,
  context: DecisionContext
): DecisionActionCategory {
  const features = handAndContextToDecisionFeatures(hand, context);
  const input = tf.tensor2d([features]);
  const out = model.predict(input) as tf.Tensor;
  const probs = Array.from(out.dataSync());
  input.dispose();
  out.dispose();
  let maxIdx = 0;
  for (let i = 1; i < probs.length; i++) {
    if (probs[i] > probs[maxIdx]) maxIdx = i;
  }
  if (maxIdx === 0) return 'fold';
  if (maxIdx === 1) return 'call';
  return 'raise';
}

