# poker-trainer

Backend de treino e classificação de força de mão pré-flop para Texas Hold'em. Gera mãos aleatórias por posição, classifica-as por regras (pair/suited/off suited × strong/weak) e opcionalmente usa um modelo TensorFlow.js treinado para prever a categoria.

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
- Se o arquivo não existir ou estiver corrompido, o `start` usa apenas as regras de classificação (sem modelo).
- Treino: entrada = vetor one-hot da mão (34 dims), saída = 6 categorias (pair/suited/off suited × strong/weak).

## Treino configurável

Você pode alterar amostras, épocas e fração de validação por **variáveis de ambiente** ou **argumentos de CLI**:

- **Env**: `TRAIN_SAMPLES`, `TRAIN_EPOCHS`, `TRAIN_VALIDATION_SPLIT` (ex.: `TRAIN_SAMPLES=50000 TRAIN_EPOCHS=30 pnpm run train`).
- **CLI**: `pnpm run train -- --samples 50000 --epochs 30 --validation-split 0.15`.

Valores padrão: 30.000 amostras, 20 épocas, 20% validação.

## Estrutura principal

- `src/texas-holdem/`: baralho, regras de classificação, posições da mesa.
- `src/train-hand-strength.ts`: criação do modelo, treino, carga/salvamento de pesos, previsão.
- `src/run-train.ts`: script de treino (env/CLI).
- `src/index.ts`: entrada do trainer (gera mãos e exibe força por posição).
- `tests/unit/`: testes unitários (deck, rules, table, train-hand-strength, config).
