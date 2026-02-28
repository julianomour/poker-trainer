import { CardValue, Suite } from './interfaces.js';

export class Card {
  constructor(
    readonly value: CardValue,
    readonly suit: Suite
  ) {}
}

/** Mão de Texas Hold'em: duas cartas (hole cards). */
export type PokerHand = {
  first: Card;
  second: Card;
};

const VALUES = Object.values(CardValue).filter((v): v is CardValue => typeof v === 'number');
const SUITS = Object.values(Suite).filter((s): s is Suite => typeof s === 'number');

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const value of VALUES) {
    for (const suit of SUITS) {
      deck.push(new Card(value, suit));
    }
  }
  return deck;
}

/**
 * Embaralha um array no local usando o algoritmo de Fisher-Yates.
 * Para cada elemento do array, troca com outro elemento sorteado aleatoriamente.
 * 
 * @param array O array a ser embaralhado. O array é modificado no local.
 */
function shuffle<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    // Escolhe um índice aleatório de 0 até i (inclusive)
    const j = Math.floor(Math.random() * (i + 1));
    // Troca o elemento na posição i com o elemento na posição j
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/** Retorna uma mão aleatória de duas cartas (sem reposição). */
export function randomHand(): PokerHand {
  const deck = createDeck();
  shuffle(deck);
  return {
    first: deck[0],
    second: deck[1],
  };
}
