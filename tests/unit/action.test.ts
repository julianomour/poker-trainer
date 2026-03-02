import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Card } from '../../src/texas-holdem/deck.js';
import { getAction, getActionWithContext, getActionByGroup, getActionByGroupWithContext } from '../../src/texas-holdem/action.js';
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

describe('action', () => {
  describe('getAction', () => {
    it('returns fold for weak category in early position (UTG)', () => {
      assert.strictEqual(getAction(['off suited', 'weak'], 'UTG'), 'fold');
    });

    it('returns raise for strong category in any position', () => {
      assert.strictEqual(getAction(['pair', 'strong'], 'SB'), 'raise');
      assert.strictEqual(getAction(['suited', 'strong'], 'BTN'), 'raise');
    });

    it('returns call for weak category in late position (BTN)', () => {
      assert.strictEqual(getAction(['suited', 'weak'], 'BTN'), 'call');
    });

    it('returns call for weak category in middle position (MP)', () => {
      assert.strictEqual(getAction(['pair', 'weak'], 'MP'), 'call');
    });
  });

  describe('getActionByGroup', () => {
    it('folds when group exceeds max for position', () => {
      assert.strictEqual(getActionByGroup(8, 'UTG'), 'fold');
      assert.strictEqual(getActionByGroup(8, 'MP'), 'fold');
    });
    it('raises for groups 1-2', () => {
      assert.strictEqual(getActionByGroup(1, 'UTG'), 'raise');
      assert.strictEqual(getActionByGroup(2, 'BTN'), 'raise');
    });
    it('UTG+1 raises with group 4 (e.g. 88)', () => {
      assert.strictEqual(getActionByGroup(4, 'UTG+1'), 'raise');
    });
    it('calls for groups 3 up to max when above raise threshold', () => {
      assert.strictEqual(getActionByGroup(3, 'UTG'), 'call');
      assert.strictEqual(getActionByGroup(5, 'MP'), 'call');
    });
  });

  describe('getActionByGroupWithContext', () => {
    it('vs raise: raises with group 1-2, calls with 3-max', () => {
      assert.strictEqual(getActionByGroupWithContext(1, 'BTN', 'raise', 'UTG+1'), 'raise');
      assert.strictEqual(getActionByGroupWithContext(2, 'CO', 'raise', 'UTG'), 'raise');
      assert.strictEqual(getActionByGroupWithContext(4, 'BTN', 'raise', 'UTG+1'), 'call');
    });
    it('with no previous action uses same as getActionByGroup when hand not provided', () => {
      assert.strictEqual(getActionByGroupWithContext(4, 'UTG+1'), 'raise');
      assert.strictEqual(getActionByGroupWithContext(5, 'UTG'), 'call');
    });
    it('BB vs raise: desconto em raise simples (call até grupo 6)', () => {
      assert.strictEqual(getActionByGroupWithContext(5, 'BB', 'raise', 'CO'), 'fold');
      assert.strictEqual(getActionByGroupWithContext(5, 'BB', 'raise', 'CO', { isSimpleRaise: true }), 'call');
      assert.strictEqual(getActionByGroupWithContext(6, 'BB', 'raise', 'BTN', { isSimpleRaise: true }), 'call');
      assert.strictEqual(getActionByGroupWithContext(7, 'BB', 'raise', 'CO', { isSimpleRaise: true }), 'fold');
    });
    it('BB vs raise: heads-up call mais óbvio (até grupo 7)', () => {
      assert.strictEqual(getActionByGroupWithContext(7, 'BB', 'raise', 'BTN', { isHeadsUp: true }), 'call');
      assert.strictEqual(getActionByGroupWithContext(8, 'BB', 'raise', 'BTN', { isHeadsUp: true }), 'fold');
    });
    it('com hand: usa open-raise range (44 raise UTG, 33 call UTG)', () => {
      const pair44 = hand(CardValue.Four, Suite.Clubs, CardValue.Four, Suite.Diamonds);
      const pair33 = hand(CardValue.Three, Suite.Hearts, CardValue.Three, Suite.Spades);
      assert.strictEqual(getActionByGroupWithContext(6, 'UTG', undefined, undefined, undefined, pair44), 'raise');
      assert.strictEqual(getActionByGroupWithContext(6, 'UTG', undefined, undefined, undefined, pair33), 'call');
    });
  });

  describe('getActionWithContext', () => {
    it('without previous action returns same as getAction', () => {
      const h = hand(CardValue.Ace, Suite.Hearts, CardValue.King, Suite.Spades);
      assert.strictEqual(
        getActionWithContext({ hand: h, currentPosition: 'BTN' }),
        'raise'
      );
      const weak = hand(CardValue.Three, Suite.Clubs, CardValue.Seven, Suite.Diamonds);
      assert.strictEqual(
        getActionWithContext({ hand: weak, currentPosition: 'UTG' }),
        'fold'
      );
    });

    it('when previous action is raise: strong hand in open range returns raise', () => {
      const strong = hand(CardValue.Ace, Suite.Hearts, CardValue.King, Suite.Hearts);
      assert.strictEqual(
        getActionWithContext({
          hand: strong,
          currentPosition: 'CO',
          previousAction: 'raise',
          previousPosition: 'UTG',
        }),
        'raise'
      );
    });

    it('when previous action is raise: weak hand in open range returns call', () => {
      const weak = hand(CardValue.Nine, Suite.Hearts, CardValue.Eight, Suite.Hearts);
      assert.strictEqual(
        getActionWithContext({
          hand: weak,
          currentPosition: 'BTN',
          previousAction: 'raise',
          previousPosition: 'CO',
        }),
        'call'
      );
    });

    it('when previous action is raise: hand outside open range returns fold', () => {
      const weak = hand(CardValue.Three, Suite.Clubs, CardValue.Seven, Suite.Diamonds);
      assert.strictEqual(
        getActionWithContext({
          hand: weak,
          currentPosition: 'UTG',
          previousAction: 'raise',
          previousPosition: 'SB',
        }),
        'fold'
      );
    });
  });
});
