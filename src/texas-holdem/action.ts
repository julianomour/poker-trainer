import type { HandStrengthCategory } from './rules.js';
import type { PokerHand } from './deck.js';
import { Table } from './table.js';
import { TexasHoldem } from './rules.js';
import { isHandInRange, getOpenRange } from './range.js';
import { getMaxGroupForPosition, getRaiseMaxGroupForPosition } from './sklansky.js';
import type { SklanskyGroup } from './sklansky.js';

/** Ações pré-flop: fold (desistir), call (pagar), raise (aumentar). Check não é usado na primeira decisão pré-flop com blind em jogo. */
export type Action = 'fold' | 'call' | 'raise';

/**
 * Parâmetros para decisão com contexto de ação anterior (ação do vilão + range do vilão + nossa mão e posição).
 */
export interface ActionParams {
  /** Nossa mão. */
  hand: PokerHand;
  /** Nossa posição. */
  currentPosition: string;
  /** Ação da posição anterior (quem agiu antes). Se omitido, trata-se como abertura (ninguém raiseou/callou). */
  previousAction?: Action;
  /** Posição de quem fez a ação anterior (necessária para derivar range do vilão quando previousAction é raise/call). */
  previousPosition?: string;
}

/**
 * Limiar de peso de posição: abaixo disso, mãos fracas resultam em fold.
 * Early (SB, BB, UTG, UTG+1, UTG+2) têm peso < 0.5.
 */
const POSITION_FOLD_THRESHOLD = 0.5;

/**
 * Decide a ação pré-flop a partir da categoria de força da mão e da posição.
 * - fold: mão fraca em posição early (não jogável).
 * - raise: mão forte (valorizar).
 * - call: mão fraca em posição late ou média (jogável mas sem valorizar).
 */
export function getAction(
  category: HandStrengthCategory,
  position: string
): Action {
  const positionWeight = Table.getPositionWeight(position);
  const level = category[1]; // 'strong' | 'weak'

  if (level === 'weak' && positionWeight < POSITION_FOLD_THRESHOLD) {
    return 'fold';
  }
  if (level === 'strong') {
    return 'raise';
  }
  return 'call';
}

/**
 * Decide a ação pré-flop considerando a ação da posição anterior e os ranges.
 * Se a posição anterior fez raise, o range do vilão é mais tight; repensamos: mão forte no nosso range pode 3-betar ou call; mão fraca no nosso range tende a call ou fold.
 *
 * - Sem ação prévia (ou previousAction omitido): usa getAction(category, currentPosition).
 * - previousAction === 'raise': se nossa mão é strong → raise (3-bet) ou call; se weak mas jogável → call (não valorizamos vs raise); se fora do range open → fold.
 * - previousAction === 'call': mantém lógica por posição (podemos valorizar mais).
 */
export function getActionWithContext(params: ActionParams): Action {
  const {
    hand,
    currentPosition,
    previousAction,
    previousPosition,
  } = params;
  const category = TexasHoldem.classifyHand(hand);
  const level = category[1];

  if (previousAction === undefined || previousPosition === undefined) {
    return getAction(category, currentPosition);
  }

  if (previousAction === 'raise') {
    const weAreStrong = level === 'strong';
    const weAreInOpenRange = isHandInRange(hand, getOpenRange(currentPosition));
    if (!weAreInOpenRange) return 'fold';
    if (weAreStrong) return 'raise';
    return 'call';
  }

  if (previousAction === 'call') {
    return getAction(category, currentPosition);
  }

  return getAction(category, currentPosition);
}

/**
 * Decide a ação pré-flop usando o grupo Sklansky (1–8) e a posição.
 * Fold se grupo > max da posição; raise se grupo <= raiseMax da posição (ao abrir); call se jogável mas não raise.
 */
export function getActionByGroup(group: SklanskyGroup, position: string): Action {
  const max = getMaxGroupForPosition(position);
  if (max === 0 || group > max) return 'fold';
  const raiseMax = getRaiseMaxGroupForPosition(position);
  if (group <= raiseMax) return 'raise';
  return 'call';
}

/**
 * Decide a ação com contexto da ação anterior (fluxo sequencial).
 * Quando houve raise antes: fold se fora do range; raise só com grupo 1–2 (3-bet); call com 3–max.
 */
export function getActionByGroupWithContext(
  group: SklanskyGroup,
  position: string,
  previousAction?: Action,
  _previousPosition?: string
): Action {
  const max = getMaxGroupForPosition(position);
  if (max === 0 || group > max) return 'fold';

  if (previousAction === 'raise') {
    if (group <= 2) return 'raise';
    return 'call';
  }

  return getActionByGroup(group, position);
}
