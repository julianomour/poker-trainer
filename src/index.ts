import { randomHand } from './texas-holdem-deck.js';
import { CardValue, Suite } from './interfaces.js';

const hand = randomHand();
const cardStr = (value: CardValue, suit: Suite) => `${CardValue[value]} de ${Suite[suit]}`;
console.log('Mão Texas Hold\'em:', cardStr(hand.first.value, hand.first.suit), '|', cardStr(hand.second.value, hand.second.suit));
