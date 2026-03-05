# Resume do chat – Poker Trainer (pré-flop)

## Objetivo geral
Ajustes no fluxo de decisões pré-flop: custos por decisão, atualização de stacks, múltiplas voltas de ação até um vencedor ou apostas iguais, e apresentação em fluxo horário com ação circular.

---

## 1. Custos incrementais e raise fixo
- **Raise de abertura:** 2,5× BB (constante `RAISE_TO_FIRST = 2.5`).
- **Re-raise:** 7,5 (constante `RAISE_TO_SECOND = 7.5`).
- Para cada posição, na ordem de ação:
  - **Fold:** custo 0 (exceto SB/BB, que já tiveram blind descontado no stack inicial).
  - **Call:** custo = valor atual a igualar − valor já colocado na rua.
  - **Raise:** custo = próximo nível (2,5 ou 7,5) − valor já colocado.

## 2. Stack após cada ação
- Stacks iniciais: SB = 99,5, BB = 99, demais = 100 (blinds já descontados para SB/BB).
- Após cada decisão o custo é descontado do stack da posição; resultado final usa stacks atualizados.

## 3. Saída em 3 sessões
- **Sessão 1 – Definição das cartas e força da mão:** uma linha por posição (ordem horária): `posição - cartas - grupo N`.
- **Sessão 2 – Ação de todas as posições:** decisões no fluxo horário, com separador quando a ação volta para a primeira posição.
- **Sessão 3 – Resultado final:** pote, vencedor único ou jogadores no showdown, e por posição: stack final, última ação, status (fold/ativo).

## 4. Múltiplas voltas até fim da rua
- Ação continua até: **um único jogador restante** (vitória sem showdown) ou **apostas iguais** (todos ainda na mão com o mesmo valor na rua).
- Ordem de ação sempre no **sentido horário** (UTG → … → BB); quem foldou é pulado.
- Quando alguém dá **raise**, a próxima posição a falar é a seguinte no sentido horário; após o último agressor (ex.: BB) agir, a ação **volta** para a primeira posição do ciclo (ex.: UTG).

## 5. Correções de lógica e exibição
- **Raise que não sobe:** se a aposta já está em 7,5 e o jogador “raise”, tratar e exibir como **call** (custo 0 ou valor para igualar).
- **Evitar mesma posição duas vezes seguidas:** uso de `roundStartIndex` fixo no início de cada ciclo, para que `idx` não repita ao atualizar `firstToActIndex` no meio do loop.
- **Conceito de rodada:** removido “Rodada 1 / Rodada 2”; em vez disso, separador **“--- Ação volta para {posição} ---”** quando a ação circular retorna para a primeira posição a falar no ciclo.

## 6. Arquivos alterados
- **`src/texas-holdem/table.ts`:**  
  `RAISE_TO_FIRST`, `RAISE_TO_SECOND`, `getInitialAmountIn`, `getNextRaiseTo`, `getCostAndNextBet` (fold/call/raise com custos e próximo bet), `clockwiseActionOrder` e comentários sobre fluxo horário.
- **`src/index.ts`:**  
  Estado da rua (currentBet, amountIn, stacks, folded), loop de ação com ciclos e `roundStartIndex`, normalização raise→call quando nextBet ≤ prevBet, exibição em 3 sessões e separador “Ação volta para X”.

## 7. Commit e push
- Commit: `feat: custos incrementais pré-flop, stacks, fluxo circular e ação volta para primeira posição`
- Branch: `feat/create-texas-holdem-deck`
- Push realizado para o remoto.
