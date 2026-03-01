import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Card } from '../../src/texas-holdem/deck.js';
import {
  handToCanonical,
  getSklanskyGroup,
  getMaxGroupForPosition,
  getRaiseMaxGroupForPosition,
  isHandInPositionRange,
  sklanskyGroupToOneHot,
} from '../../src/texas-holdem/sklansky.js';
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

describe('sklansky', () => {
  describe('handToCanonical', () => {
    it('returns high card first for non-pair', () => {
      assert.strictEqual(
        handToCanonical(hand(CardValue.Ace, Suite.Hearts, CardValue.King, Suite.Hearts)),
        'AKs'
      );
      assert.strictEqual(
        handToCanonical(hand(CardValue.Three, Suite.Clubs, CardValue.Seven, Suite.Diamonds)),
        '73o'
      );
    });

    it('returns pair as two chars', () => {
      assert.strictEqual(
        handToCanonical(hand(CardValue.Ten, Suite.Hearts, CardValue.Ten, Suite.Spades)),
        'TT'
      );
    });
  });

  describe('getSklanskyGroup', () => {
    it('returns 1 for AA and KK', () => {
      const aa = hand(CardValue.Ace, Suite.Hearts, CardValue.Ace, Suite.Spades);
      const kk = hand(CardValue.King, Suite.Clubs, CardValue.King, Suite.Diamonds);
      assert.strictEqual(getSklanskyGroup(aa), 1);
      assert.strictEqual(getSklanskyGroup(kk), 1);
    });

    it('returns 2 for QQ, AKs, JJ', () => {
      assert.strictEqual(getSklanskyGroup(hand(CardValue.Queen, Suite.Hearts, CardValue.Queen, Suite.Clubs)), 2);
      assert.strictEqual(getSklanskyGroup(hand(CardValue.Ace, Suite.Hearts, CardValue.King, Suite.Hearts)), 2);
      assert.strictEqual(getSklanskyGroup(hand(CardValue.Jack, Suite.Spades, CardValue.Jack, Suite.Diamonds)), 2);
    });

    it('returns 4 for 88 and 77', () => {
      assert.strictEqual(getSklanskyGroup(hand(CardValue.Eight, Suite.Hearts, CardValue.Eight, Suite.Clubs)), 4);
      assert.strictEqual(getSklanskyGroup(hand(CardValue.Seven, Suite.Diamonds, CardValue.Seven, Suite.Spades)), 4);
    });

    it('returns 8 for unknown or weak hands', () => {
      const k9s = hand(CardValue.King, Suite.Hearts, CardValue.Nine, Suite.Hearts);
      assert.strictEqual(getSklanskyGroup(k9s), 8);
    });
  });

  describe('getMaxGroupForPosition', () => {
    it('returns 3 for UTG (early)', () => {
      assert.strictEqual(getMaxGroupForPosition('UTG'), 3);
    });
    it('returns 4 for UTG+1 and UTG+2 (play 88)', () => {
      assert.strictEqual(getMaxGroupForPosition('UTG+1'), 4);
      assert.strictEqual(getMaxGroupForPosition('UTG+2'), 4);
    });
    it('returns 5 for MP', () => {
      assert.strictEqual(getMaxGroupForPosition('MP'), 5);
    });
    it('returns 7 for CO and BTN', () => {
      assert.strictEqual(getMaxGroupForPosition('CO'), 7);
      assert.strictEqual(getMaxGroupForPosition('BTN'), 7);
    });
    it('returns 8 for SB and BB', () => {
      assert.strictEqual(getMaxGroupForPosition('SB'), 8);
      assert.strictEqual(getMaxGroupForPosition('BB'), 8);
    });
  });

  describe('isHandInPositionRange', () => {
    it('AA is in range for UTG', () => {
      const aa = hand(CardValue.Ace, Suite.Hearts, CardValue.Ace, Suite.Spades);
      assert.strictEqual(isHandInPositionRange(aa, 'UTG'), true);
    });
    it('group 8 hand is not in range for UTG', () => {
      const k9s = hand(CardValue.King, Suite.Hearts, CardValue.Nine, Suite.Hearts);
      assert.strictEqual(isHandInPositionRange(k9s, 'UTG'), false);
    });
  });

  describe('sklanskyGroupToOneHot', () => {
    it('returns length 8 with 1 at index group-1', () => {
      const vec = sklanskyGroupToOneHot(3);
      assert.strictEqual(vec.length, 8);
      assert.strictEqual(vec[2], 1);
      vec.forEach((v, i) => {
        if (i !== 2) assert.strictEqual(v, 0);
      });
    });
  });

  describe('getRaiseMaxGroupForPosition', () => {
    it('UTG+1 can raise with groups 1-4', () => {
      assert.strictEqual(getRaiseMaxGroupForPosition('UTG+1'), 4);
    });
  });
});
