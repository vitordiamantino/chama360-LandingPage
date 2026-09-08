# Reformulação do quiz de diagnóstico da CHAMA

Data: 2026-09-08
Estado: v2, com as decisões do Vitor incorporadas. Falta só a redação final das perguntas.
Companion de `2026-09-08-diagnostico-documento-e-fonte-home-design.md`.

## O que muda, em uma frase

A pergunta "quem responde o WhatsApp hoje?" sai, e entra no lugar dela uma pergunta que bate
direto na perda de cliente. Todo o resto do quiz continua igual.

## Regras travadas pelo Vitor

1. **7 perguntas**, em todos os nichos. Não muda.
2. **No máximo 5 respostas por pergunta.** A pergunta 1 (profissão) é exceção: é um seletor
   que roteia o nicho, não uma pergunta de diagnóstico.
3. **Nenhuma dor pode sumir.** Cada profissão continua com as perguntas dela, sob medida.
4. A pergunta que sai para abrir vaga é a **"quem responde o WhatsApp?"** (`quemResponde`).
5. "Bater no desejo" e a intenção de compra ficam no diagnóstico do fim, não numa pergunta.

## Por que quase nada precisa mudar

Com o limite em 5, as perguntas de hoje já cabem: a maioria tem 4 respostas e a de "quantos
escapam por semana" tem 5. O limite não força corte nenhum.

E `quemResponde` é a pergunta mais barata de perder: das 4 respostas dela, só uma
(`ninguem`) marca dor, e essa dor já é marcada por outra pergunta em todos os quizzes. Sair
ela não apaga nenhuma dor de nenhum nicho.

## O quiz genérico (camada 2 e quem escolhe "outra profissão")

### A consequência que precisa ser resolvida

No genérico, era o `quemResponde` que decidia o caminho do quiz:

- respondeu "só eu" → o quiz seguia investigando **tempo de resposta** (dor `demora`)
- respondeu "uma equipe" → o quiz seguia investigando **dono da conversa** (dor `sem_dono`)

Sem essa pergunta, a dor `sem_dono` nunca seria marcada e o quiz genérico perderia uma das
suas 4 dores, o que contraria a regra 3.

**Solução:** a pergunta nova não pergunta só *se* perde, pergunta *por que* perde. O motivo
escolhe o caminho. Fica mais assertiva do que perguntar o tamanho da equipe, e mantém a
árvore inteira de pé.

### As 7 perguntas

**1. profissao** (exceção, sem mudança)

> Pra começar: o que você faz?

18 opções. Roteia o nicho e o vocabulário. Segue para `perdeCliente`.

**2. perdeCliente** (NOVA, entra no lugar do `quemResponde`)

> Você perde {cliente} no WhatsApp sem nem perceber?

| resposta | marca a dor | leva para |
|---|---|---|
| Não, dou conta de responder todo mundo | | `depoisQue` |
| Demoro pra responder e a pessoa já foi | `demora` | `tempoResposta` |
| Somos vários e a conversa acaba sem dono | `sem_dono` | `divisao` |
| A pessoa some depois do orçamento e eu não puxo | `sem_retomada` | `depoisQue` |
| Não sei dizer, nunca contei | `cegueira` | `tempoResposta` |

Cinco respostas, no limite. Quem responde "não sei dizer" cai no caminho de tempo, que é o
mais comum, e a cegueira dele é confirmada mais adiante na pergunta 6.

**3A. tempoResposta** (caminho tempo)

> Quando {espera} te chama, quanto tempo passa até você responder?

Ajuda: "Vale a média de um dia comum, não o seu melhor dia."

| resposta | marca |
|---|---|
| Minutos, respondo quase na hora | |
| Uma ou duas horas | |
| Só quando eu paro, geralmente à noite | `demora` |
| Às vezes só no dia seguinte | `demora` |

Quem marcou `demora` segue para `esquecimento`; o resto para `depoisQue`.

**3B. divisao** (caminho dono da conversa)

> Como vocês dividem quem atende quem?

| resposta | marca |
|---|---|
| Quem vê primeiro responde | `sem_dono` |
| Cada um tem o próprio número | |
| Tem uma divisão combinada entre a gente | |
| Não tem regra nenhuma | `sem_dono` |

Quem marcou `sem_dono` segue para `atropelo`; o resto para `depoisQue`.

**4A. esquecimento**

> Já aconteceu de você ver a mensagem enquanto estava {ocupado}, pensar "respondo daqui a
> pouco" e só lembrar no outro dia?

Toda semana (`demora`) · Já aconteceu algumas vezes (`demora`) · Não, isso não acontece comigo

**4B. atropelo**

> Já aconteceu de duas pessoas responderem o mesmo {cliente}, ou de ninguém responder porque
> cada um achou que o outro tinha respondido?

Toda semana (`sem_dono`) · Já aconteceu algumas vezes (`sem_dono`) · Não, isso não acontece aqui

**4C. depoisQue**

> Depois que o {cliente} responde, o que acontece?

Ajuda: "Pensa no caminho mais comum, do primeiro oi até fechar."

Já agendo ou fecho ali mesmo · Mando valor ou proposta e espero ele voltar (`sem_retomada`) ·
Anoto num caderno ou numa planilha · Se ele não voltar, acaba ficando por isso mesmo
(`sem_retomada`)

**5. quantos** (sem mudança, 5 respostas, no limite)

