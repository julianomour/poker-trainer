# poker-trainer

Backend de treino e classificação de força de mão pré-flop para Texas Hold'em. Usa os **grupos Sklansky (1–8)** definidos em `src/grupo de mãos poker por posição.md`: gera mãos por posição, classifica por grupo e decide a ação (fold/call/raise) com base no grupo e na posição. Opcionalmente um modelo TensorFlow.js treinado prevê o grupo (8 classes).

## Pré-requisitos

- Node.js 18+
- pnpm (recomendado)

## Instalação

```bash
pnpm install
```

## Comandos

| Comando | Descrição |
|--------|-----------|
| `pnpm install` | Instala dependências |
| `pnpm build` | Compila TypeScript para `dist/` |
| `pnpm start` | Roda o trainer em modo watch (gera mãos por posição e exibe força) |
| `pnpm run start:prod` | Roda a partir de `dist/` (requer `pnpm build` antes) |
| `pnpm run train` | Treina o modelo e salva os pesos em `model-weights.json` |
| `pnpm test` | Compila e executa os testes unitários |
| `pnpm lint` | Verifica tipos com `tsc --noEmit` e executa ESLint |
| `pnpm run format` | Formata código com Prettier |

## Modelo e pesos

- **Pesos**: salvos na raiz do projeto em `model-weights.json` após `pnpm run train`.
- Se o arquivo não existir ou estiver corrompido, o `start` usa os grupos Sklansky por regra (sem modelo).
- **Força da mão**: definida pelos **grupos Sklansky (1–8)** conforme `src/grupo de mãos poker por posição.md` (UTG/early = 1–3, MP = 1–5, CO/BTN = 1–7, SB/BB = 1–8). O **modelo** prevê o grupo (8 classes). A **ação** é decidida por `getActionByGroup(grupo, posição)`: fold se grupo > max da posição; raise se grupo 1–2; call se 3–max.

## Treino configurável

Você pode alterar amostras, épocas e fração de validação por **variáveis de ambiente** ou **argumentos de CLI**:

- **Env**: `TRAIN_SAMPLES`, `TRAIN_EPOCHS`, `TRAIN_VALIDATION_SPLIT` (ex.: `TRAIN_SAMPLES=50000 TRAIN_EPOCHS=30 pnpm run train`).
- **CLI**: `pnpm run train -- --samples 50000 --epochs 30 --validation-split 0.15`.

Valores padrão: 30.000 amostras, 20 épocas, 20% validação.

## Estrutura principal

- `src/texas-holdem/`: baralho, regras (pair strong 88+), **sklansky** (grupos 1–8, getSklanskyGroup, getMaxGroupForPosition), posições, **action** (getAction, getActionByGroup, getActionWithContext), **range**.
- `src/grupo de mãos poker por posição.md`: tabela Sklansky e recomendações por posição.
- `src/train-hand-strength.ts`: modelo 8 classes (grupos Sklansky), treino, predictSklanskyGroup, predictHandStrength (compat).
- `src/run-train.ts`: script de treino (env/CLI).
- `src/index.ts`: entrada do trainer (grupo + ação por posição).
- `tests/unit/`: testes (deck, rules, table, action, range, sklansky, train-hand-strength, config).
