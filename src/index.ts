import { randomHand } from './texas-holdem-deck.js';
import { CardValue, Suite } from './interfaces.js';
import { TensorFlowPatterns } from './tensorflow-patterns.js';

const hand = randomHand();
const cardStr = (value: CardValue, suit: Suite) => `${CardValue[value]} de ${Suite[suit]}`;
console.log('Mão Texas Hold\'em:', cardStr(hand.first.value, hand.first.suit), '|', cardStr(hand.second.value, hand.second.suit));

const encoder = new TensorFlowPatterns();
const normalized = encoder.handToFeatureVector(hand);
console.log('Vetor normalizado [0, 1]:', normalized);
