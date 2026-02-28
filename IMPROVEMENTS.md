# Pontos de melhoria – poker-trainer

Reavaliação do projeto com base nas regras de TDD, code review, clean code e boas práticas.

---

## Crítico

### 1. Teste quebrado (config inexistente)

- **Problema**: `tests/unit/config.test.ts` importa `src/config/index.js`, que não existia.
- **Ação**: Criado `src/config/index.ts` com `config.port` (env `PORT` ou 3000) para o teste passar e preparar uso futuro (Express). Se não for usar HTTP ainda, pode remover o teste e a pasta `config` depois.

### 2. Cobertura de testes insuficiente

- **Problema**: Não há testes para o núcleo do projeto: `deck.ts`, `rules.ts`, `table.ts`, `train-hand-strength.ts`, `tensorflow-patterns.ts`.
- **Ação sugerida** (TDD):
  - **deck**: testes para `randomHand` (2 cartas distintas), `formatHandShort`, `dealTwoCardsPerPosition` (N posições = N mãos, 2N cartas distintas).
  - **rules**: testes para `classifyHand` — pares strong/weak (JJ vs 22), suited strong/weak (AKs vs 72s), offsuit strong/weak; e `handStrengthToOneHot` para cada categoria.
  - **table**: `getPositionWeight` para posição conhecida e desconhecida; `randomPosition` retorna valor em `positions`.
  - **train-hand-strength**: testes para `createModel` (shape da entrada/saída), `predictHandStrength` com modelo carregado (ou mock); opcionalmente integração com pesos salvos.

---

## Importante

### 3. Dependências não utilizadas

- **Problema**: `express` e `zod` estão em `package.json` mas não são usados em `src/`.
- **Ação**: Remover com `pnpm remove express @types/express zod` até haver API HTTP, ou adicionar um endpoint mínimo que use ambos (ex.: GET /health e validação de body com zod).

### 4. Tipagem de categorias de mão

- **Problema**: `HandStrengthCategory = readonly [string, string]` permite qualquer string; erros de digitação não são pegos em compile.
- **Ação**: Usar unions: `type HandType = 'pair' | 'suited' | 'off suited'; type HandLevel = 'strong' | 'weak'; type HandStrengthCategory = readonly [HandType, HandLevel];` e tipar `hand_strength` e retornos com esses tipos.

### 5. Validação em `dealTwoCardsPerPosition`

- **Problema**: Se `positions.length > 26`, o baralho (52 cartas) não tem cartas suficientes para 2 por posição; o código usa `deck[n + i]` e pode acessar índice inválido ou repetir cartas conceitualmente (na prática 9 posições = 18 cartas, ok).
- **Ação**: Validar `positions.length <= 26` no início da função ou documentar que o máximo é 26 posições; lançar erro claro se exceder.

### 6. Tratamento de erro em `loadModelWeights`

- **Problema**: `JSON.parse(raw)` pode lançar se o arquivo estiver corrompido; não há try/catch nem mensagem amigável.
- **Ação**: Envolver em try/catch e retornar `null` ou lançar `new Error('Invalid model-weights.json: ...')` com cause para facilitar debug.

---

## Sugestões

### 7. Script de treino configurável

- **Problema**: `run-train.ts` usa valores fixos (30_000 amostras, 20 épocas); não há como alterar sem editar código.
- **Ação**: Ler variáveis de ambiente (ex.: `TRAIN_SAMPLES`, `TRAIN_EPOCHS`) ou argumentos de CLI (ex.: `tsx src/run-train.ts --samples 50000 --epochs 30`) e repassar para `trainHandStrengthModel`.

### 8. Nomenclatura “suited”

- **Problema**: Em inglês de poker o termo é “suited”; o projeto usava “suitted” por legado.
- **Ação**: ✅ Normalizado para “suited” e “off suited” em regras, SKILL, reference, testes e README.

### 9. Estrutura em camadas

- **Problema**: A regra “best-practices” sugere `config`, `domain`, `application`, `infrastructure`; o código está em estrutura mais plana (`texas-holdem/`, `train-hand-strength.ts`, etc.).
- **Ação**: Para o tamanho atual pode permanecer assim. Quando crescer (API, mais casos de uso), reorganizar em `src/domain/`, `src/application/`, `src/infrastructure/`, `src/config/`.

### 10. README e documentação

- **Problema**: Não há README com instruções de uso.
- **Ação**: Adicionar README com: descrição do projeto; pré-requisitos (Node 18+); comandos `pnpm install`, `pnpm train`, `pnpm start`, `pnpm test`; onde ficam pesos do modelo e o que cada script faz; opcionalmente link para SKILLS.md / tabelas de ranges.

### 11. Linter e formatação

- **Problema**: Apenas `tsc --noEmit` no lint; sem ESLint nem Prettier.
- **Ação**: Adicionar ESLint (typescript-eslint) e Prettier com script `lint`/`format` para manter estilo alinhado às regras de clean code.

---

## Resumo prioritário

| Prioridade | Item | Ação |
|------------|------|------|
| Crítico | Teste config | ✅ Resolvido com `src/config/index.ts` |
| Crítico | Testes do core | Adicionar testes para deck, rules, table (e opcionalmente train) |
| Importante | express/zod | Remover ou usar em um endpoint mínimo |
| Importante | HandStrengthCategory | Tipar com unions |
| Importante | dealTwoCardsPerPosition | Validar/documentar max posições |
| Importante | loadModelWeights | try/catch em JSON.parse |
| Sugestão | run-train CLI/env | Variáveis de ambiente ou args |
| Sugestão | README | Criar com comandos e visão geral |
| Sugestão | ESLint/Prettier | Configurar e rodar no CI/local |
