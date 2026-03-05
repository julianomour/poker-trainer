# Objetivo do projeto — Poker Trainer (para quem não joga poker)

Este documento explica **o que é o projeto** e **os conceitos básicos de poker** necessários para entendê-lo, sem assumir que você já sabe jogar.

---

## O que é poker Texas Hold'em (bem resumido)

No **Texas Hold'em**, cada jogador recebe **duas cartas fechadas** (só ele vê). Depois, cartas comunitárias são reveladas na mesa em etapas (flop, turn, river). O objetivo é formar a melhor combinação de cinco cartas usando as suas duas + as da mesa, ou fazer os outros desistirem antes disso.

- **Pote:** dinheiro (ou fichas) que todos apostam durante a mão. Quem ganha leva o pote.
- **Posição na mesa:** a ordem em que os jogadores agem importa. Quem age por último tem vantagem (já viu o que os outros fizeram).

Este projeto foca **só na primeira fase**: quando cada um ainda tem apenas as duas cartas na mão e ainda **não** foram reveladas cartas na mesa. Essa fase se chama **pré-flop**.

---

## O que é “pré-flop”

**Pré-flop** = o momento em que cada jogador só conhece as **duas cartas** que recebeu. Ainda não há cartas comunitárias na mesa.

Nessa fase, cada jogador decide:

- **Fold (desistir):** sai da mão e perde o que já colocou (se colocou algo).
- **Call (pagar):** iguala a aposta atual e continua na mão.
- **Raise (aumentar):** aumenta a aposta; os outros precisam pagar esse valor (ou mais) para continuar.
- **Check (passar):** quando não há nada a pagar naquele momento (ex.: Big Blind quando todos só igualaram a aposta obrigatória).

O projeto simula exatamente essas decisões pré-flop: quem age em que ordem, quanto custa cada ação e quando a rodada de apostas termina (um vencedor ou todos com a mesma aposta).

---

## O que é “posição” e por que importa

A **posição** é o lugar do jogador na mesa em relação à ordem de ação. Em geral, a ordem é:

**UTG → UTG+1 → UTG+2 → MP → HJ → CO → BTN → SB → BB**

- **UTG** (Under The Gun): primeiro a agir — desvantagem, pois não sabe o que os outros vão fazer.
- **BTN** (Button / botão): um dos últimos a agir — vantagem, pois já viu a maioria das decisões.
- **SB** (Small Blind) e **BB** (Big Blind): apostas obrigatórias antes de ver as cartas; o BB é o último a agir na primeira rodada de apostas.

Quanto **pior** a posição (agir cedo), mais **seletivo** o jogador deve ser com as mãos. Quanto **melhor** a posição (agir tarde), mais mãos podem ser jogadas. O projeto usa essa ideia para decidir, por posição, se a mão é forte o suficiente para **fold**, **call** ou **raise**.

---

## O que é “força da mão” (grupos Sklansky)

Nem todas as combinações de duas cartas são igualmente boas. O projeto usa os **grupos de Sklansky** (1 a 8):

- **Grupo 1:** as melhores mãos (ex.: AA, KK).
- **Grupo 8:** as mais fracas (ex.: mãos que normalmente você desistiria).

Assim, cada “mão inicial” (duas cartas) é classificada em um grupo. A decisão (fold/call/raise) depende desse grupo **e** da posição: por exemplo, uma mão do grupo 5 pode ser “raise” no botão, mas “fold” em UTG.

---

## O que este projeto faz

O **Poker Trainer** é um **backend** (sem interface gráfica) que:

1. **Simula uma mão pré-flop:** sorteia duas cartas para cada posição na mesa (SB, BB, UTG, etc.).
2. **Classifica a força de cada mão** usando os grupos Sklansky (1–8), por **regras fixas** ou, se configurado, por um **modelo de machine learning** treinado (TensorFlow.js).
3. **Decide a ação** (fold / call / raise / check) de cada jogador na ordem correta (fluxo horário), com custos e atualização de fichas (stack).
4. **Pode usar um segundo modelo** treinado para decidir a ação (fold/call/raise) a partir da mão e do contexto (posição, ação anterior, stack, etc.), em vez de só regras.

Ou seja: o projeto **gera cenários de pré-flop**, **avalia a força da mão** e **simula as decisões** até haver um vencedor ou todos com a mesma aposta, exibindo o resultado em texto (cartas, grupo, ações e stacks).

---

## Como “enxergar” o projeto sem saber jogar

- **Entrada:** uma “mesa” com 9 posições; cada uma recebe duas cartas aleatórias.
- **Processamento:**  
  - Classificação da força (grupo 1–8).  
  - Para cada jogador, na ordem da mesa: decisão fold/call/raise/check, custo e atualização do pote e das fichas.
- **Saída:**  
  - Sessão 1: cartas e grupo de cada posição.  
  - Sessão 2: ação de cada posição (ex.: “UTG - fold”, “BB - check”).  
  - Sessão 3: pote, vencedor (ou empatados) e stack final de cada um.

Assim, mesmo sem saber poker, você pode entender que o sistema está **treinando/avaliando decisões automáticas** para a fase inicial do jogo, com base em regras e, opcionalmente, em modelos de ML.

---

## Como rodar (resumo)

- **Instalar:** `pnpm install`
- **Simular uma mão:** `pnpm start` (roda em modo watch; a cada execução mostra uma mão completa).
- **Treinar o modelo de força da mão (grupos):** `pnpm run train` (gera `model-weights.json`).
- **Treinar o modelo de decisão (fold/call/raise):** `pnpm run train:decision` (gera `decision-model-weights.json`).

Detalhes de comandos e estrutura estão no [README.md](./README.md).

---

## Resumo em uma frase

**O Poker Trainer é um simulador de decisões pré-flop em Texas Hold'em que classifica a força das mãos (grupos Sklansky) e decide automaticamente fold, call, raise ou check por posição, usando regras e/ou modelos de machine learning treinados.**
