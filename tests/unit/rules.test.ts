import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Card } from '../../src/texas-holdem/deck.js';
import {
  TexasHoldem,
  type HandStrengthCategory,
} from '../../src/texas-holdem/rules.js';
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

describe('rules', () => {
  describe('classifyHand', () => {
    it('classifies pair strong (88+)', () => {
      const jj = hand(
        CardValue.Jack,
        Suite.Hearts,
        CardValue.Jack,
        Suite.Spades
      );
      assert.deepStrictEqual(TexasHoldem.classifyHand(jj), ['pair', 'strong']);
      const eightEight = hand(
        CardValue.Eight,
        Suite.Clubs,
        CardValue.Eight,
        Suite.Diamonds
      );
      assert.deepStrictEqual(TexasHoldem.classifyHand(eightEight), [
        'pair',
        'strong',
      ]);
    });

    it('classifies pair weak (22–77)', () => {
      const h = hand(CardValue.Two, Suite.Clubs, CardValue.Two, Suite.Diamonds);
      assert.deepStrictEqual(TexasHoldem.classifyHand(h), ['pair', 'weak']);
      const sevenSeven = hand(
        CardValue.Seven,
        Suite.Hearts,
        CardValue.Seven,
        Suite.Spades
      );
      assert.deepStrictEqual(TexasHoldem.classifyHand(sevenSeven), [
        'pair',
        'weak',
      ]);
    });

    it('classifies suited strong (e.g. AKs)', () => {
      const h = hand(CardValue.Ace, Suite.Hearts, CardValue.King, Suite.Hearts);
      assert.deepStrictEqual(TexasHoldem.classifyHand(h), [
        'suited',
        'strong',
      ]);
    });

    it('classifies suited weak (e.g. 72s)', () => {
      const h = hand(CardValue.Seven, Suite.Clubs, CardValue.Two, Suite.Clubs);
      assert.deepStrictEqual(TexasHoldem.classifyHand(h), ['suited', 'weak']);
    });

    it('classifies off suited strong (e.g. AKo)', () => {
      const h = hand(
        CardValue.Ace,
        Suite.Spades,
        CardValue.King,
        Suite.Diamonds
      );
      assert.deepStrictEqual(TexasHoldem.classifyHand(h), [
        'off suited',
        'strong',
      ]);
    });

    it('classifies off suited weak', () => {
      const h = hand(
        CardValue.Three,
        Suite.Hearts,
        CardValue.Seven,
        Suite.Clubs
      );
      assert.deepStrictEqual(TexasHoldem.classifyHand(h), [
        'off suited',
        'weak',
      ]);
    });
  });

  describe('handStrengthToOneHot', () => {
    it('returns one-hot for each hand_strength category', () => {
      const categories = TexasHoldem.hand_strength;
      for (let idx = 0; idx < categories.length; idx++) {
        const [type, level] = categories[idx];
        const handStub = hand(
          CardValue.Two,
          Suite.Hearts,
          CardValue.Three,
          Suite.Clubs
        );
        const classified = {
          ...handStub,
          hand_strength: [type, level] as HandStrengthCategory,
        };
        const oneHot = TexasHoldem.handStrengthToOneHot(classified);
        assert.strictEqual(oneHot.length, 6);
        assert.strictEqual(oneHot[idx], 1);
        for (let i = 0; i < 6; i++) {
          if (i !== idx) assert.strictEqual(oneHot[i], 0);
        }
      }
    });
  });
});
