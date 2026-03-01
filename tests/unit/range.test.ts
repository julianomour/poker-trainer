import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Card } from '../../src/texas-holdem/deck.js';
import {
  isHandInRange,
  isHandInOpenRange,
  isHandInRaiseRange,
} from '../../src/texas-holdem/range.js';
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

describe('range', () => {
  describe('isHandInRange', () => {
    it('returns true when hand satisfies predicate', () => {
      const h = hand(CardValue.Ace, Suite.Hearts, CardValue.King, Suite.Hearts);
      const range = (hand: { first: Card; second: Card }) =>
        hand.first.value === CardValue.Ace;
      assert.strictEqual(isHandInRange(h, range), true);
    });

    it('returns false when hand does not satisfy predicate', () => {
      const h = hand(CardValue.Two, Suite.Clubs, CardValue.Three, Suite.Diamonds);
      const range = (hand: { first: Card; second: Card }) =>
        hand.first.value === CardValue.Ace;
      assert.strictEqual(isHandInRange(h, range), false);
    });
  });

  describe('getOpenRange', () => {
    it('excludes weak hands in early position (UTG)', () => {
      const weak = hand(CardValue.Three, Suite.Hearts, CardValue.Seven, Suite.Clubs);
      assert.strictEqual(isHandInOpenRange(weak, 'UTG'), false);
    });

    it('includes strong hands in early position (UTG)', () => {
      const strong = hand(CardValue.Ace, Suite.Spades, CardValue.King, Suite.Diamonds);
      assert.strictEqual(isHandInOpenRange(strong, 'UTG'), true);
    });

    it('includes weak hands in late position (BTN)', () => {
      const weak = hand(CardValue.Seven, Suite.Hearts, CardValue.Two, Suite.Clubs);
      assert.strictEqual(isHandInOpenRange(weak, 'BTN'), true);
    });
  });

  describe('getRangeForAction', () => {
    it('raise range includes pair strong (88+)', () => {
      const pairStrong = hand(CardValue.Eight, Suite.Clubs, CardValue.Eight, Suite.Diamonds);
      assert.strictEqual(isHandInRaiseRange(pairStrong, 'UTG'), true);
    });

    it('raise range excludes pair weak', () => {
      const pairWeak = hand(CardValue.Seven, Suite.Hearts, CardValue.Seven, Suite.Spades);
      assert.strictEqual(isHandInRaiseRange(pairWeak, 'BTN'), false);
    });
  });
});
