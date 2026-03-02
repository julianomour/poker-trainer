import { TensorFlowPatterns } from './tensorflow-patterns.js';
import type { PokerHand } from './texas-holdem/deck.js';
import { Table } from './texas-holdem/table.js';

export type DecisionActionCategory = 'fold' | 'call' | 'raise';

export type PreviousActionCategory =
  | 'none'
  | 'limp'
  | 'raise'
  | 'threeBetOrMore';

export type TournamentType = 'vanilla' | 'pko';

export type HeroCoverage =
  | 'coversVillain'
  | 'coveredByVillain'
  | 'similarStack';

export interface DecisionContext {
  position: string;
  previousAction: PreviousActionCategory;
  previousPosition?: string;
  effectiveStackBb: number;
  tournamentType: TournamentType;
  isRpLow: boolean;
  areLeftPlayersPassive: boolean;
  heroCoverage: HeroCoverage;
}

/**
 * Layout do vetor de features para o modelo de decisão (fold/call/raise).
 *
 * Ordem dos campos:
 * - [0..33]   mão (one-hot)                     34 dims
 * - [34..42]  posição do herói                  9 dims (Table.positions)
 * - [43..46]  categoria da ação anterior        4 dims (none/limp/raise/threeBetOrMore)
 * - [47..55]  posição do vilão anterior         9 dims (Table.positions, ou tudo 0 se previousAction = 'none')
 * - [56..59]  bucket de stack efetivo em BB     4 dims (<20, 20–30, 30–50, >50)
 * - [60..61]  tipo de torneio                   2 dims (vanilla/pko)
 * - [62]      flag RP baixo                     1 dim  (0/1)
 * - [63]      vilões passivos à esquerda        1 dim  (0/1)
 * - [64..66]  relacionamento de cobertura       3 dims (covers/covered/similar)
 *
 * Total: 67 dimensões.
 */
export const DECISION_FEATURE_DIM = 67;

const encoder = new TensorFlowPatterns();

function oneHotFromList(list: string[], value: string | undefined): number[] {
  const vec = new Array<number>(list.length).fill(0);
  if (value == null) return vec;
  const idx = list.indexOf(value);
  if (idx >= 0) vec[idx] = 1;
  return vec;
}

function oneHotFromEnum<T extends string>(
  values: readonly T[],
  value: T
): number[] {
  const vec = new Array<number>(values.length).fill(0);
  const idx = values.indexOf(value);
  if (idx >= 0) vec[idx] = 1;
  return vec;
}

const PREVIOUS_ACTION_VALUES: readonly PreviousActionCategory[] = [
  'none',
  'limp',
  'raise',
  'threeBetOrMore',
];

const TOURNAMENT_TYPE_VALUES: readonly TournamentType[] = [
  'vanilla',
  'pko',
];

const HERO_COVERAGE_VALUES: readonly HeroCoverage[] = [
  'coversVillain',
  'coveredByVillain',
  'similarStack',
];

function stackBucketOneHot(effectiveStackBb: number): number[] {
  const vec = new Array<number>(4).fill(0);
  let bucket = 0;
  if (effectiveStackBb < 20) {
    bucket = 0;
  } else if (effectiveStackBb < 30) {
    bucket = 1;
  } else if (effectiveStackBb < 50) {
    bucket = 2;
  } else {
    bucket = 3;
  }
  vec[bucket] = 1;
  return vec;
}

export function handAndContextToDecisionFeatures(
  hand: PokerHand,
  context: DecisionContext
): number[] {
  const handVec = encoder.handToFeatureVectorOneHot(hand);

  const heroPositionOneHot = oneHotFromList(Table.positions, context.position);

  const previousActionOneHot = oneHotFromEnum(
    PREVIOUS_ACTION_VALUES,
    context.previousAction
  );

  const previousPositionOneHot =
    context.previousAction === 'none'
      ? new Array<number>(Table.positions.length).fill(0)
      : oneHotFromList(Table.positions, context.previousPosition);

  const stackOneHot = stackBucketOneHot(context.effectiveStackBb);

  const tournamentTypeOneHot = oneHotFromEnum(
    TOURNAMENT_TYPE_VALUES,
    context.tournamentType
  );

  const rpLowFlag = [context.isRpLow ? 1 : 0];
  const passiveLeftFlag = [context.areLeftPlayersPassive ? 1 : 0];

  const heroCoverageOneHot = oneHotFromEnum(
    HERO_COVERAGE_VALUES,
    context.heroCoverage
  );

  const features: number[] = [
    ...handVec,
    ...heroPositionOneHot,
    ...previousActionOneHot,
    ...previousPositionOneHot,
    ...stackOneHot,
    ...tournamentTypeOneHot,
    ...rpLowFlag,
    ...passiveLeftFlag,
    ...heroCoverageOneHot,
  ];

  if (features.length !== DECISION_FEATURE_DIM) {
    throw new Error(
      `handAndContextToDecisionFeatures: expected length ${DECISION_FEATURE_DIM}, got ${features.length}`
    );
  }

  return features;
}

