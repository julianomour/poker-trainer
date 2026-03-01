import { PokerHand } from './deck.js';

/** Tipo da mão: par, suited ou off suited. */
export type HandType = 'pair' | 'suited' | 'off suited';
/** Nível de força: strong ou weak. */
export type HandLevel = 'strong' | 'weak';
/** Categoria de força da mão: [tipo, nível]. */
export type HandStrengthCategory = readonly [HandType, HandLevel];

/** Mão com categoria de força já classificada (para one-hot). */
export type ClassifiedHand = PokerHand & {
  hand_strength: HandStrengthCategory;
};

/** Par forte = 88+ (88, 99, TT, JJ, QQ, KK, AA). Par fraco = 22–77. */
const PAIR_STRONG_THRESHOLD = 8;
/** Para suited/off suited: strong = pelo menos uma carta ≥ J (AJ+ etc.). */
const NON_PAIR_STRONG_THRESHOLD = 11;

export class TexasHoldem {
  /**
   * hand_strength:
   * Este é um array que define categorias de mãos pré-flop em Texas Hold'em Poker para este modelo.
   * Cada sub-array contém dois textos: o tipo da mão (como 'pair', 'suited' ou 'off suited'),
   * e se ela é considerada 'strong' (forte) ou 'weak' (fraca).
   * Exemplo: ['pair', 'strong'] refere-se a pares de mão inicial fortes (AA, KK, QQ...).
   */
  static readonly hand_strength: readonly HandStrengthCategory[] = [
    ['pair', 'strong'], // Ex: 88, 99, TT, JJ, QQ, KK, AA (88+)
    ['pair', 'weak'], // Ex: 22–77
    ['suited', 'strong'], // Duas cartas do mesmo naipe, valores altos (Ex: AKs, QJs)
    ['suited', 'weak'], // Duas cartas do mesmo naipe, valores baixos/desconectados
    ['off suited', 'strong'], // Duas cartas de naipes diferentes, valores altos (Ex: AKo)
    ['off suited', 'weak'], // Duas cartas de naipes diferentes, valores baixos
  ];

  /**
   * hand_strength_to_one_hot:
   * São representações one-hot para cada categoria acima.
   * Cada array é uma codificação one-hot, ou seja, apenas o índice correspondente à categoria tem valor 1, os demais são 0.
   * Este formato é comum quando se representa variáveis categóricas para modelos de machine learning.
   * Exemplo: uma mão 'suited strong' seria [0, 0, 1, 0, 0, 0].
   */
  static readonly hand_strength_to_one_hot = [
    [1, 0, 0, 0, 0, 0], // 'pair strong'
    [0, 1, 0, 0, 0, 0], // 'pair weak'
    [0, 0, 1, 0, 0, 0], // 'suited strong'
    [0, 0, 0, 1, 0, 0], // 'suited weak'
    [0, 0, 0, 0, 1, 0], // 'off suited strong'
    [0, 0, 0, 0, 0, 1], // 'off suited weak'
  ];

  static handStrengthToOneHot(hand: ClassifiedHand): number[] {
    const idx = TexasHoldem.hand_strength.findIndex(
      (row) =>
        row[0] === hand.hand_strength[0] && row[1] === hand.hand_strength[1]
    );
    if (idx === -1) {
      throw new Error(
        `Unknown hand_strength: [${hand.hand_strength[0]}, ${hand.hand_strength[1]}]`
      );
    }
    return [...TexasHoldem.hand_strength_to_one_hot[idx]];
  }

  /** Classifica a mão em uma categoria de força pré-flop. */
  static classifyHand(hand: PokerHand): HandStrengthCategory {
    const { first, second } = hand;
    const isPair = first.value === second.value;
    const isSuited = first.suit === second.suit;
    if (isPair) {
      const level =
        first.value >= PAIR_STRONG_THRESHOLD ? 'strong' : 'weak';
      return ['pair', level];
    }
    const hasHigh =
      first.value >= NON_PAIR_STRONG_THRESHOLD ||
      second.value >= NON_PAIR_STRONG_THRESHOLD;
    const level = hasHigh ? 'strong' : 'weak';
    if (isSuited) return ['suited', level];
    return ['off suited', level];
  }
}
