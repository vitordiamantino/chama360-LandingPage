// O motor do diagnóstico. Monta, POR REGRA, as seções que a tela e o PDF mostram no fim do
// quiz, no lugar da VSL. Custo zero, nenhuma função nova na Vercel, nunca afirma número que o
// lead não deu.
//
// Segue 6 movimentos (ver docs/superpowers/specs/2026-09-08-texto-do-diagnostico-por-nicho.md):
//   1 Espelho     a situação atual, montada das respostas
//   2+3 Custo+desejo  um parágrafo por dor, DOR_TEXTO
//   ponto forte  o que o lead já tem, PONTO_FORTE
//   4 Ponte      o plano de 90 dias, FASES + FASE_DA_DOR
//   5 Evidência  por que a CHAMA e não força de vontade, EVIDENCIA
//   6 Próximo passo  a call
//
// COMO MEXER NO TEXTO: cada bloco tem seu objeto abaixo. `montarPlano`, no fim, só junta.
// Trocar por IA (o W3 do programa do funil) mexe só em `montarPlano`, nada mais.
//
// Tom: o do Vitor no WhatsApp. SEM TRAVESSÃO E SEM EMOJI, e há teste guardando isso.

import { VAZAMENTOS, FAIXAS, aplicarVocabulario, acharProfissao, resolverQuiz } from './quiz-dados.js';

// ------------------------------------------------------------------------------------------
// Movimento 4 — as 3 fases do plano de 90 dias. `FASE_DA_DOR` liga cada dor a uma fase; o
// teste varre todas as dores de todos os nichos e quebra se alguma ficar sem fase.
// ------------------------------------------------------------------------------------------

export const FASE_DA_DOR = {
  // Fase 1 — Centralizar
  sem_dono: 1, agenda_no_zap: 1, sem_funil: 1, lead_sem_triagem: 1, recepcao_afogada: 1,
  cadeira_vazia: 1, box_travado: 1, status_repetido: 1, agenda_banho: 1,
  // Fase 2 — Automatizar
  demora: 2, timing_direct: 2, corrida_do_primeiro: 2, plano_sem_fechar: 2, orcamento_parado: 2,
  preco_sem_conversa: 2, cotacao_parada: 2, sinistro_lento: 2, orcamento_sem_resposta: 2,
  orcamento_exame: 2, aprovacao_demorada: 2, visita_furada: 2, emergencia_sem_resposta: 2,
  // Fase 3 — Reativar e medir
  cegueira: 3, sem_retomada: 3, sem_origem: 3, renovacao_cega: 3, sem_retorno: 3,
  renovacao_perdida: 3, carteira_fria: 3, uma_apolice_so: 3, imovel_errado_fim: 3,
  retorno_vacina: 3, tutor_some: 3, revisao_esquecida: 3,
};

const FASES = [
  {
    n: 1,
    titulo: 'Dias 1 a 30 · Centralizar',
    texto: 'Todo o WhatsApp num painel só. Cada conversa entra com uma etapa e um dono, e você bate o olho e vê quem está esperando resposta e quem parou no meio. O celular de cada pessoa deixa de ser a fonte da verdade.',
  },
  {
    n: 2,
    titulo: 'Dias 31 a 60 · Automatizar',
    texto: 'Um agente de IA assume a primeira resposta e a triagem: responde na hora, entende o que a pessoa quer e encaminha. Você começa o dia com os {plural} já separados por interesse, não com quarenta mensagens pra ler. E quem pede valor e some entra numa lista de retomada, com o segundo contato saindo sozinho no tempo certo.',
  },
  {
    n: 3,
    titulo: 'Dias 61 a 90 · Reativar e medir',
    texto: 'Campanha em massa para a base que já te procurou e não fechou, sem digitar um por um. E o painel da CHAMA passa a te dar o número que hoje falta: quantos {plural} entram, quantos fecham, onde travam.',
  },
];

// ------------------------------------------------------------------------------------------
// Movimento 5 — Evidência. `fase` liga o item a uma fase do plano; `null` é sempre elegível.
// Mostra no máximo 3, entre os elegíveis.
// ------------------------------------------------------------------------------------------

