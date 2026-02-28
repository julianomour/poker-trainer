import { dealTwoCardsPerPosition, formatHandShort } from './texas-holdem/deck.js';
import { TexasHoldem } from './texas-holdem/rules.js';
import { Table } from './texas-holdem/table.js';

const round = dealTwoCardsPerPosition(Table.positions);
const lines = round.map(({ position, hand }) => {
  const strength = TexasHoldem.classifyHand(hand);
  return `${position} - ${formatHandShort(hand)} - ${strength[0]} ${strength[1]}`;
});
console.log(lines.join('\n'));
