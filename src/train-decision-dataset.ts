import { randomHand } from './texas-holdem/deck.js';
import { Table } from './texas-holdem/table.js';
import { getSklanskyGroup } from './texas-holdem/sklansky.js';
import {
  getActionByGroupWithContext,
  type Action as PreflopAction,
  type ActionContext,
} from './texas-holdem/action.js';
import {
  handAndContextToDecisionFeatures,
  type DecisionActionCategory,
  type DecisionContext,
  type PreviousActionCategory,
  type TournamentType,
  type HeroCoverage,
} from './decision-features.js';
import type { PokerHand } from './texas-holdem/deck.js';

export interface DecisionTrainingData {
  X: number[][];
  y: number[][];
}

type ScenarioType = 'openRfi' | 'vsRaise' | 'vsFold' | 'blindWar';

function sampleScenario(): ScenarioType {
  const r = Math.random();
  if (r < 0.45) return 'openRfi';
  if (r < 0.70) return 'vsRaise';
  if (r < 0.85) return 'vsFold';
  return 'blindWar';
}

function sampleEffectiveStackBb(): number {
  const buckets = [15, 25, 35, 60];
  const idx = Math.floor(Math.random() * buckets.length);
  return buckets[idx];
}

function sampleTournamentType(): TournamentType {
  return Math.random() < 0.35 ? 'vanilla' : 'pko';
}

function sampleHeroCoverage(): HeroCoverage {
  const r = Math.random();
  if (r < 0.33) return 'coversVillain';
  if (r < 0.66) return 'coveredByVillain';
  return 'similarStack';
}

function actionToOneHot(action: DecisionActionCategory): number[] {
  if (action === 'fold') return [1, 0, 0];
  if (action === 'call') return [0, 1, 0];
  return [0, 0, 1];
}

function buildDecisionContextAndLabel(
  hand: PokerHand,
  scenario: ScenarioType
): { context: DecisionContext; label: DecisionActionCategory } {
  const positions = Table.positions;
  const preflopOrder = Table.preflopActionOrder;

  const effectiveStackBb = sampleEffectiveStackBb();
  const tournamentType = sampleTournamentType();
  const isRpLow = true;
  const areLeftPlayersPassive = Math.random() < 0.2;
  const heroCoverage = sampleHeroCoverage();

  let position: string;
  let previousActionCategory: PreviousActionCategory;
  let previousPosition: string | undefined;
  let lastActionForRules: PreflopAction | undefined;
  let lastPositionForRules: string | undefined;
  let actionContextForRules: ActionContext | undefined;

  if (scenario === 'openRfi') {
    const idx = Math.floor(Math.random() * positions.length);
    position = positions[idx];
    previousActionCategory = 'none';
  } else if (scenario === 'vsRaise') {
    const villainIdx = Math.floor(Math.random() * preflopOrder.length);
    const heroIdx =
      villainIdx + 1 + Math.floor(Math.random() * (preflopOrder.length - villainIdx - 1));
    position = preflopOrder[heroIdx];
    previousPosition = preflopOrder[villainIdx];
    previousActionCategory = 'raise';
    lastActionForRules = 'raise';
    lastPositionForRules = previousPosition;
    actionContextForRules = {
      isSimpleRaise: true,
      isHeadsUp: false,
    };
  } else if (scenario === 'vsFold') {
    // Vilão anterior foldou; herói decide como se fosse abertura (ninguém raiseou).
    const villainIdx = Math.floor(Math.random() * (preflopOrder.length - 1));
    const heroIdx = villainIdx + 1;
    position = preflopOrder[heroIdx];
    previousPosition = preflopOrder[villainIdx];
    previousActionCategory = 'fold';
    lastActionForRules = 'fold';
    lastPositionForRules = previousPosition;
  } else {
    const sbOrBb = Math.random() < 0.5 ? 'SB' : 'BB';
    position = sbOrBb;
    if (position === 'SB') {
      previousActionCategory = 'none';
    } else {
      // BB vs SB: metade das vezes vs limp (tratado como previousAction 'call'), metade vs raise.
      if (Math.random() < 0.5) {
        previousActionCategory = 'limp';
        previousPosition = 'SB';
        lastActionForRules = 'call';
        lastPositionForRules = 'SB';
      } else {
        previousActionCategory = 'raise';
        previousPosition = 'SB';
        lastActionForRules = 'raise';
        lastPositionForRules = 'SB';
        actionContextForRules = {
          isSimpleRaise: true,
          isHeadsUp: true,
        };
      }
    }
  }

  const group = getSklanskyGroup(hand);

  const rulesAction: PreflopAction = getActionByGroupWithContext(
    group,
    position,
    lastActionForRules,
    lastPositionForRules,
    actionContextForRules,
    hand
  );

  let label = rulesAction as DecisionActionCategory;

  // Adaptação: apenas o SB pode ter call como ação de treino.
  // Para outras posições, se a regra sugerir call, tratamos como raise
  if (position !== 'SB' && label === 'call') {
    label = 'raise';
  }

  const context: DecisionContext = {
    position,
    previousAction: previousActionCategory,
    previousPosition,
    effectiveStackBb,
    tournamentType,
    isRpLow,
    areLeftPlayersPassive,
    heroCoverage,
  };

  return { context, label };
}

export function generateDecisionTrainingData(
  nSamples: number
): DecisionTrainingData {
  const X: number[][] = [];
  const y: number[][] = [];

  for (let i = 0; i < nSamples; i++) {
    const hand = randomHand();
    const scenario = sampleScenario();
    const { context, label } = buildDecisionContextAndLabel(hand, scenario);
    const features = handAndContextToDecisionFeatures(hand, context);
    X.push(features);
    y.push(actionToOneHot(label));
  }

  return { X, y };
}

