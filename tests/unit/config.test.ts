import { describe, it } from 'node:test';
import assert from 'node:assert';
import { config } from '../../src/config/index.js';

describe('config', () => {
  it('exposes port', () => {
    assert.ok(config.port > 0);
  });
});
