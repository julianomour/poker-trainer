import {
  dealTwoCardsPerPosition,
  formatHandShort,
} from './texas-holdem/deck.js';
import { TexasHoldem } from './texas-holdem/rules.js';
import { Table } from './texas-holdem/table.js';
import {
  loadModelWeights,
  predictHandStrength,
  DEFAULT_WEIGHTS_PATH,
} from './train-hand-strength.js';

async function main(): Promise<void> {
  const model = loadModelWeights(DEFAULT_WEIGHTS_PATH);
  const round = dealTwoCardsPerPosition(Table.positions);
  const lines = round.map(({ position, hand }) => {
    const strength = model
      ? predictHandStrength(model, hand)
      : TexasHoldem.classifyHand(hand);
    return `${position} - ${formatHandShort(hand)} - ${strength[0]} ${strength[1]}`;
  });
  console.log(lines.join('\n'));
  if (!model) {
    console.log(
      '\n(Dica: rode "pnpm train" para treinar e salvar o modelo; a força está sendo definida pelas regras.)'
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
