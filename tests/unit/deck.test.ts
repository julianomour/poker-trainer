import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  Card,
  randomHand,
  formatHandShort,
  dealTwoCardsPerPosition,
} from '../../src/texas-holdem/deck.js';
import { CardValue, Suite } from '../../src/interfaces.js';

describe('deck', () => {
  describe('randomHand', () => {
    it('returns two distinct cards', () => {
      for (let i = 0; i < 50; i++) {
        const hand = randomHand();
        const distinct =
          hand.first.value !== hand.second.value ||
          hand.first.suit !== hand.second.suit;
        assert.ok(
          distinct,
          `expected two distinct cards, got ${formatHandShort(hand)}`
        );
      }
    });
  });

  describe('formatHandShort', () => {
    it('formats hand with numeric and face values and correct suits', () => {
      const hand = {
        first: new Card(CardValue.Seven, Suite.Hearts),
        second: new Card(CardValue.Nine, Suite.Diamonds),
      };
      assert.strictEqual(formatHandShort(hand), '7♥9♦');
    });

    it('formats face cards (T, J, Q, K, A)', () => {
      const hand = {
        first: new Card(CardValue.Ten, Suite.Spades),
        second: new Card(CardValue.Ace, Suite.Clubs),
      };
      assert.strictEqual(formatHandShort(hand), 'T♠A♣');
    });
  });

  describe('dealTwoCardsPerPosition', () => {
    it('returns one entry per position with two cards each', () => {
      const positions = ['SB', 'BB', 'UTG'];
      const result = dealTwoCardsPerPosition(positions);
      assert.strictEqual(result.length, positions.length);
      for (const { position, hand } of result) {
        assert.ok(positions.includes(position));
        assert.ok(hand.first);
        assert.ok(hand.second);
        assert.notStrictEqual(hand.first, hand.second);
      }
    });

    it('deals 2*N distinct cards across all hands', () => {
      const positions = ['A', 'B', 'C', 'D', 'E'];
      const result = dealTwoCardsPerPosition(positions);
      const allCards: string[] = [];
      for (const { hand } of result) {
        allCards.push(`${hand.first.value}-${hand.first.suit}`);
        allCards.push(`${hand.second.value}-${hand.second.suit}`);
      }
      const unique = new Set(allCards);
      assert.strictEqual(
        unique.size,
        2 * positions.length,
        'all dealt cards must be distinct'
      );
    });

    it('throws when more than 9 positions', () => {
      const positions = Array.from({ length: 10 }, (_, i) => `P${i}`);
      assert.throws(
        () => dealTwoCardsPerPosition(positions),
        /At most 9 positions/
      );
    });
  });
});