const EVIDENCIA = [
  { fase: 1, texto: '**Cada conversa com um dono.** Todas as mensagens num painel só, por fila e prioridade, sem depender do celular de cada pessoa. "Quem já respondeu esse?" deixa de ser pergunta já na primeira semana.' },
  { fase: 2, texto: '**A primeira resposta não depende de você.** Um agente de IA responde, qualifica e encaminha na hora, então o {cliente} que chega enquanto você {ocupado} não cai no vácuo.' },
  { fase: 3, texto: '**Quem parou no meio vira lista, não memória.** Campanha para quem pediu e sumiu, sem digitar um por um, com o segundo contato saindo no tempo certo.' },
  { fase: 3, texto: '**O número que hoje falta.** O painel da CHAMA mostra quantos {plural} entram, quantos fecham e onde travam, que é o que diz se os 90 dias funcionaram.' },
  { fase: null, texto: '**Sem risco de bloqueio.** Tudo pela API Oficial do WhatsApp, homologada pela Meta, com o nome da sua empresa verificado na conversa.' },
  { fase: null, texto: '**Com a sua marca, não a nossa.** E a implantação é a gente que faz com você, não é você virando tudo do avesso sozinho.' },
];

// ------------------------------------------------------------------------------------------
// Ponto forte. Gatilhos da pergunta 2 (perdeCliente) e da 7 do genérico (ferramenta). Máx 2,
// nesta ordem. Se nada dispara, o bloco não aparece.
// ------------------------------------------------------------------------------------------

const PONTO_FORTE = [
  { quando: (r) => r.perdeCliente === 'nao',
    texto: 'Você respondeu que dá conta de responder todo mundo. Então o problema não é esforço, é o que se perde sem ninguém ver.' },
  { quando: (r) => r.perdeCliente === 'sem_dono',
    texto: 'Você já tem gente no atendimento. O que falta não é mão de obra, é cada um saber de quem é a conversa.' },
  { quando: (r) => r.ferramenta === 'crm_hoje',
    texto: 'Você já usa um CRM, então a ideia de organizar isso não é nova pra você. A diferença aqui é o CRM viver dentro da conversa, não numa aba separada que ninguém abre.' },
  { quando: (r) => r.ferramenta === 'crm_largado',
    texto: 'Você já testou um CRM e largou. Quase sempre isso é implantação, não a ferramenta. Aqui a implantação é nossa.' },
  { quando: (r) => r.ferramenta === 'whats_business',
    texto: 'Você já saiu do WhatsApp comum. O Business resolve etiqueta e resposta rápida pra uma pessoa; ele para de dar conta quando entra a segunda pessoa no atendimento.' },
];

// ------------------------------------------------------------------------------------------
// Movimento 2+3 — custo e desejo, um parágrafo por dor, por nicho. Chave externa: 'default'
// mais os 6 nichos com quiz próprio. Chave interna: id da dor. O texto do nicho vence; sem
// entrada no nicho, cai no 'default'. `{cliente}/{plural}/{ocupado}/{espera}` são trocados
// pelo vocabulário da profissão na hora de montar.
// ------------------------------------------------------------------------------------------

