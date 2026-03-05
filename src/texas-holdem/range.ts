import type { PokerHand } from './deck.js';
import type { Action } from './action.js';
import { TexasHoldem } from './rules.js';
import { Table } from './table.js';

/** Predicado: a mão está no range? */
export type Range = (hand: PokerHand) => boolean;

/** Reexporta Action para manter range alinhado às ações do jogo. */
export type { Action };

/** Posições early: UTG até HJ. Raise range: 44+, todos A suited, ATo+, 87s+. */
const EARLY_RAISE_POSITIONS = new Set(['UTG', 'UTG+1', 'UTG+2', 'MP', 'HJ']);

/** Posições late: CO para frente. Raise range: todos pares, K9o+, todos A suited, Q6s+. */
const LATE_RAISE_POSITIONS = new Set(['CO', 'BTN', 'SB', 'BB']);

function highLow(hand: PokerHand): { high: number; low: number } {
  const a = hand.first.value;
  const b = hand.second.value;
  return a >= b ? { high: a, low: b } : { high: b, low: a };
}

function isPair(hand: PokerHand): boolean {
  return hand.first.value === hand.second.value;
}

function isSuited(hand: PokerHand): boolean {
  return hand.first.suit === hand.second.suit;
}

/** Pares 44+ (valor do par >= 4). */
function isPair44Plus(hand: PokerHand): boolean {
  if (!isPair(hand)) return false;
  return hand.first.value >= 4;
}

/** Todos os A suited (A2s até AKs). */
function isAceSuited(hand: PokerHand): boolean {
  const h = highLow(hand);
  if (h.high !== 14) return false;
  return isSuited(hand);
}

/** ATo+ (Ás com T ou melhor: AT, AJ, AQ, AK). */
function isAToPlus(hand: PokerHand): boolean {
  const h = highLow(hand);
  if (h.high !== 14) return false;
  return h.low >= 10;
}

/** 87s+ = suited connectors com carta alta >= 8 (87s, 98s, T9s, JTs, QJs, KQs, AKs). */
function is87sPlus(hand: PokerHand): boolean {
  if (!isSuited(hand)) return false;
  const h = highLow(hand);
  if (h.high - h.low > 1) return false;
  return h.high >= 8;
}

/** Early raise: 44+, todos A suited, ATo+, 87s+. */
function isInEarlyRaiseRange(hand: PokerHand): boolean {
  return (
    isPair44Plus(hand) ||
    isAceSuited(hand) ||
    isAToPlus(hand) ||
    is87sPlus(hand)
  );
}

/** Todos os pares (22+). */
function isAnyPair(hand: PokerHand): boolean {
  return isPair(hand);
}

/** K9o+ (K com 9 ou melhor: K9, KT, KJ, KQ, KA; suited ou off). */
function isK9oPlus(hand: PokerHand): boolean {
  const h = highLow(hand);
  if (h.high !== 13) return false;
  return h.low >= 9;
}

/** Q6s+ (Q com 6 ou melhor suited: Q6s até KQs, AKs). */
function isQ6sPlus(hand: PokerHand): boolean {
  if (!isSuited(hand)) return false;
  const h = highLow(hand);
  return h.high >= 12 && h.low >= 6;
}

/** Late raise: todos pares, K9o+, todos A suited, Q6s+. */
function isInLateRaiseRange(hand: PokerHand): boolean {
  return (
    isAnyPair(hand) ||
    isK9oPlus(hand) ||
    isAceSuited(hand) ||
    isQ6sPlus(hand)
  );
}

/**
 * Retorna o range de abertura com raise por posição.
 * - UTG até HJ: pares 44+, todos A suited, ATo+, 87s+.
 * - CO para frente: todos pares, K9o+, todos A suited, Q6s+.
 */
export function getOpenRaiseRange(position: string): Range {
  if (EARLY_RAISE_POSITIONS.has(position)) {
    return isInEarlyRaiseRange;
  }
  if (LATE_RAISE_POSITIONS.has(position)) {
    return isInLateRaiseRange;
  }
  return () => false;
}

/** Verifica se a mão está no range de abertura com raise da posição. */
export function isHandInOpenRaiseRange(hand: PokerHand, position: string): boolean {
  return isHandInRange(hand, getOpenRaiseRange(position));
}

/** Limiar de peso de posição: abaixo disso, mãos fracas = fold. Deve ser igual ao de action.ts. */
const POSITION_FOLD_THRESHOLD = 0.5;

function actionFromCategoryAndPosition(
  category: ReturnType<typeof TexasHoldem.classifyHand>,
  position: string
): Exclude<Action, 'check'> {
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
 * - 'check': tratado como call (weak mas jogável).
 * - 'fold': mãos com que o vilão foldaria (fora do range open).
 */
export function getRangeForAction(position: string, action: Action): Range {
  const effectiveAction = action === 'check' ? 'call' : action;
  return (hand: PokerHand) => {
    const category = TexasHoldem.classifyHand(hand);
    return actionFromCategoryAndPosition(category, position) === effectiveAction;
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
