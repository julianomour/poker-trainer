import { randomHand, formatHandShort } from './texas-holdem/deck.js';
import { TexasHoldem } from './texas-holdem/rules.js';

const hand = randomHand();
const category = TexasHoldem.classifyHand(hand);
console.log(`${formatHandShort(hand)} - ${category.join(' ')}`);