export const DOR_TEXTO = {
  default: {
    demora: '**O tempo até a primeira resposta.** Você responde quando consegue parar, e quase nunca é na hora em que {espera} perguntou. Nesse intervalo a pessoa não fica esperando: manda mensagem pra mais dois. Com a primeira resposta saindo na hora, mesmo com você {ocupado}, o que hoje vira "já fechei com outro" volta a ser conversa sua.',
    sem_dono: '**Nenhuma conversa tem dono.** Dois atendem o mesmo {cliente} enquanto outro fica sem resposta, porque cada um achou que o outro já tinha ido. Não é falta de esforço, é falta de quem é responsável por qual conversa. Na CHAMA, cada uma entra com um dono e uma etapa, e "quem já respondeu esse?" para de existir.',
    sem_retomada: '**Quem não fechou nunca mais é chamado.** O "depois eu te falo" morre ali, porque não existe lista de quem parou no meio. Com uma lista de retomada e o segundo contato saindo sozinho, a pessoa que sumiu depois do valor volta a ser chamada, sem você lembrar de cada uma.',
    cegueira: '**Você não tem o número.** Sem saber quantos {plural} escapam por semana, não dá pra saber se melhorou nem quanto isso custa. É a primeira coisa a consertar, e é o painel que resolve: quantos entram, quantos fecham, onde travam.',
  },
  personal: {
    timing_direct: '**O lead esfria enquanto você dá aula.** A pessoa chama decidida a treinar, e quando você responde à noite ela já perguntou preço pra mais dois. A janela de fechar plano são as primeiras horas, não o dia inteiro. Com a primeira resposta saindo na hora, essa janela para de fechar na sua frente.',
    sem_funil: '**Aluno e interessado no mesmo lugar.** Sem separar quem já paga de quem está decidindo, os dois recebem o mesmo tratamento, e quem precisava de atenção agora era o interessado. Com cada contato numa etapa do funil, você olha e sabe quem está prestes a fechar.',
    plano_sem_fechar: '**O "vou ver e te falo" que ninguém puxa.** Quem pediu valor e sumiu quase nunca volta sozinho. Com uma lista de quem parou nesse ponto e um segundo contato automático, o plano que ficou no ar volta pra mesa sem depender da sua memória.',
    renovacao_cega: '**Aluno some antes de você notar.** A evasão só aparece quando o pagamento não entra, e aí ele já decidiu faz tempo. Com o acompanhamento no painel, o aluno que está sumindo aparece enquanto ainda dá pra conversar.',
    agenda_no_zap: '**A agenda vive dentro da conversa.** Remarcação de aula misturada com negociação de plano no mesmo rolo de mensagem, e o que é urgente fica igual ao que é dinheiro. Com a conversa organizada por etapa, a remarcação para de enterrar a negociação.',
    cegueira: '**Você não tem o número.** Sem saber quantas pessoas te procuram querendo treinar por semana, não dá pra saber se melhorou nem quanto isso custa. O painel da CHAMA te dá esse número, e é por ele que a gente mede os 90 dias.',
  },
  corretor: {
    corrida_do_primeiro: '**Quem responde primeiro leva.** O lead do portal não é seu, é de quem chegar antes, então cada minuto de atraso é outro corretor atendendo o seu cliente. Com a primeira resposta saindo na hora, automática, você para de perder no relógio.',
    lead_sem_triagem: '**Todo lead recebe o mesmo esforço.** Curioso e comprador com dinheiro na mão tratados igual, e como o curioso responde mais rápido, é nele que o seu dia vai. Com a triagem automática separando quente de frio, seu tempo vai pra quem está pronto pra visitar.',
    visita_furada: '**Visita marcada que não acontece.** Deslocamento e horário perdidos, sem aviso nenhum. Com a confirmação de véspera saindo sozinha, a agenda cheia deixa de ser agenda ocupada.',
    imovel_errado_fim: '**Não fechou aquele, sumiu de vez.** O problema era só aquele imóvel, mas era cliente com intenção de compra que virou nada por falta de um segundo contato. Com ele numa lista de retomada, um imóvel novo que entra no perfil dele te dá o motivo de chamar de volta.',
    sem_origem: '**Você não sabe qual anúncio trouxe.** Paga por todos e não sabe qual pagou por si, então não dá pra saber onde investir mais nem o que cortar. O painel mostra de onde veio cada lead que fechou.',
    cegueira: '**Você não tem o número.** Sem saber quantos leads entram por semana e quantos viram visita, não dá pra saber onde está o furo. O painel da CHAMA te dá isso, e é por ele que a gente mede os 90 dias.',
  },
  dentista: {
    orcamento_parado: '**Orçamento passado que ninguém retoma.** É o de maior valor da lista: tratamento avaliado, orçado, e nunca começado. Não foi recusado, ficou esperando um segundo contato que não veio. Com uma lista de quem parou nesse ponto e o retorno saindo sozinho, o orçamento parado volta a ser conversa.',
    cadeira_vazia: '**Falta sem aviso.** Hora de cadeira não se recupera, o dia tem as horas que tem. Sem lembrete de véspera, a falta deixa de ser exceção e vira parte do custo. Com a confirmação automática no dia anterior, a agenda cheia para de ter buraco no meio.',
    recepcao_afogada: '**Uma pessoa, três canais.** Telefone, balcão e WhatsApp na mesma pessoa, e o paciente que está na frente sempre ganha. Isso faz do WhatsApp o canal que sempre espera. Com o WhatsApp num painel, e um agente de IA na primeira resposta, ele para de ser a fila que ninguém puxa.',
    sem_retorno: '**Paciente de manutenção nunca é chamado.** Quem terminou o tratamento sai da sua vida sem precisar sair. É a receita mais barata que existe, porque a pessoa já confia em você. Com uma campanha de retorno saindo no tempo certo, essa base volta sem você ligar de um em um.',
    preco_sem_conversa: '**Só mandam o valor.** Orçamento respondido com número seco, sem a conversa que sustenta o valor. Aí a decisão vira comparação de preço, que é a única disputa em que ninguém ganha. Com a conversa organizada por etapa, o valor deixa de ser a primeira e única coisa que o paciente vê.',
    cegueira: '**Você não tem o número.** Sem saber quantos orçamentos viram tratamento, não dá pra saber se o problema é preço, é a explicação, ou é só ninguém ter voltado a falar com a pessoa. O painel da CHAMA te dá esse número, e é por ele que a gente mede os 90 dias.',
  },
  corretor_seguros: {
    renovacao_perdida: '**A apólice venceu e ninguém avisou.** É a perda mais cara da sua lista, porque não é uma venda: é comissão que se repetia todo ano e parou. E quase sempre o cliente não saiu por preço, saiu porque outro corretor lembrou antes de você. Com o aviso de vencimento saindo sozinho na data certa, quem lembra primeiro passa a ser você.',
    cotacao_parada: '**Cotação enviada que ninguém retoma.** O cliente pediu, você calculou, mandou. Ele não respondeu. Sem uma lista de quem parou nesse ponto, a cotação vira trabalho feito e não pago. Com uma lista de retomada e o segundo contato automático, ela para de morrer no silêncio.',
    sinistro_lento: '**O sinistro é a hora em que ele decide se fica.** Ninguém avisa sinistro em horário comercial por educação: é batida, é roubo, é urgência. A demora nessa mensagem vale mais que a demora em todas as outras juntas. Com um agente de IA respondendo na hora e marcando a urgência, o cliente é atendido no momento em que mais importa.',
    carteira_fria: '**O cliente só ouve falar de você quando a apólice vence.** Um contato por ano, e ele é uma cobrança. É pouco pra competir com preço de concorrente todo aniversário da apólice. Com uma régua de contato ao longo do ano, ele chega na renovação já lembrando por que fica.',
    uma_apolice_so: '**Ele tem uma apólice e podia ter três.** Quem já confia em você para o carro tem menos resistência para vida, residencial ou saúde. Sem saber quem tem só uma, essa venda nunca é oferecida. Com a carteira organizada por cliente e por produto, quem tem espaço pra crescer fica visível.',
    cegueira: '**Você não tem o número.** Sem saber quantas cotações viram apólice e quantas apólices venceram sem renovar, não dá pra saber se o furo está na venda nova ou na carteira que você já tem. O painel da CHAMA separa os dois, e é por ele que a gente mede os 90 dias.',
  },
  veterinario: {
    retorno_vacina: '**A vacina do ano que vem ninguém lembra.** É a receita mais previsível da clínica, e a mais abandonada. O tutor não tem calendário na cabeça, e sem lembrete o retorno anual simplesmente não acontece. Com o lembrete saindo sozinho na data, o retorno deixa de depender da memória do tutor.',
    emergencia_sem_resposta: '**A urgência chegou fora do horário.** Animal passando mal não espera abrir. Quem não é respondido nessa hora não perde uma consulta: leva o cartão de vacina inteiro pra outra clínica, e o resto da vida do bicho junto. Com um agente de IA respondendo e triando a urgência 24 horas, essa mensagem para de cair no vazio.',
    agenda_banho: '**O horário desmarcado que ninguém reocupa.** A remarcação chega por mensagem, é combinada de cabeça e nunca entra na agenda. O horário fica vago, e a fila de espera que existia não é avisada. Com a agenda dentro do painel, o horário que abriu volta a ser oferecido.',
    orcamento_exame: '**Exame e cirurgia orçados que param no ar.** O tutor recebe o valor, diz que vai pensar e some. Não é recusa, é decisão adiada. Sem segundo contato, ela nunca é retomada. Com a retomada automática, o orçamento parado volta pra mesa no tempo certo.',
    tutor_some: '**Atendeu uma vez e nunca mais viu.** O tutor não fica com raiva, ele só não volta, porque nada nem ninguém lembrou dele. Com uma campanha de acompanhamento depois da consulta, a primeira visita deixa de ser a única.',
    cegueira: '**Você não tem o número.** Sem saber quantos tutores chamam por semana e quantos viram consulta, não dá pra saber se falta gente chegando ou se está escapando na porta. O painel da CHAMA te dá isso, e é por ele que a gente mede os 90 dias.',
  },
  oficina: {
    orcamento_sem_resposta: '**Orçamento mandado que fica no vácuo.** Você fotografou a peça, explicou, mandou o valor. O cliente sumiu. E enquanto ele não responde, você não pode nem começar nem liberar o carro. Com a retomada automática cobrando resposta, o orçamento para de ficar no limbo.',
    box_travado: '**Carro parado ocupando elevador.** Essa é a sua dor que nenhum outro negócio tem: a indecisão do cliente ocupa espaço físico. Box parado não é serviço adiado, é o serviço seguinte que não entra. Com o status de cada carro num painel e a cobrança de resposta automática, o box gira mais rápido.',
    aprovacao_demorada: '**Achou um problema e o serviço parou.** Abriu, encontrou outra coisa, precisa de aprovação. A mensagem some no meio da conversa e o mecânico fica de mão parada esperando um "pode fazer". Com a aprovação pedida por uma mensagem clara e rastreada, ela para de se perder no rolo.',
    status_repetido: '**"Meu carro tá pronto?"** A mesma pergunta, o dia inteiro, de gente diferente. Cada uma é rápida, e juntas comem a manhã de quem devia estar orçando serviço novo. Com um agente de IA respondendo o status na hora, essa pergunta sai da sua mão.',
    revisao_esquecida: '**Consertou e nunca mais chamou.** O cliente volta quando quebra de novo, e às vezes volta pra outro. A próxima revisão tem data previsível e ninguém usa isso. Com o lembrete de revisão saindo sozinho, o carro volta pra sua oficina, não pra concorrente.',
    cegueira: '**Você não tem o número.** Sem saber quantos orçamentos você manda por semana e quantos viram serviço, não dá pra saber se o problema é preço, é demora, ou é ninguém ter cobrado resposta. O painel da CHAMA te dá isso, e é por ele que a gente mede os 90 dias.',
  },
};

