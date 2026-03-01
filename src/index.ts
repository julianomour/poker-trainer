import {
  dealTwoCardsPerPosition,
  formatHandShort,
} from './texas-holdem/deck.js';
import { getActionByGroupWithContext } from './texas-holdem/action.js';
import { getSklanskyGroup } from './texas-holdem/sklansky.js';
import type { SklanskyGroup } from './texas-holdem/sklansky.js';
import { Table } from './texas-holdem/table.js';
import {
  loadModelWeights,
  predictSklanskyGroup,
  DEFAULT_WEIGHTS_PATH,
} from './train-hand-strength.js';

async function main(): Promise<void> {
  const model = loadModelWeights(DEFAULT_WEIGHTS_PATH);
  const round = dealTwoCardsPerPosition(Table.positions);
  const handByPosition = new Map(
    round.map(({ position, hand }) => [position, hand])
  );

  const groupByPosition = new Map<string, SklanskyGroup>();
  for (const position of Table.clockwiseActionOrder) {
    const hand = handByPosition.get(position)!;
    const group: SklanskyGroup = model
      ? (predictSklanskyGroup(model, hand) as SklanskyGroup)
      : getSklanskyGroup(hand);
    groupByPosition.set(position, group);
  }

  // Helper: obtém grupo da mão consultando o modelo (usado a cada decisão).
  function getGroupForDecision(position: string): SklanskyGroup {
    const hand = handByPosition.get(position)!;
    return model
      ? (predictSklanskyGroup(model, hand) as SklanskyGroup)
      : getSklanskyGroup(hand);
  }

  // --- Sessão 1: Definição das cartas e força da mão ---
  console.log('--- Definição das cartas e força da mão ---');
  for (const position of Table.clockwiseActionOrder) {
    const hand = handByPosition.get(position)!;
    const group = groupByPosition.get(position)!;
    console.log(`${position} - ${formatHandShort(hand)} - grupo ${group}`);
  }

  // --- Sessão 2: Ação de todas as posições (fluxo horário: 1ª vez todas as posições, depois a mesma ordem com quem ainda está na mão) ---
  const actionOrder = Table.clockwiseActionOrder;
  const nPositions = actionOrder.length;

  let lastAction: 'fold' | 'call' | 'raise' | undefined;
  let lastPosition: string | undefined;
  let currentBet = Table.BB_BLIND;
  const amountIn = new Map<string, number>(
    Table.positions.map((p) => [p, Table.getInitialAmountIn(p)])
  );
  const stacks = new Map<string, number>(
    Table.positions.map((p) => [
      p,
      Table.STACK_DEFAULT - Table.getInitialAmountIn(p),
    ])
  );
  const folded = new Set<string>();
  let firstToActIndex = 0; // primeira posição no sentido horário (UTG)
  let lastAggressorIndex = nPositions - 1; // BB fecha a primeira rodada
  let raiseCount = 0; // número de raises na rua; após MAX_RAISES_PER_STREET só fold/call
  const actionByPosition = new Map<string, 'fold' | 'call' | 'raise'>();

  function allBetsEqual(): boolean {
    return actionOrder.every(
      (p) => folded.has(p) || (amountIn.get(p) ?? 0) === currentBet
    );
  }

  console.log('\n--- Ação de todas as posições (fluxo horário) ---');
  let done = false;
  let isFirstCycle = true;
  while (!done) {
    if (!isFirstCycle) {
      if (allBetsEqual()) {
        done = true;
        break;
      }
      // Posição que "recebe" a volta = anterior ao primeiro não-folded que vai agir (mesa rodou até ela)
      let firstNonFoldedIdx = firstToActIndex;
      for (let k = 0; k < nPositions; k++) {
        const j = (firstToActIndex + k) % nPositions;
        if (!folded.has(actionOrder[j])) {
          firstNonFoldedIdx = j;
          break;
        }
      }
      const returnToPosition = actionOrder[(firstNonFoldedIdx - 1 + nPositions) % nPositions];
      console.log(`\n--- Ação volta para ${returnToPosition} ---`);
    }
    isFirstCycle = false;
    const roundStartIndex = firstToActIndex;
    for (let i = 0; i < nPositions; i++) {
      const idx = (roundStartIndex + i) % nPositions;
      const position = actionOrder[idx];
      if (folded.has(position)) continue;

      // Cada decisão: identifica ação anterior, consulta o modelo (pesos) e determina a ação.
      const group = getGroupForDecision(position);
      let action = getActionByGroupWithContext(
        group,
        position,
        lastAction,
        lastPosition
      );
      if (action === 'raise' && raiseCount >= Table.MAX_RAISES_PER_STREET) {
        action = 'call';
      }
      if (action !== 'fold') {
        lastAction = action;
        lastPosition = position;
      }
      actionByPosition.set(position, action);

      const { cost, nextBet, newAmountIn } = Table.getCostAndNextBet(
        position,
        action,
        currentBet,
        amountIn
      );
      const prevBet = currentBet;
      let effectiveAction = action;
      let effectiveCost = cost;
      let effectiveNextBet = nextBet;
      const effectiveAmountIn = new Map(newAmountIn);

      const stackNow = stacks.get(position) ?? Table.STACK_DEFAULT;
      const inThisPosition = amountIn.get(position) ?? Table.getInitialAmountIn(position);

      if (action === 'raise' && nextBet <= prevBet) {
        effectiveAction = 'call';
        effectiveCost = prevBet - inThisPosition;
        effectiveNextBet = prevBet;
        effectiveAmountIn.set(position, prevBet);
        lastAction = 'call';
        lastPosition = position;
      } else if (action === 'raise' && cost > stackNow) {
        effectiveCost = stackNow;
        effectiveNextBet = inThisPosition + stackNow;
        effectiveAmountIn.set(position, effectiveNextBet);
      } else if (action === 'call' && cost > stackNow) {
        effectiveCost = stackNow;
        effectiveNextBet = inThisPosition + stackNow;
        effectiveAmountIn.set(position, effectiveNextBet);
      }

      if (effectiveAction === 'raise' && effectiveNextBet <= prevBet) {
        effectiveAction = 'call';
        lastAction = 'call';
        lastPosition = position;
      }

      currentBet = effectiveNextBet;
      effectiveAmountIn.forEach((v, p) => amountIn.set(p, v));
      const stackAfter = (stacks.get(position) ?? Table.STACK_DEFAULT) - effectiveCost;
      stacks.set(position, stackAfter);

      if (effectiveAction === 'fold') folded.add(position);
      if (effectiveAction === 'raise' && effectiveNextBet > prevBet) {
        raiseCount += 1;
        lastAggressorIndex = idx;
        firstToActIndex = (idx + 1) % nPositions;
      }

      actionByPosition.set(position, effectiveAction);

      const foldCost = Table.getFoldCost(position);
      const foldInfo =
        foldCost > 0
          ? ` | stack=${stackAfter} fold_custa=${foldCost}`
          : ` | stack=${stackAfter}`;
      console.log(`${position} - ${effectiveAction} (custo ${effectiveCost})${foldInfo}`);

      if (folded.size >= nPositions - 1) {
        done = true;
        break;
      }
      if (idx === lastAggressorIndex && allBetsEqual()) {
        done = true;
        break;
      }
    }
    if (done) break;
    // Ação circular: após um raise, a próxima posição age; quando se fecha no BB (ou último agressor), volta para quem estava na frente do raise
  }

  // --- Sessão 3: Resultado final (1 vencedor ou apostas equivalentes) ---
  const potTotal = Array.from(amountIn.values()).reduce((a, b) => a + b, 0);
  const remaining = actionOrder.filter((p) => !folded.has(p));
  console.log('\n--- Resultado final ---');
  console.log(`Pote: ${potTotal}`);
  if (remaining.length === 1) {
    console.log(`Vencedor (sem showdown): ${remaining[0]}`);
  } else {
    console.log(`Apostas iguais (${currentBet}); jogadores no showdown: ${remaining.join(', ')}`);
  }
  for (const position of Table.clockwiseActionOrder) {
    const stack = stacks.get(position) ?? 0;
    const action = actionByPosition.get(position) ?? 'fold';
    const status = folded.has(position) ? 'fold' : 'ativo';
    console.log(`${position} - stack ${stack} - ${action} - ${status}`);
  }

  if (!model) {
    console.log(
      '\n(Dica: rode "pnpm run train" para treinar e salvar o modelo; os grupos Sklansky estão sendo usados pelas regras.)'
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
