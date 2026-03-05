export class Table {
  /**
   * Mesa no-limit: tamanho das apostas baseado no pote (com teto por rodada).
   * All-in pode ocorrer quando a análise da mão (grupo Sklansky + posição) levar a raise/call
   * e o stack for insuficiente; não é regra fixa, depende da situação.
   */
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

  /** Raise mínimo: adiciona pelo menos 1 BB ao valor atual (evita raise microscópico com pote pequeno). */
  static readonly MIN_RAISE_ADD = 1;

  /**
   * Ordem de ação pré-flop: primeira decisão é UTG, última é BB (que já pagou 1).
   * Corresponde ao fluxo horário na mesa: UTG → UTG+1 → … → BTN → SB → BB.
   * Na primeira rodada percorremos todas as posições nessa ordem; nas seguintes,
   * a mesma ordem vale para quem ainda está na mão (quem foldou é pulado).
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

  /** Ordem de ação em sentido horário (igual a preflopActionOrder). Usado para exibir decisões no fluxo da mesa. */
  static get clockwiseActionOrder(): string[] {
    return Table.preflopActionOrder;
  }

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
   * Valor já colocado na rua por posição no início do pré-flop (SB e BB já postaram).
   */
  static getInitialAmountIn(position: string): number {
    if (position === 'SB') return Table.SB_BLIND;
    if (position === 'BB') return Table.BB_BLIND;
    return 0;
  }

  /** Raise máximo por vez (em BB): limita o tamanho do raise para fechar as rodadas sem forçar all-in. */
  static readonly MAX_RAISE_ADD = 3;

  /** Número máximo de raises por rua: após isso só fold ou call (fecha a rodada de apostas). */
  static readonly MAX_RAISES_PER_STREET = 4;

  /**
   * Valor do próximo raise com base no pote atual, limitado para fechar as rodadas.
   * raiseSize = min(max(pote, MIN_RAISE_ADD), MAX_RAISE_ADD * BB); nextBet = currentBet + raiseSize.
   */
  static getNextRaiseTo(currentBet: number, pot: number): number {
    const raiseSize = Math.min(
      Math.max(pot, Table.MIN_RAISE_ADD),
      Table.MAX_RAISE_ADD * Table.BB_BLIND
    );
    return currentBet + raiseSize;
  }

  /** Calcula o pote atual (soma do que cada posição já colocou na rua). */
  static getPot(amountIn: Map<string, number>): number {
    return Array.from(amountIn.values()).reduce((a, b) => a + b, 0);
  }

  /**
   * Custo da decisão e próximo estado da rua.
   * - fold: custo 0 para todos (SB/BB já tiveram o blind descontado no stack inicial).
   * - call: custo = currentBet - amountIn[position].
   * - check: custo 0, nextBet = currentBet (só válido quando amountIn[position] === currentBet).
   * - raise: custo = nextBet - amountIn[position], com nextBet = currentBet + max(pote, MIN_RAISE_ADD).
   */
  static getCostAndNextBet(
    position: string,
    action: 'fold' | 'call' | 'raise' | 'check',
    currentBet: number,
    amountIn: Map<string, number>
  ): { cost: number; nextBet: number; newAmountIn: Map<string, number> } {
    const inThisPosition = amountIn.get(position) ?? Table.getInitialAmountIn(position);
    const newAmountIn = new Map(amountIn);

    if (action === 'fold') {
      return { cost: 0, nextBet: currentBet, newAmountIn };
    }

    if (action === 'check' || action === 'call') {
      const cost = currentBet - inThisPosition;
      newAmountIn.set(position, currentBet);
      return { cost, nextBet: currentBet, newAmountIn };
    }

    const pot = Table.getPot(amountIn);
    const nextBet = Table.getNextRaiseTo(currentBet, pot);
    const cost = nextBet - inThisPosition;
    newAmountIn.set(position, nextBet);
    return { cost, nextBet, newAmountIn };
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