// ------------------------------------------------------------------------------------------

function nichoDe(profissaoId) {
  const quiz = resolverQuiz(profissaoId);
  const propria = quiz && quiz.dores && quiz.dores !== VAZAMENTOS;
  return propria ? profissaoId : 'default';
}

function textoDaDor(id, nicho, prof) {
  const tabela = DOR_TEXTO[nicho] || DOR_TEXTO.default;
  const bruto = tabela[id] || DOR_TEXTO.default[id];
  return bruto ? aplicarVocabulario(bruto, prof) : '';
}

function tituloDaDor(id, prof) {
  const quiz = resolverQuiz(prof);
  const dor = (quiz.dores && quiz.dores[id]) || VAZAMENTOS[id];
  return dor ? aplicarVocabulario(dor.titulo, prof) : id;
}

function tituloDoDiagnostico(vazamentos) {
  const temCegueira = vazamentos.includes('cegueira');
  const reais = vazamentos.filter((k) => k !== 'cegueira').length;
  const plural = reais === 1 ? 'vazamento' : 'vazamentos';
  if (reais > 0 && temCegueira) return `Seu atendimento tem ${reais} ${plural}, e um ponto cego.`;
  if (reais > 0) return `Seu atendimento tem ${reais} ${plural}.`;
  if (temCegueira) return 'Seu atendimento tem um ponto cego.';
  return 'Seu atendimento está mais organizado que a média.';
}

