import {
  dealTwoCardsPerPosition,
  formatHandShort,
} from './texas-holdem/deck.js';
import { getActionByGroupWithContext } from './texas-holdem/action.js';
import { getSklanskyGroup } from './texas-holdem/sklansky.js';
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

  let lastAction: 'fold' | 'call' | 'raise' | undefined;
  let lastPosition: string | undefined;
  const lines = Table.preflopActionOrder.map((position) => {
    const hand = handByPosition.get(position)!;
    const group = model
      ? predictSklanskyGroup(model, hand)
      : getSklanskyGroup(hand);
    const action = getActionByGroupWithContext(
      group,
      position,
      lastAction,
      lastPosition
    );
    if (action !== 'fold') {
      lastAction = action;
      lastPosition = position;
    }
    const stack = Table.getStack(position);
    const foldCost = Table.getFoldCost(position);
    const foldInfo =
      foldCost > 0 ? ` | stack=${stack} fold_custa=${foldCost}` : ` | stack=${stack}`;
    return `${position} - ${formatHandShort(hand)} - grupo ${group} - ${action}${foldInfo}`;
  });
  console.log(lines.join('\n'));
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
