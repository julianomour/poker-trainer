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

const VALUES = Object.values(CardValue).filter(
  (v): v is CardValue => typeof v === 'number'
);
const SUITS = Object.values(Suite).filter(
  (s): s is Suite => typeof s === 'number'
);

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

const VALUE_CHAR: Record<number, string> = {
  10: 'T',
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
};
/** Naipes com símbolos de baralho: ♥ copas, ♦ ouros, ♣ paus, ♠ espadas */
const SUIT_CHAR: Record<Suite, string> = {
  [Suite.Hearts]: '♥',
  [Suite.Diamonds]: '♦',
  [Suite.Clubs]: '♣',
  [Suite.Spades]: '♠',
};

/** Formata a mão no estilo "7♥9♦". */
export function formatHandShort(hand: PokerHand): string {
  const v = (c: Card) =>
    c.value >= 2 && c.value <= 9
      ? String(c.value)
      : (VALUE_CHAR[c.value] ?? '');
  const s = (c: Card) => SUIT_CHAR[c.suit];
  return `${v(hand.first)}${s(hand.first)}${v(hand.second)}${s(hand.second)}`;
}

/** Formata uma única carta no estilo "7♥". */
export function formatCardShort(card: Card): string {
  const v =
    card.value >= 2 && card.value <= 9
      ? String(card.value)
      : (VALUE_CHAR[card.value] ?? '');
  return `${v}${SUIT_CHAR[card.suit]}`;
}

/**
 * Distribui uma carta para cada posição, na ordem: SB primeiro, BTN por último.
 * Retorna array na mesma ordem das posições.
 */
export function dealOneCardPerPosition(
  positions: readonly string[]
): { position: string; card: Card }[] {
  const deck = createDeck();
  shuffle(deck);
  return positions.map((position, i) => ({ position, card: deck[i] }));
}

/**
 * Distribui duas cartas para cada posição (rodada completa).
 * Ordem: 1ª carta SB→BTN, depois 2ª carta SB→BTN. Cada posição recebe uma mão de 2 cartas.
 * @param positions Lista de posições (máximo 26, pois 52/2 = 26 mãos).
 */
export function dealTwoCardsPerPosition(
  positions: readonly string[]
): { position: string; hand: PokerHand }[] {
  if (positions.length > 26) {
    throw new Error('At most 26 positions supported (52/2 cards)');
  }
  const deck = createDeck();
  shuffle(deck);
  const n = positions.length;
  return positions.map((position, i) => ({
    position,
    hand: { first: deck[i], second: deck[n + i] },
  }));
}