// Monta o objeto do diagnóstico. `corpo` = { nome, codigo, respostas, rotulos, vazamentos }.
// `nicho` é derivado da profissão; não precisa vir no corpo.
export function montarPlano(corpo) {
  const c = corpo || {};
  const r = c.respostas || {};
  const rot = c.rotulos || {};
  const prof = r.profissao;
  const nicho = nichoDe(prof);
  const p = acharProfissao(prof);

  const quiz = resolverQuiz(prof);
  const ordem = quiz.ordemDores || Object.keys(VAZAMENTOS);
  const vazamentos = (Array.isArray(c.vazamentos) ? c.vazamentos : [])
    .filter((k) => ordem.includes(k))
    .sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b));

  const faixa = FAIXAS[r.quantos];

  // Movimento 1 — espelho
  const espelho = [];
  const motivo = String(rot.perdeCliente || '').trim();
  if (motivo && r.perdeCliente && r.perdeCliente !== 'nao') {
    espelho.push(`Você mesmo disse: ${motivo[0].toLowerCase()}${motivo.slice(1)}.`);
  }
  if (faixa) {
    espelho.push(`E que numa semana comum ${faixa} te procuram e não fecham nada.`);
  } else if (r.quantos === 'nao_sei') {
    espelho.push(aplicarVocabulario('E que não sabe quantos {plural} te procuram e não fecham por semana. Esse é o primeiro furo, porque sem o número não dá pra saber se melhorou.', prof));
  }
  if (vazamentos.length >= 2) {
    const d1 = tituloDaDor(vazamentos[0], prof).toLowerCase();
    const d2 = tituloDaDor(vazamentos[1], prof).toLowerCase();
    espelho.push(aplicarVocabulario(`Juntando ${d1} com ${d2}, o {cliente} some antes de virar conversa de verdade, e você nem fica sabendo.`, prof));
  }
  espelho.push(aplicarVocabulario('Isso não é volume de trabalho. É {cliente} que já estava pronto pra fechar e não fechou. Abaixo, por onde escapa e o que dá pra fazer nos próximos 90 dias.', prof));

  // Ponto forte — no máximo 2
  const pontoForte = PONTO_FORTE.filter((pf) => pf.quando(r)).slice(0, 2).map((pf) => pf.texto);

  // Movimento 2+3 — dores, no máximo 3
  const dores = vazamentos.slice(0, 3).map((id) => ({
    id,
    titulo: tituloDaDor(id, prof),
    texto: textoDaDor(id, nicho, prof),
  }));
  const semVazamento = vazamentos.length === 0;
  if (semVazamento) {
    dores.push({
      id: 'nenhum',
      titulo: 'Nada crítico apareceu aqui',
      texto: 'Suas respostas não acusaram vazamento óbvio. Nesse caso a conversa é outra: como crescer sem que o atendimento vire gargalo de novo.',
    });
  }

  // Movimento 4 — as 3 fases, cada uma com as dores do lead que ela fecha
  const fases = FASES.map((f) => ({
    n: f.n,
    titulo: f.titulo,
    texto: aplicarVocabulario(f.texto, prof),
    fecha: vazamentos.filter((d) => FASE_DA_DOR[d] === f.n).map((d) => tituloDaDor(d, prof)),
  }));

  // Movimento 5 — evidência, no máximo 3, entre as elegíveis pelas fases com dor
  const fasesComDor = new Set(vazamentos.map((d) => FASE_DA_DOR[d]).filter(Boolean));
  const evidencia = EVIDENCIA
    .filter((e) => e.fase === null || fasesComDor.has(e.fase) || semVazamento)
    .slice(0, 3)
    .map((e) => aplicarVocabulario(e.texto, prof));

  // Meta dos 90 dias — número só quando o lead deu
  const meta = faixa
    ? aplicarVocabulario(`Em 90 dias, recuperar parte das pessoas que hoje te procuram e não fecham (${faixa}), com o atendimento rodando sem você ser o gargalo.`, prof)
    : aplicarVocabulario('Em 90 dias, ter o número de quantos {plural} escapam por semana e uma rotina que não depende de você lembrar.', prof);

  // Movimento 6 — a call
  let call = 'Numa conversa de 20 minutos a gente abre a CHAMA com o seu caso na tela e monta esse plano de 90 dias com você. É conversa, não demonstração empurrada. Sem compromisso, e quem fecha tem 30 dias de garantia.';
  if (faixa) call += ` Cada semana assim são ${faixa} que não voltam.`;

  return {
    titulo: tituloDoDiagnostico(vazamentos),
    profissao: p.label,
    codigo: c.codigo || '',
    nome: c.nome || '',
    espelho,
    pontoForte,
    dores,
    fases,
    evidencia,
    meta,
    call,
  };
}

// Exportado só para o teste varrer FASE_DA_DOR e DOR_TEXTO sem reimplementar a lógica.
export const _plano = { FASE_DA_DOR, DOR_TEXTO, FASES, EVIDENCIA, PONTO_FORTE };
