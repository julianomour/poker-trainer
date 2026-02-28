import { randomHand, formatHandShort } from './texas-holdem/deck.js';
import { TexasHoldem } from './texas-holdem/rules.js';
import { Table } from './texas-holdem/table.js';

const hand = randomHand();
const position = Table.randomPosition();
const strength = TexasHoldem.classifyHand(hand);

console.log(`${position} ${formatHandShort(hand)} - ${strength.join(' ')}`);
