import type { PokerHand } from './deck.js';

/** Grupo Sklansky: 1 (mais forte) a 8 (mais fraco). */
export type SklanskyGroup = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const VALUE_CHAR: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9',
  10: 'T', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

/** Converte mão para string canônica (alto primeiro): "AKs", "72o", "TT". */
export function handToCanonical(hand: PokerHand): string {
  const [a, b] =
    hand.first.value >= hand.second.value
      ? [hand.first, hand.second]
      : [hand.second, hand.first];
  const high = VALUE_CHAR[a.value] ?? '';
  const low = VALUE_CHAR[b.value] ?? '';
  if (a.value === b.value) return `${high}${low}`;
  const suited = a.suit === b.suit ? 's' : 'o';
  return `${high}${low}${suited}`;
}

/** Mapa mão canônica → grupo Sklansky (1–8). Baseado na tabela do doc. */
const HAND_TO_GROUP = new Map<string, SklanskyGroup>([
  ['AA', 1], ['KK', 1],
  ['QQ', 2], ['AKs', 2], ['AKo', 2], ['JJ', 2],
  ['AQs', 3], ['AQo', 3], ['TT', 3], ['99', 3],
  ['AJs', 4], ['KQs', 4], ['88', 4], ['77', 4],
  ['AJo', 5], ['ATs', 5], ['ATo', 5], ['KQo', 5], ['KJs', 5], ['66', 5], ['55', 5],
  ['A9s', 6], ['A8s', 6], ['A7s', 6], ['A6s', 6], ['A5s', 6], ['A4s', 6], ['A3s', 6], ['A2s', 6],
  ['KJo', 6], ['KTs', 6], ['QJs', 6], ['QTs', 6], ['JTs', 6], ['44', 6], ['33', 6], ['22', 6],
  ['A9o', 7], ['A8o', 7], ['A7o', 7], ['A6o', 7], ['A5o', 7], ['A4o', 7], ['A3o', 7], ['A2o', 7],
  ['KTo', 7], ['QJo', 7], ['QTo', 7], ['JTo', 7],
  ['T9s', 7], ['98s', 7], ['87s', 7], ['76s', 7], ['65s', 7], ['54s', 7],
  ['K9s', 8], ['K9o', 8], ['K8s', 8], ['K8o', 8],
  ['Q9s', 8], ['Q8s', 8], ['J9s', 8], ['T8s', 8], ['T9o', 8],
  ['97s', 8], ['98o', 8], ['86s', 8], ['87o', 8], ['75s', 8], ['76o', 8], ['64s', 8],
]);

/** Retorna o grupo Sklansky (1–8) da mão. Se não estiver na tabela, retorna 8 (mais fraco). */
export function getSklanskyGroup(hand: PokerHand): SklanskyGroup {
  const key = handToCanonical(hand);
  const group = HAND_TO_GROUP.get(key);
  return group ?? 8;
}

/** Máximo grupo jogável por posição (Sklansky). Early usa range explícito (44+, Axs, ATo+, 87s+) então max 7; late 7–8. */
const POSITION_MAX_GROUP: Record<string, SklanskyGroup> = {
  SB: 8, BB: 8,
  UTG: 7, 'UTG+1': 7, 'UTG+2': 7,
  MP: 7, HJ: 7,
  CO: 7, BTN: 7,
};

/** Grupo máximo com que a posição abre com raise (quando ninguém raiseou antes). Ex.: UTG+1 pode raise com 1–4 (88). */
const POSITION_RAISE_MAX_GROUP: Record<string, number> = {
  SB: 8, BB: 8,
  UTG: 2, 'UTG+1': 4, 'UTG+2': 4,
  MP: 4, HJ: 5,
  CO: 6, BTN: 7,
};

/** Retorna o grupo máximo jogável na posição (1–8). Posição desconhecida = 0 (fold tudo). */
export function getMaxGroupForPosition(position: string): number {
  const max = POSITION_MAX_GROUP[position];
  return max ?? 0;
}

/** Retorna o grupo máximo com que a posição faz raise ao abrir (sem raise anterior). */
export function getRaiseMaxGroupForPosition(position: string): number {
  const max = POSITION_RAISE_MAX_GROUP[position];
  return max ?? 0;
}

/**
 * Grupo máximo com que a posição pode continuar (call) quando alguém já fez raise.
 * Exige mão melhor que a abertura: só continua com mãos mais fortes.
 */
const POSITION_MAX_GROUP_VS_RAISE: Record<string, number> = {
  SB: 4, BB: 4,
  UTG: 2, 'UTG+1': 3, 'UTG+2': 3,
  MP: 3, HJ: 4,
  CO: 4, BTN: 5,
};

/**
 * Grupo máximo com que a posição faz 3-bet (raise) quando alguém já raiseou.
 * Só mãos muito fortes 3-betam.
 */
const POSITION_RAISE_MAX_GROUP_VS_RAISE: Record<string, number> = {
  SB: 2, BB: 2,
  UTG: 1, 'UTG+1': 1, 'UTG+2': 2,
  MP: 2, HJ: 2,
  CO: 2, BTN: 2,
};

/** Retorna o grupo máximo jogável para call quando há raise antes (exige mão melhor). */
export function getMaxGroupToCallVsRaise(position: string): number {
  return POSITION_MAX_GROUP_VS_RAISE[position] ?? 0;
}

/** Retorna o grupo máximo com que a posição faz 3-bet (raise vs raise). */
export function getRaiseMaxGroupVsRaise(position: string): number {
  return POSITION_RAISE_MAX_GROUP_VS_RAISE[position] ?? 0;
}

/** Verifica se a mão está no range da posição (grupo <= maxGroup da posição). */
export function isHandInPositionRange(hand: PokerHand, position: string): boolean {
  const max = getMaxGroupForPosition(position);
  if (max === 0) return false;
  return getSklanskyGroup(hand) <= max;
}

/** Retorna one-hot de tamanho 8 para o grupo (índice 0 = grupo 1, …, índice 7 = grupo 8). */
export function sklanskyGroupToOneHot(group: SklanskyGroup): number[] {
  const vec = new Array(8).fill(0);
  vec[group - 1] = 1;
  return vec;
}
