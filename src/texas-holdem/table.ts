export class Table {
  static readonly positions: string[] = [
    'SB',
    'BB',
    'UTG',
    'UTG+1',
    'UTG+2',
    'MP',
    'HJ',
    'CO',
    'BTN',
  ];

  /** Stack inicial por jogador (em unidades, ex.: 100 big blinds). */
  static readonly STACK_DEFAULT = 100;

  /** Aposta obrigatória do small blind (em unidades). */
  static readonly SB_BLIND = 0.5;

  /** Aposta obrigatória do big blind (em unidades). */
  static readonly BB_BLIND = 1;

  /**
   * Ordem de ação pré-flop: primeira decisão é UTG, última é BB (que já pagou 1).
   * UTG → UTG+1 → … → BTN → SB → BB.
   */
  static readonly preflopActionOrder: string[] = [
    'UTG',
    'UTG+1',
    'UTG+2',
    'MP',
    'HJ',
    'CO',
    'BTN',
    'SB',
    'BB',
  ];

  /**
   * Custo do fold por posição: o que já foi apostado e se perde ao foldar.
   * UTG–BTN: 0; SB: 0.5 (blind); BB: 1 (blind).
   */
  static getFoldCost(position: string): number {
    if (position === 'SB') return Table.SB_BLIND;
    if (position === 'BB') return Table.BB_BLIND;
    return 0;
  }

  /**
   * Retorna o stack inicial para uma posição (todas começam com STACK_DEFAULT).
   */
  static getStack(_position: string): number {
    return Table.STACK_DEFAULT;
  }

  /**
   * Peso da posição (0 = pior, 1 = melhor).
   * SB é a pior posição; BTN é a melhor.
   * Usado para ajustar se uma mão é jogável: em posições early exige mão mais forte, em late (BTN) aceita mãos mais fracas.
   */
  static readonly position_weights: number[] = [
    0, // SB  - pior
    0.12, // BB
    0.25, // UTG
    0.35, // UTG+1
    0.45, // UTG+2
    0.55, // MP
    0.68, // HJ
    0.82, // CO
    1, // BTN - melhor
  ];

  static readonly position_normalized = [
    [1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1],
  ];

  static readonly position_to_index = new Map<string, number>(
    Table.positions.map((position, index) => [position, index])
  );

  static readonly index_to_position = new Map<number, string>(
    Table.positions.map((position, index) => [index, position])
  );

  /** Retorna o peso da posição (0–1). Maior = posição mais favorável. */
  static getPositionWeight(position: string): number {
    const idx = Table.position_to_index.get(position);
    return idx !== undefined ? Table.position_weights[idx] : 0;
  }

  /** Sorteia uma posição aleatória (útil para o trainer). */
  static randomPosition(): string {
    const idx = Math.floor(Math.random() * Table.positions.length);
    return Table.positions[idx];
  }
}
