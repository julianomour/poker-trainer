import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Table } from '../../src/texas-holdem/table.js';

describe('table', () => {
  describe('getPositionWeight', () => {
    it('returns expected weight for known position BTN', () => {
      assert.strictEqual(Table.getPositionWeight('BTN'), 1);
    });

    it('returns expected weight for SB (worst)', () => {
      assert.strictEqual(Table.getPositionWeight('SB'), 0);
    });

    it('returns 0 for unknown position', () => {
      assert.strictEqual(Table.getPositionWeight('UNKNOWN'), 0);
    });
  });

  describe('randomPosition', () => {
    it('returns a value in Table.positions', () => {
      for (let i = 0; i < 30; i++) {
        const pos = Table.randomPosition();
        assert.ok(
          Table.positions.includes(pos),
          `expected one of ${Table.positions.join(', ')}, got ${pos}`
        );
      }
    });
  });

  describe('stack and blinds', () => {
    it('STACK_DEFAULT is 100', () => {
      assert.strictEqual(Table.STACK_DEFAULT, 100);
    });
    it('SB_BLIND is 0.5, BB_BLIND is 1', () => {
      assert.strictEqual(Table.SB_BLIND, 0.5);
      assert.strictEqual(Table.BB_BLIND, 1);
    });
    it('getStack returns 100 for any position', () => {
      assert.strictEqual(Table.getStack('UTG'), 100);
      assert.strictEqual(Table.getStack('SB'), 100);
    });
  });

  describe('preflopActionOrder', () => {
    it('first decision is UTG, last is BB', () => {
      assert.strictEqual(Table.preflopActionOrder[0], 'UTG');
      assert.strictEqual(Table.preflopActionOrder[Table.preflopActionOrder.length - 1], 'BB');
    });
    it('contains all 9 positions', () => {
      assert.strictEqual(Table.preflopActionOrder.length, 9);
      for (const p of Table.positions) {
        assert.ok(Table.preflopActionOrder.includes(p), `missing ${p}`);
      }
    });
  });

  describe('getFoldCost', () => {
    it('UTG through BTN cost 0', () => {
      assert.strictEqual(Table.getFoldCost('UTG'), 0);
      assert.strictEqual(Table.getFoldCost('BTN'), 0);
    });
    it('SB fold costs 0.5 (blind)', () => {
      assert.strictEqual(Table.getFoldCost('SB'), 0.5);
    });
    it('BB fold costs 1 (blind)', () => {
      assert.strictEqual(Table.getFoldCost('BB'), 1);
    });
  });
});
