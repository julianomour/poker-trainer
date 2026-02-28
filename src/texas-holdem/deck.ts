import { CardValue, Suite } from '../interfaces.js';

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

const VALUE_CHAR: Record<number, string> = { 10: 'T', 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
/** Naipes com símbolos de baralho: ♥ copas, ♦ ouros, ♣ paus, ♠ espadas */
const SUIT_CHAR: Record<Suite, string> = {
  [Suite.Hearts]: '♥',
  [Suite.Diamonds]: '♦',
  [Suite.Clubs]: '♣',
  [Suite.Spades]: '♠',
};

/** Formata a mão no estilo "7h9d". */
export function formatHandShort(hand: PokerHand): string {
  const v = (c: Card) => (c.value >= 2 && c.value <= 9 ? String(c.value) : VALUE_CHAR[c.value] ?? '');
  const s = (c: Card) => SUIT_CHAR[c.suit];
  return `${v(hand.first)}${s(hand.first)}${v(hand.second)}${s(hand.second)}`;
}