> Numa semana comum, quantas pessoas te chamam e não fecham nada?

Até 5 · De 6 a 15 · De 16 a 30 · Mais de 30 · Não faço ideia (`cegueira`)

Quem respondeu "não faço ideia" segue para `cegueira`; o resto para `retomada`.

**6A. cegueira**

> E se eu te perguntar quantos {plural} novos vieram do Instagram no mês passado, você
> consegue me dizer agora?

Consigo, sei o número · Mais ou menos, por cima (`cegueira`) · Não, não tenho como saber (`cegueira`)

**6B. retomada**

> E com quem não fechou, você faz alguma coisa depois?

Chamo de novo depois de um tempo · Mando promoção de vez em quando (`sem_retomada`) · Nada,
fica por isso mesmo (`sem_retomada`)

**7. ferramenta** (sem mudança)

> Hoje você usa alguma ferramenta pra organizar esse atendimento?

Só o WhatsApp normal · WhatsApp Business · Já testei um CRM e larguei · Uso um CRM hoje

Nenhuma marca dor: é contexto. Alimenta o ponto forte do diagnóstico ("você já tentou
organizar") e a objeção que vira argumento na call (quem largou um CRM largou por
implantação, e a implantação da CHAMA é nossa).

**`FAIXAS` não muda.** Continuam as 4 faixas de hoje, porque a pergunta 5 continua com 5
respostas.

## Os nichos: troca de uma pergunta só

Em todo nicho, a primeira pergunta depois da profissão é `quemResponde`. Ela sai, e entra a
pergunta de perda na linguagem daquele nicho. As outras 5 perguntas do nicho não mudam, e as
6 dores continuam todas cobertas.

Nichos usam lista linear, sem ramificação, então a pergunta nova não precisa rotear nada:
só marcar dor.

### Personal Trainer

| # | pergunta | muda? |
|---|---|---|
| 1 | profissão | não |
| 2 | **Você perde aluno no WhatsApp antes de fechar o plano?** Não, dou conta · Demoro pra responder e ele já fechou com outro (`timing_direct`) · Fica tudo junto e eu perco o fio (`sem_funil`) · Pergunta o valor, some e eu não puxo (`plano_sem_fechar`) · Não sei dizer (`cegueira`) | **entra no lugar de `quemResponde`** |
| 3 | tempoPlano | não |
| 4 | separaAluno | não |
| 5 | sumiuValor | não |
| 6 | evasao | não |
| 7 | quantosMes | não |

As 6 dores do Personal continuam: `cegueira`, `timing_direct`, `sem_funil`,
`plano_sem_fechar`, `renovacao_cega`, `agenda_no_zap`. Nada cortado.

### Corretor de Imóveis

| # | pergunta | muda? |
|---|---|---|
| 1 | profissão | não |
| 2 | **Você perde lead no WhatsApp sem nem perceber?** Não, respondo todos · Outro corretor responde antes de mim (`corrida_do_primeiro`) · Atendo o curioso e deixo o comprador esperando (`lead_sem_triagem`) · O cliente não gostou do imóvel e sumiu (`imovel_errado_fim`) · Não sei dizer (`cegueira`) | **entra no lugar de `quemResponde`** |
| 3 | tresAoMesmoTempo | não |
| 4 | perdeuPorAtraso | não |
| 5 | visitaFurada | não |
| 6 | naoGostou | não |
| 7 | origemLead | não |

As 6 dores do Corretor continuam. Nada cortado.

### Os outros 4 nichos

Dentista, Corretor de Seguros, Veterinário e Oficina seguem exatamente o mesmo padrão: a
pergunta 2 vira a de perda, na linguagem do nicho, com até 5 respostas apontando para as
dores que aquele nicho já tem. Escrevo as quatro na leva seguinte, depois que você aprovar a
redação das duas acima.

## O que muda no código

1. **`quiz-dados.js`**: `quemResponde` sai do genérico e dos 6 nichos. `perdeCliente` entra.
   No genérico ela ganha `proxima()` com o roteamento da tabela acima. Nos nichos é uma
   pergunta linear comum.
2. **`abordagem.js`**: o mapa `QUEM_RESPONDE` (que vira a frase "hoje é só você respondendo
   o WhatsApp" na mensagem pronta) perde a fonte. Vira um mapa `PERDE_CLIENTE`, citando o
   motivo que a pessoa marcou. Fato mais forte de citar do que o tamanho da equipe.
3. **`api/quiz.js`**: as colunas da aba mestre são posicionais, a contagem não muda. O
   cabeçalho das abas de nicho é o texto da pergunta e `garantirAba` só cria uma vez: abas já
   existentes ficam com o texto antigo no cabeçalho, dados novos entram alinhados pela
   posição. Sem quebra, mas fica registrado.
4. **`test-quiz.mjs`**: os percursos da árvore mudam. Guards novos: nenhuma pergunta com mais
   de 5 respostas (profissão é a exceção declarada), e toda dor de todo nicho continua
   alcançável por algum caminho do quiz (é o teste que prova a regra 3 do Vitor).
5. **`verificar-visual.mjs`**: os seletores seguem, os percursos gravados mudam.

## Falta só de você

A redação final. As perguntas e respostas acima estão com a intenção certa, não
necessariamente com as suas palavras. Marca o que quiser diferente e eu ajusto antes de
escrever código.
