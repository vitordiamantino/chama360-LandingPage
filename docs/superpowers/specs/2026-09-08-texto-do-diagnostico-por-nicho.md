# Texto do diagnóstico da CHAMA, por nicho

Data: 2026-09-08
Estado: rascunho para o gate do Vitor. Vira dado em `plano.js`, não vai para o ar antes da
aprovação. Companion de `2026-09-08-diagnostico-documento-e-fonte-home-design.md`.

Os 7 quizzes estão cobertos: Genérico, Personal, Corretor, Dentista, Corretor de Seguros,
Veterinário e Oficina. Já passou pela skill `copy-editing` (sete passadas) e pelo painel de
avaliação de 4 personas (ver o fim do documento).

## O que este documento é

O diagnóstico que aparece no fim do `/diagnostico`, no lugar da VSL. É montado por regra a
partir das dores que o quiz detectou. Segue 6 movimentos. Este documento traz o texto de
cada movimento.

Barra de qualidade, aplicada a toda frase:
- Ou é fato que o lead deu, ou é capacidade real da CHAMA. Nada no meio.
- Nenhum número que o lead não deu. Nenhuma estatística. Nenhum resultado de cliente (não
  temos depoimento, mesmo bloqueio da home-nova).
- Fala a língua do nicho.
- O plano é nomeado pelo resultado ("cada conversa com um dono"), não pela feature ("módulo
  de CRM").
- Termina em uma ação só: marcar a conversa de 20 minutos.

**Estrutura de cada parágrafo de dor (movimento 2+3):** a primeira metade é insight puro,
sem citar a CHAMA, para o lead cético sentir que o diagnóstico foi útil mesmo se ele não
comprar. A CHAMA entra só na última frase, na virada para o desejo. Vale como regra.

**Orçamento de tamanho:** depois de 7 perguntas, o lead está cansado. A tela mostra no
máximo 3 dores (as 3 primeiras de `ordemDores`), as 3 fases num bloco compacto, e a
evidência com no máximo 3 itens. O PDF do `/relatorio` carrega a versão completa.

---

## Blocos compartilhados (iguais em todo nicho, trocando o vocabulário)

`{cliente}`, `{plural}`, `{ocupado}`, `{espera}` vêm da profissão.

### Movimento 1 — Espelho (cabeçalho + leitura da situação)

Cabeçalho:

> **Diagnóstico do seu atendimento no WhatsApp**
> {nome} · {profissão} · {data} · código {codigo}

Leitura, montada das respostas. As frases entram só quando a resposta correspondente existe:

- Perda declarada (pergunta 2): "Você mesmo disse: {motivo da perda que ele marcou}."
- Faixa (pergunta 5, com número): "E que numa semana comum {faixa} te procuram e não
  fecham nada."
- Faixa vazia (pergunta 5 = não sei): "E que não sabe quantos {plural} te procuram e não
  fecham por semana. Esse é o primeiro furo, porque sem o número não dá pra saber se
  melhorou."
- Síntese (quando duas dores ou mais foram detectadas): "Juntando {dor 1} com {dor 2}, o
  {cliente} some antes de virar conversa de verdade, e você nem fica sabendo."

Fecho do movimento 1, fixo:

> Isso não é volume de trabalho. É {cliente} que já estava pronto pra fechar e não fechou.
> Abaixo, por onde escapa e o que dá pra fazer nos próximos 90 dias.

### Movimento 5 — Evidência (por que a CHAMA, não força de vontade)

Fixo, com no máximo 3 itens mostrados, escolhidos pelas fases que entraram no plano do lead:

> **Por que isso se resolve com a CHAMA e não com disciplina**
>
> - **Cada conversa com um dono.** Todas as mensagens num painel só, por fila e prioridade,
>   sem depender do celular de cada pessoa. "Quem já respondeu esse?" deixa de ser pergunta já
>   na primeira semana.
> - **A primeira resposta não depende de você.** Um agente de IA responde, qualifica e
>   encaminha na hora, então o {cliente} que chega enquanto você {ocupado} não cai no vácuo.
> - **Quem parou no meio vira lista, não memória.** Campanha para quem pediu e sumiu, sem
>   digitar um por um, com o segundo contato saindo no tempo certo.
> - **O número que hoje falta.** O painel da CHAMA mostra quantos {plural} entram, quantos
>   fecham e onde travam, que é o que diz se os 90 dias funcionaram.
> - **Sem risco de bloqueio.** Tudo pela API Oficial do WhatsApp, homologada pela Meta, com o
>   nome da sua empresa verificado na conversa.
> - **Com a sua marca, não a nossa.** E a implantação é a gente que faz com você, não é você
>   virando tudo do avesso sozinho.

### Movimento 6 — Próximo passo (a call)

Fixo. Sem preço.

> **O próximo passo**
> Numa conversa de 20 minutos a gente abre a CHAMA com o seu caso na tela e monta esse plano
> de 90 dias com você. É conversa, não demonstração empurrada. Sem compromisso, e quem fecha
> tem 30 dias de garantia.
>
> {quando há faixa: "Cada semana assim são {faixa} que não voltam."}
>
> [Agendar 20 minutos pelo WhatsApp]  →  wa.me com o resumo do diagnóstico + código + link do PDF
>
> Prefere ver a plataforma por dentro antes? (link discreto para `/`)

---

## As 3 fases do plano de 90 dias (movimento 4)

Texto fixo de cada fase. O que personaliza é a lista de dores do lead que aparece embaixo de
cada uma ("no seu caso, isso fecha: ...").

Na tela, o título de cada fase renderiza sem travessão: "Dias 1 a 30 · Centralizar".

### Dias 1 a 30 — Centralizar

> Todo o WhatsApp num painel só. Cada conversa entra com uma etapa e um dono, e você bate o
> olho e vê quem está esperando resposta e quem parou no meio. O celular de cada pessoa deixa
> de ser a fonte da verdade.

Fecha: `sem_dono`, `agenda_no_zap`, `sem_funil`, `lead_sem_triagem`, `recepcao_afogada`,
`cadeira_vazia`, `box_travado`, `status_repetido`, `agenda_banho`.

### Dias 31 a 60 — Automatizar

> Um agente de IA assume a primeira resposta e a triagem: responde na hora, entende o que a
> pessoa quer e encaminha. Você começa o dia com os {plural} já separados por interesse, não
> com quarenta mensagens pra ler. E quem pede valor e some entra numa lista de retomada, com
> o segundo contato saindo sozinho no tempo certo.

Fecha: `demora`, `timing_direct`, `corrida_do_primeiro`, `plano_sem_fechar`,
`orcamento_parado`, `preco_sem_conversa`, `cotacao_parada`, `sinistro_lento`,
`orcamento_sem_resposta`, `orcamento_exame`, `aprovacao_demorada`, `visita_furada`,
`emergencia_sem_resposta`.

### Dias 61 a 90 — Reativar e medir

> Campanha em massa para a base que já te procurou e não fechou, sem digitar um por um. E o
> painel da CHAMA passa a te dar o número que hoje falta: quantos {plural} entram, quantos
> fecham, onde travam.

Fecha: `cegueira`, `sem_retomada`, `sem_origem`, `renovacao_cega`, `sem_retorno`,
`renovacao_perdida`, `carteira_fria`, `uma_apolice_so`, `imovel_errado_fim`, `retorno_vacina`,
`tutor_some`, `revisao_esquecida`.

Regra: toda dor de todo nicho está em exatamente uma fase. Dor sem fase quebra o teste.

---

## Ponto forte (movimento entre o espelho e o plano)

Só aparece se disparar. No máximo 2, nesta ordem:

- pergunta 3 = "só eu" → "Hoje é você que segura tudo. O plano não é te dar mais trabalho, é
  tirar de você o que não precisa passar por você."
- pergunta 3 = "eu e mais gente" → "Você já tem gente no atendimento. O que falta não é mão
  de obra, é cada um saber de quem é a conversa."
- pergunta 7 = "uso um CRM hoje" → "Você já usa um CRM, então a ideia de organizar isso não é
  nova pra você. A diferença aqui é o CRM viver dentro da conversa, não numa aba separada que
  ninguém abre."
- pergunta 7 = "já testei um CRM e larguei" → "Você já testou um CRM e largou. Quase sempre
  isso é implantação, não a ferramenta. Aqui a implantação é nossa."
- pergunta 7 = "WhatsApp Business" → "Você já saiu do WhatsApp comum. O Business resolve
  etiqueta e resposta rápida pra uma pessoa; ele para de dar conta quando entra a segunda
  pessoa no atendimento."

Se nada disparar, o bloco não aparece.

---

## Genérico (camada 2 e "outra profissão")

4 dores: `cegueira`, `demora`, `sem_dono`, `sem_retomada`. Movimento 2+3 (custo e desejo)
fundidos, um parágrafo por dor. Entram só as dores detectadas, na ordem de `ordemDores`.

### demora

> **O tempo até a primeira resposta.** Você responde quando consegue parar, e quase nunca é
> na hora em que {espera} perguntou. Nesse intervalo a pessoa não fica esperando: manda
> mensagem pra mais dois. Com a primeira resposta saindo na hora, mesmo com você {ocupado}, o
> que hoje vira "já fechei com outro" volta a ser conversa sua.

### sem_dono

> **Nenhuma conversa tem dono.** Dois atendem o mesmo {cliente} enquanto outro fica sem
> resposta, porque cada um achou que o outro já tinha ido. Não é falta de esforço, é falta de
> quem é responsável por qual conversa. Na CHAMA, cada uma entra com um dono e uma etapa, e
> "quem já respondeu esse?" para de existir.

### sem_retomada

> **Quem não fechou nunca mais é chamado.** O "depois eu te falo" morre ali, porque não
> existe lista de quem parou no meio. Com uma lista de retomada e o segundo contato saindo
> sozinho, a pessoa que sumiu depois do valor volta a ser chamada, sem você lembrar de cada
> uma.

### cegueira

> **Você não tem o número.** Sem saber quantos {plural} escapam por semana, não dá pra saber
> se melhorou nem quanto isso custa. É a primeira coisa a consertar, e é o painel que
> resolve: quantos entram, quantos fecham, onde travam.

---

## Personal Trainer

6 dores: `cegueira`, `timing_direct`, `sem_funil`, `plano_sem_fechar`, `renovacao_cega`,
`agenda_no_zap`.

### timing_direct

> **O lead esfria enquanto você dá aula.** A pessoa chama decidida a treinar, e quando você
> responde à noite ela já perguntou preço pra mais dois. A janela de fechar plano são as
> primeiras horas, não o dia inteiro. Com a primeira resposta saindo na hora, essa janela
> para de fechar na sua frente.

### sem_funil

> **Aluno e interessado no mesmo lugar.** Sem separar quem já paga de quem está decidindo, os
> dois recebem o mesmo tratamento, e quem precisava de atenção agora era o interessado. Com
> cada contato numa etapa do funil, você olha e sabe quem está prestes a fechar.

### plano_sem_fechar

> **O "vou ver e te falo" que ninguém puxa.** Quem pediu valor e sumiu quase nunca volta
> sozinho. Com uma lista de quem parou nesse ponto e um segundo contato automático, o plano
> que ficou no ar volta pra mesa sem depender da sua memória.

### renovacao_cega

> **Aluno some antes de você notar.** A evasão só aparece quando o pagamento não entra, e aí
> ele já decidiu faz tempo. Com o acompanhamento no painel, o aluno que está sumindo aparece
> enquanto ainda dá pra conversar.

### agenda_no_zap

> **A agenda vive dentro da conversa.** Remarcação de aula misturada com negociação de plano
> no mesmo rolo de mensagem, e o que é urgente fica igual ao que é dinheiro. Com a conversa
> organizada por etapa, a remarcação para de enterrar a negociação.

### cegueira

> **Você não tem o número.** Sem saber quantas pessoas te procuram querendo treinar por
> semana, não dá pra saber se melhorou nem quanto isso custa. O painel da CHAMA te dá esse
> número, e é por ele que a gente mede os 90 dias.

---

## Corretor de Imóveis

6 dores: `cegueira`, `corrida_do_primeiro`, `lead_sem_triagem`, `visita_furada`,
`imovel_errado_fim`, `sem_origem`.

### corrida_do_primeiro

> **Quem responde primeiro leva.** O lead do portal não é seu, é de quem chegar antes, então
> cada minuto de atraso é outro corretor atendendo o seu cliente. Com a primeira resposta
> saindo na hora, automática, você para de perder no relógio.

### lead_sem_triagem

> **Todo lead recebe o mesmo esforço.** Curioso e comprador com dinheiro na mão tratados
> igual, e como o curioso responde mais rápido, é nele que o seu dia vai. Com a triagem
> automática separando quente de frio, seu tempo vai pra quem está pronto pra visitar.

### visita_furada

> **Visita marcada que não acontece.** Deslocamento e horário perdidos, sem aviso nenhum. Com
> a confirmação de véspera saindo sozinha, a agenda cheia deixa de ser agenda ocupada.

### imovel_errado_fim

> **Não fechou aquele, sumiu de vez.** O problema era só aquele imóvel, mas era cliente com
> intenção de compra que virou nada por falta de um segundo contato. Com ele numa lista de
> retomada, um imóvel novo que entra no perfil dele te dá o motivo de chamar de volta.

### sem_origem

> **Você não sabe qual anúncio trouxe.** Paga por todos e não sabe qual pagou por si, então
> não dá pra saber onde investir mais nem o que cortar. O painel mostra de onde veio cada
> lead que fechou.

### cegueira

> **Você não tem o número.** Sem saber quantos leads entram por semana e quantos viram
> visita, não dá pra saber onde está o furo. O painel da CHAMA te dá isso, e é por ele que a
> gente mede os 90 dias.

---

## Dentista

6 dores: `cegueira`, `orcamento_parado`, `cadeira_vazia`, `recepcao_afogada`, `sem_retorno`,
`preco_sem_conversa`. Vocabulário: {cliente} = paciente, {ocupado} = com paciente na cadeira.

### orcamento_parado

> **Orçamento passado que ninguém retoma.** É o de maior valor da lista: tratamento avaliado,
> orçado, e nunca começado. Não foi recusado, ficou esperando um segundo contato que não
> veio. Com uma lista de quem parou nesse ponto e o retorno saindo sozinho, o orçamento
> parado volta a ser conversa.

### cadeira_vazia

> **Falta sem aviso.** Hora de cadeira não se recupera, o dia tem as horas que tem. Sem
> lembrete de véspera, a falta deixa de ser exceção e vira parte do custo. Com a confirmação
> automática no dia anterior, a agenda cheia para de ter buraco no meio.

### recepcao_afogada

> **Uma pessoa, três canais.** Telefone, balcão e WhatsApp na mesma pessoa, e o paciente que
> está na frente sempre ganha. Isso faz do WhatsApp o canal que sempre espera. Com o
> WhatsApp num painel, e um agente de IA na primeira resposta, ele para de ser a fila que
> ninguém puxa.

### sem_retorno

> **Paciente de manutenção nunca é chamado.** Quem terminou o tratamento sai da sua vida sem
> precisar sair. É a receita mais barata que existe, porque a pessoa já confia em você. Com
> uma campanha de retorno saindo no tempo certo, essa base volta sem você ligar de um em um.

### preco_sem_conversa

> **Só mandam o valor.** Orçamento respondido com número seco, sem a conversa que sustenta o
> valor. Aí a decisão vira comparação de preço, que é a única disputa em que ninguém ganha.
> Com a conversa organizada por etapa, o valor deixa de ser a primeira e única coisa que o
> paciente vê.

### cegueira

> **Você não tem o número.** Sem saber quantos orçamentos viram tratamento, não dá pra saber
> se o problema é preço, é a explicação, ou é só ninguém ter voltado a falar com a pessoa. O
> painel da CHAMA te dá esse número, e é por ele que a gente mede os 90 dias.

---

## Corretor de Seguros

6 dores: `cegueira`, `renovacao_perdida`, `cotacao_parada`, `sinistro_lento`,
`carteira_fria`, `uma_apolice_so`. Vocabulário: {ocupado} = resolvendo um sinistro,
{espera} = quem pediu uma cotação.

### renovacao_perdida

> **A apólice venceu e ninguém avisou.** É a perda mais cara da sua lista, porque não é uma
> venda: é comissão que se repetia todo ano e parou. E quase sempre o cliente não saiu por
> preço, saiu porque outro corretor lembrou antes de você. Com o aviso de vencimento saindo
> sozinho na data certa, quem lembra primeiro passa a ser você.

### cotacao_parada

> **Cotação enviada que ninguém retoma.** O cliente pediu, você calculou, mandou. Ele não
> respondeu. Sem uma lista de quem parou nesse ponto, a cotação vira trabalho feito e não
> pago. Com uma lista de retomada e o segundo contato automático, ela para de morrer no
> silêncio.

### sinistro_lento

> **O sinistro é a hora em que ele decide se fica.** Ninguém avisa sinistro em horário
> comercial por educação: é batida, é roubo, é urgência. A demora nessa mensagem vale mais
> que a demora em todas as outras juntas. Com um agente de IA respondendo na hora e marcando
> a urgência, o cliente é atendido no momento em que mais importa.

### carteira_fria

> **O cliente só ouve falar de você quando a apólice vence.** Um contato por ano, e ele é uma
> cobrança. É pouco pra competir com preço de concorrente todo aniversário da apólice. Com
> uma régua de contato ao longo do ano, ele chega na renovação já lembrando por que fica.

### uma_apolice_so

> **Ele tem uma apólice e podia ter três.** Quem já confia em você para o carro tem menos
> resistência para vida, residencial ou saúde. Sem saber quem tem só uma, essa venda nunca é
> oferecida. Com a carteira organizada por cliente e por produto, quem tem espaço pra crescer
> fica visível.

### cegueira

> **Você não tem o número.** Sem saber quantas cotações viram apólice e quantas apólices
> venceram sem renovar, não dá pra saber se o furo está na venda nova ou na carteira que você
> já tem. O painel da CHAMA separa os dois, e é por ele que a gente mede os 90 dias.

---

## Veterinário

6 dores: `cegueira`, `retorno_vacina`, `emergencia_sem_resposta`, `agenda_banho`,
`orcamento_exame`, `tutor_some`. Vocabulário: {cliente} = tutor, {plural} = tutores.

### retorno_vacina

> **A vacina do ano que vem ninguém lembra.** É a receita mais previsível da clínica, e a
> mais abandonada. O tutor não tem calendário na cabeça, e sem lembrete o retorno anual
> simplesmente não acontece. Com o lembrete saindo sozinho na data, o retorno deixa de
> depender da memória do tutor.

### emergencia_sem_resposta

> **A urgência chegou fora do horário.** Animal passando mal não espera abrir. Quem não é
> respondido nessa hora não perde uma consulta: leva o cartão de vacina inteiro pra outra
> clínica, e o resto da vida do bicho junto. Com um agente de IA respondendo e triando a
> urgência 24 horas, essa mensagem para de cair no vazio.

### agenda_banho

> **O horário desmarcado que ninguém reocupa.** A remarcação chega por mensagem, é combinada
> de cabeça e nunca entra na agenda. O horário fica vago, e a fila de espera que existia não
> é avisada. Com a agenda dentro do painel, o horário que abriu volta a ser oferecido.

### orcamento_exame

> **Exame e cirurgia orçados que param no ar.** O tutor recebe o valor, diz que vai pensar e
> some. Não é recusa, é decisão adiada. Sem segundo contato, ela nunca é retomada. Com a
> retomada automática, o orçamento parado volta pra mesa no tempo certo.

### tutor_some

> **Atendeu uma vez e nunca mais viu.** O tutor não fica com raiva, ele só não volta, porque
> nada nem ninguém lembrou dele. Com uma campanha de acompanhamento depois da consulta, a
> primeira visita deixa de ser a única.

### cegueira

> **Você não tem o número.** Sem saber quantos tutores chamam por semana e quantos viram
> consulta, não dá pra saber se falta gente chegando ou se está escapando na porta. O painel
> da CHAMA te dá isso, e é por ele que a gente mede os 90 dias.

---

## Oficina Mecânica

6 dores: `cegueira`, `orcamento_sem_resposta`, `box_travado`, `aprovacao_demorada`,
`status_repetido`, `revisao_esquecida`. Vocabulário: {ocupado} = com o carro no elevador,
{espera} = quem está esperando orçamento.

### orcamento_sem_resposta

> **Orçamento mandado que fica no vácuo.** Você fotografou a peça, explicou, mandou o valor.
> O cliente sumiu. E enquanto ele não responde, você não pode nem começar nem liberar o
> carro. Com a retomada automática cobrando resposta, o orçamento para de ficar no limbo.

### box_travado

> **Carro parado ocupando elevador.** Essa é a sua dor que nenhum outro negócio tem: a
> indecisão do cliente ocupa espaço físico. Box parado não é serviço adiado, é o serviço
> seguinte que não entra. Com o status de cada carro num painel e a cobrança de resposta
> automática, o box gira mais rápido.

### aprovacao_demorada

> **Achou um problema e o serviço parou.** Abriu, encontrou outra coisa, precisa de
> aprovação. A mensagem some no meio da conversa e o mecânico fica de mão parada esperando um
> "pode fazer". Com a aprovação pedida por uma mensagem clara e rastreada, ela para de se
> perder no rolo.

### status_repetido

> **"Meu carro tá pronto?"** A mesma pergunta, o dia inteiro, de gente diferente. Cada uma é
> rápida, e juntas comem a manhã de quem devia estar orçando serviço novo. Com um agente de
> IA respondendo o status na hora, essa pergunta sai da sua mão.

### revisao_esquecida

> **Consertou e nunca mais chamou.** O cliente volta quando quebra de novo, e às vezes volta
> pra outro. A próxima revisão tem data previsível e ninguém usa isso. Com o lembrete de
> revisão saindo sozinho, o carro volta pra sua oficina, não pra concorrente.

### cegueira

> **Você não tem o número.** Sem saber quantos orçamentos você manda por semana e quantos
> viram serviço, não dá pra saber se o problema é preço, é demora, ou é ninguém ter cobrado
> resposta. O painel da CHAMA te dá isso, e é por ele que a gente mede os 90 dias.

---

## Versão do WhatsApp (`?text=`)

O lead não deve mandar um relatório de primeira mensagem, isso soa robótico. A mensagem é
curta e humana, e o diagnóstico inteiro está no link e no PDF que o atendente devolve.

> Oi, fiz o diagnóstico no site e queria agendar a call.
> Sou {profissão}. {frase de uma linha: título do diagnóstico}
> Meu diagnóstico completo: {link do /relatorio}
> Código {codigo}

Cabe folgado no limite do `wa.me`. O atendente abre o link, filtra a aba `Diagnósticos` pelo
código, pega a mensagem pronta e o PDF, e responde.

---

## Gate do Vitor

- **Plano.** Agente de IA, campanha em massa e o painel de métricas são do plano Chama
  (R$747), não do Brasa (R$447). O diagnóstico promete os três. Sem preço na página e com a
  conversa decidindo o plano, dá pra deixar assim (é o que a CHAMA faz, no melhor plano), ou
  você quer suavizar pra não frustrar quem entra no Brasa?
- **Termos da garantia.** O texto diz "30 dias de garantia" sem dizer o quê. Devolução do
  dinheiro? Cancelamento livre? Preciso da frase exata pra não prometer vago.
- **Um dado de instituição.** O comprador cético não tem nenhuma prova de que funciona (e a
  gente não inventa depoimento). Um número do Sebrae ou Mobile Time (ex.: "82% dos MEIs usam
  o WhatsApp como principal canal") é de instituição de pesquisa, não de fornecedor, e daria
  credibilidade sem faltar com a verdade. Uso ou não?
- Movimento 5 (evidência): a lista de capacidades pode ir ao ar assim?
- Movimento 6: o texto da conversa e a ausência de preço.
- As 3 fases: os nomes (Centralizar / Automatizar / Reativar e medir) e o texto de cada uma.
- Ponto forte: os gatilhos e as frases.
- Genérico, Personal e Corretor: a redação de cada parágrafo de dor.
- Versão do WhatsApp: mensagem curta com link, ou você quer o diagnóstico inteiro no texto?
- Dentista, Seguros, Veterinário e Oficina: mesma revisão dos parágrafos de dor.

## Painel de avaliação (rodado em 08/09)

Quatro personas, nota de 1 a 10:

| Persona | Antes | O que puxou a nota pra baixo |
|---|---|---|
| Copywriter de resposta direta | 7 | Sem urgência ancorada, seis parágrafos de dor com o mesmo ritmo, CTA com jargão ("call") |
| Comprador cético (fez o quiz) | 6 | Zero prova de que funciona, garantia vaga, cheiro de "diagnóstico que só dá uma conclusão" |
| Editor de conversão | 7 | Scroll longo logo depois de 7 perguntas, três nomes pra mesma coisa (call/20 min/conversa) |
| Estrategista de marca | 6 | Promessa de plano de cima sem dizer, "ORL360" onde o lead não sabe o que é |

Aplicado nesta revisão: termo do painel padronizado ("painel da CHAMA"), CTA único
("conversa de 20 minutos"), linha de urgência com a faixa do próprio lead, frase de síntese
no espelho, regra de insight antes da CHAMA em cada parágrafo de dor, orçamento de tamanho
(3 dores, 3 itens de evidência na tela).

Pendente do gate do Vitor: termos da garantia e o dado de instituição (as duas maiores
quedas do cético). Re-nota depois que ele responder essas duas.
