import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Card } from '../../src/texas-holdem/deck.js';
import {
  isHandInRange,
  isHandInOpenRange,
  isHandInRaiseRange,
  isHandInOpenRaiseRange,
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

  describe('isHandInOpenRaiseRange', () => {
    it('UTG–HJ: 44+ raise, 33 não', () => {
      const pair44 = hand(CardValue.Four, Suite.Clubs, CardValue.Four, Suite.Diamonds);
      const pair33 = hand(CardValue.Three, Suite.Hearts, CardValue.Three, Suite.Spades);
      assert.strictEqual(isHandInOpenRaiseRange(pair44, 'UTG'), true);
      assert.strictEqual(isHandInOpenRaiseRange(pair33, 'UTG'), false);
    });
    it('UTG–HJ: A suited e ATo+ raise', () => {
      const a2s = hand(CardValue.Ace, Suite.Hearts, CardValue.Two, Suite.Hearts);
      const ato = hand(CardValue.Ace, Suite.Clubs, CardValue.Ten, Suite.Diamonds);
      assert.strictEqual(isHandInOpenRaiseRange(a2s, 'MP'), true);
      assert.strictEqual(isHandInOpenRaiseRange(ato, 'HJ'), true);
    });
    it('UTG–HJ: 87s+ raise, 76o não', () => {
      const s87 = hand(CardValue.Eight, Suite.Spades, CardValue.Seven, Suite.Spades);
      const o76 = hand(CardValue.Seven, Suite.Clubs, CardValue.Six, Suite.Diamonds);
      assert.strictEqual(isHandInOpenRaiseRange(s87, 'UTG'), true);
      assert.strictEqual(isHandInOpenRaiseRange(o76, 'UTG'), false);
    });
    it('CO–BB: todos pares e K9o+ raise', () => {
      const pair22 = hand(CardValue.Two, Suite.Clubs, CardValue.Two, Suite.Hearts);
      const k9 = hand(CardValue.King, Suite.Diamonds, CardValue.Nine, Suite.Clubs);
      assert.strictEqual(isHandInOpenRaiseRange(pair22, 'CO'), true);
      assert.strictEqual(isHandInOpenRaiseRange(k9, 'BTN'), true);
    });
    it('CO–BB: Q6s+ raise', () => {
      const q6s = hand(CardValue.Queen, Suite.Hearts, CardValue.Six, Suite.Hearts);
      assert.strictEqual(isHandInOpenRaiseRange(q6s, 'CO'), true);
    });
  });
});
