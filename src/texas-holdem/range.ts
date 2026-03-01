import type { PokerHand } from './deck.js';
import { TexasHoldem } from './rules.js';
import { Table } from './table.js';

/** Predicado: a mão está no range? */
export type Range = (hand: PokerHand) => boolean;

/** Ação do vilão para definir seu range. Deve ser igual a action.Action. */
export type Action = 'fold' | 'call' | 'raise';

/** Limiar de peso de posição: abaixo disso, mãos fracas = fold. Deve ser igual ao de action.ts. */
const POSITION_FOLD_THRESHOLD = 0.5;

function actionFromCategoryAndPosition(
  category: ReturnType<typeof TexasHoldem.classifyHand>,
  position: string
): Action {
  const positionWeight = Table.getPositionWeight(position);
  const level = category[1];
  if (level === 'weak' && positionWeight < POSITION_FOLD_THRESHOLD) {
    return 'fold';
  }
  if (level === 'strong') return 'raise';
  return 'call';
}

/**
 * Verifica se a mão está no range (predicado).
 */
export function isHandInRange(hand: PokerHand, range: Range): boolean {
  return range(hand);
}

/**
 * Retorna o range "open" da posição: mãos jogáveis (não fold) ao abrir ou quando não há ação prévia.
 * Equivalente a: getAction(classifyHand(hand), position) !== 'fold'.
 */
export function getOpenRange(position: string): Range {
  return (hand: PokerHand) => {
    const category = TexasHoldem.classifyHand(hand);
    return actionFromCategoryAndPosition(category, position) !== 'fold';
  };
}

/**
 * Retorna o range da posição dado que o vilão fez essa ação.
 * Usado para "range do vilão quando ele fez raise/call" e para repensar nossa decisão.
 *
 * - 'raise': mãos com que o vilão faria raise (força strong na nossa classificação).
 * - 'call': mãos com que o vilão faria call (weak mas jogável na posição dele).
 * - 'fold': mãos com que o vilão foldaria (fora do range open).
 */
export function getRangeForAction(position: string, action: Action): Range {
  return (hand: PokerHand) => {
    const category = TexasHoldem.classifyHand(hand);
    return actionFromCategoryAndPosition(category, position) === action;
  };
}

/**
 * Verifica se a mão está no range "open" da posição (jogável sem ação prévia).
 */
export function isHandInOpenRange(hand: PokerHand, position: string): boolean {
  return isHandInRange(hand, getOpenRange(position));
}

/**
 * Verifica se a mão está no range de raise da posição (mãos fortes que valorizam).
 */
export function isHandInRaiseRange(hand: PokerHand, position: string): boolean {
  return isHandInRange(hand, getRangeForAction(position, 'raise'));
}
