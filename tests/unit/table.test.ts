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
});
