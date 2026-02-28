import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  createModel,
  predictHandStrength,
} from '../../src/train-hand-strength.js';
import { Card } from '../../src/texas-holdem/deck.js';
import { TexasHoldem } from '../../src/texas-holdem/rules.js';
import { CardValue, Suite } from '../../src/interfaces.js';

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

describe('train-hand-strength', () => {
  describe('createModel', () => {
    it('has input shape [null, 34] and output 6 units (softmax)', () => {
      const model = createModel();
      const layers = model.layers;
      assert.ok(layers.length >= 1);
      const inputLayer = layers[0];
      const inputShape = inputLayer.batchInputShape;
      assert.ok(Array.isArray(inputShape));
      assert.strictEqual(inputShape[inputShape.length - 1], 34);
      const outputLayer = layers[layers.length - 1];
      const config = outputLayer.getConfig();
      assert.strictEqual((config as { units?: number }).units, 6);
      assert.strictEqual(
        (config as { activation?: string }).activation,
        'softmax'
      );
    });
  });

  describe('predictHandStrength', () => {
    it('returns a category tuple contained in hand_strength', () => {
      const model = createModel();
      const h = hand(CardValue.Ace, Suite.Hearts, CardValue.King, Suite.Hearts);
      const result = predictHandStrength(model, h);
      assert.strictEqual(result.length, 2);
      const [type, level] = result;
      const found = TexasHoldem.hand_strength.some(
        (row) => row[0] === type && row[1] === level
      );
      assert.ok(found, `expected [${type}, ${level}] to be in hand_strength`);
    });
  });
});
