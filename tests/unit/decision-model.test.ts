import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Card } from '../../src/texas-holdem/deck.js';
import { CardValue, Suite } from '../../src/interfaces.js';
import {
  DECISION_FEATURE_DIM,
  handAndContextToDecisionFeatures,
  type DecisionContext,
} from '../../src/decision-features.js';
import {
  createDecisionModel,
  predictDecisionAction,
} from '../../src/train-decision-model.js';

function hand(
  firstVal: CardValue,
  firstSuit: Suite,
  secondVal: CardValue,
  secondSuit: Suite
) {
  return {
    first: new Card(firstVal, firstSuit),
    second: new Card(secondVal, secondSuit),
  };
}

describe('decision-features and decision-model', () => {
  it('produces feature vectors with DECISION_FEATURE_DIM', () => {
    const h = hand(CardValue.Ace, Suite.Hearts, CardValue.King, Suite.Spades);
    const context: DecisionContext = {
      position: 'BTN',
      previousAction: 'none',
      previousPosition: undefined,
      effectiveStackBb: 40,
      tournamentType: 'vanilla',
      isRpLow: true,
      areLeftPlayersPassive: false,
      heroCoverage: 'similarStack',
    };
    const vec = handAndContextToDecisionFeatures(h, context);
    assert.strictEqual(vec.length, DECISION_FEATURE_DIM);
  });

  it('createDecisionModel has input shape [DECISION_FEATURE_DIM] and 3 outputs', () => {
    const model = createDecisionModel();
    const inputShape = model.inputs[0]?.shape;
    const outputShape = model.outputs[0]?.shape;
    assert.ok(inputShape, 'inputShape should be defined');
    assert.ok(outputShape, 'outputShape should be defined');
    assert.strictEqual(inputShape?.[1], DECISION_FEATURE_DIM);
    assert.strictEqual(outputShape?.[1], 3);
  });

  it('predictDecisionAction returns one of fold/call/raise', () => {
    const model = createDecisionModel();
    const h = hand(CardValue.Ace, Suite.Hearts, CardValue.King, Suite.Spades);
    const context: DecisionContext = {
      position: 'CO',
      previousAction: 'none',
      previousPosition: undefined,
      effectiveStackBb: 30,
      tournamentType: 'vanilla',
      isRpLow: true,
      areLeftPlayersPassive: false,
      heroCoverage: 'similarStack',
    };
    const action = predictDecisionAction(model, h, context);
    assert.ok(action === 'fold' || action === 'call' || action === 'raise');
  });
});

