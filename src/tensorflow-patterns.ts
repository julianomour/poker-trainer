import type { PokerHand } from './texas-holdem-deck.js';
import { CardValue, Suite } from './interfaces.js';

/**
 * Converte mãos de Texas Hold'em em vetores numéricos prontos para TensorFlow.js
 * (tf.tensor2d). Oferece features normalizadas [0, 1] ou one-hot.
 */
export class TensorFlowPatterns {
  static readonly VALUE_MIN = 2;
  static readonly VALUE_MAX = 14;
  static readonly SUIT_MIN = 1;
  static readonly SUIT_MAX = 4;
  static readonly NUM_VALUES = 13;
  static readonly NUM_SUITS = 4;
  static readonly ONE_HOT_FEATURE_LENGTH = 2 * (TensorFlowPatterns.NUM_VALUES + TensorFlowPatterns.NUM_SUITS);

  private static normalize(value: number, min: number, max: number): number {
    return (value - min) / (max - min);
  }

  private static valueToOneHotIndex(value: CardValue): number {
    return value - TensorFlowPatterns.VALUE_MIN;
  }

  private static suitToOneHotIndex(suit: Suite): number {
    return suit - TensorFlowPatterns.SUIT_MIN;
  }

  private static cardToOneHot(value: CardValue, suit: Suite): number[] {
    const { NUM_VALUES, NUM_SUITS } = TensorFlowPatterns;
    const vec = new Array<number>(NUM_VALUES + NUM_SUITS).fill(0);
    vec[TensorFlowPatterns.valueToOneHotIndex(value)] = 1;
    vec[NUM_VALUES + TensorFlowPatterns.suitToOneHotIndex(suit)] = 1;
    return vec;
  }

  /**
   * Converte uma mão em vetor de features normalizado [0, 1]:
   * [valor1, naipe1, valor2, naipe2]. Formato adequado para tf.tensor2d.
   */
  handToFeatureVector(hand: PokerHand): number[] {
    const { VALUE_MIN, VALUE_MAX, SUIT_MIN, SUIT_MAX } = TensorFlowPatterns;
    return [
      TensorFlowPatterns.normalize(hand.first.value, VALUE_MIN, VALUE_MAX),
      TensorFlowPatterns.normalize(hand.first.suit, SUIT_MIN, SUIT_MAX),
      TensorFlowPatterns.normalize(hand.second.value, VALUE_MIN, VALUE_MAX),
      TensorFlowPatterns.normalize(hand.second.suit, SUIT_MIN, SUIT_MAX),
    ];
  }

  /**
   * Converte uma mão em vetor one-hot (34 dimensões):
   * [one-hot carta1 valor, one-hot carta1 naipe, one-hot carta2 valor, one-hot carta2 naipe].
   */
  handToFeatureVectorOneHot(hand: PokerHand): number[] {
    return [
      ...TensorFlowPatterns.cardToOneHot(hand.first.value, hand.first.suit),
      ...TensorFlowPatterns.cardToOneHot(hand.second.value, hand.second.suit),
    ];
  }

  /**
   * Converte um lote de mãos em matriz [n, features] pronta para tf.tensor2d(data).
   *
   * @param hands Array de mãos
   * @param oneHot Se true, usa one-hot (34 dims); se false, usa normalizado (4 dims)
   */
  handsToBatch(hands: PokerHand[], oneHot: boolean = false): number[][] {
    return hands.map((h) =>
      oneHot ? this.handToFeatureVectorOneHot(h) : this.handToFeatureVector(h)
    );
  }
}
