// A abordagem: a mensagem pronta que vai para a planilha, na coluna AA, para quem atende copiar
// e mandar no WhatsApp sem ter que ler sete colunas e traduzir de cabeça.
//
// Ela é MONTADA POR REGRA, não escrita por IA. Custo zero, aparece na linha no mesmo segundo em
// que o lead envia, e nunca inventa número que ele não deu. O programa do funil previa este texto
// vindo da Claude API (W3); se um dia o texto daqui cansar, a troca acontece dentro de
// `montarAbordagem` e mais nada muda: nem a planilha, nem a rota, nem o front.
//
// COMO MEXER NO TEXTO:
//
//   Quem assina .............. `REMETENTE`, aqui embaixo.
//   O que dizer de cada dor .. `GANCHOS`, um parágrafo inteiro por dor.
//   Abertura e fechamento .... `montarAbordagem`, no fim do arquivo.
//
// Por que o gancho é o parágrafo INTEIRO, e não um pedaço encaixado num molde: "sem o número não
// dá pra saber se melhorou" e "o tempo até a primeira resposta" não cabem na mesma frase-modelo.
// Molde único deixaria metade das dores soando torta, e é justamente esse parágrafo que faz a
// mensagem parecer escrita por alguém que leu o caso.
//
// Tom: o do Vitor no WhatsApp com cliente. "pra", "tá", "a gente", "teu", segunda pessoa informal.
// SEM TRAVESSÃO E SEM EMOJI, que é o que denuncia texto de máquina, e há teste guardando isso.
// É primeiro contato: nada de intimidade forçada nem de explicar processo interno.

import { VAZAMENTOS, QUIZ_POR_NICHO, FAIXAS, aplicarVocabulario } from './quiz-dados.js';

// Quem assina a mensagem. Um lugar só: trocar aqui troca em todo lead novo.
export const REMETENTE = 'Vitor';

// Como o lead descreveu quem responde o WhatsApp hoje. É a única pergunta que existe em TODOS os
// quizzes, genérico e de nicho, então é o fato que a abertura sempre consegue citar.
const QUEM_RESPONDE = {
  so_eu:   'hoje é só você respondendo o WhatsApp',
  mais_um: 'hoje são você e mais uma pessoa no WhatsApp',
  equipe:  'hoje tem uma equipe de três ou mais respondendo',
  ninguem: 'hoje não tem quem dê conta, e muita coisa fica sem resposta',
};

// Um parágrafo por dor, com os mesmos marcadores do quiz ({cliente}, {plural}, {espera},
// {ocupado}), trocados pelo vocabulário da profissão na hora de montar.
//
// São as 34 dores: as 4 do quiz genérico mais as dos 6 nichos com quiz próprio. Praça nova que
// ganhar dor nova precisa de gancho aqui, e há teste que quebra a suíte se faltar.
export const GANCHOS = {
  // Quiz genérico
  demora: 'O que mais pesa aí é o tempo até a primeira resposta. Quando você consegue parar pra responder, {espera} já perguntou pra mais dois.',
  sem_dono: 'O que mais pesa aí é que nenhuma conversa tem dono. Quando todo mundo pode responder, tem {cliente} recebendo resposta de duas pessoas e tem {cliente} que não recebe de ninguém.',
  sem_retomada: 'O que mais pesa aí é que quem não fechou nunca mais é chamado. O "depois eu te falo" morre ali, porque não existe lista de quem parou no meio.',
  cegueira: 'Antes das outras coisas tem uma: você não sabe quantos {plural} escapam por semana. Sem esse número não dá pra saber se melhorou nem quanto isso tá custando, então é por aí que a gente começa.',

  // Personal Trainer
  timing_direct: 'O que mais pesa aí é a janela. A pessoa te chama decidida a começar, e quando você responde, à noite, ela já perguntou preço pra mais dois. O que fecha plano são as primeiras horas, não o dia inteiro.',
  sem_funil: 'O que mais pesa aí é aluno e interessado no mesmo lugar. Sem separar quem já paga de quem ainda tá decidindo, os dois recebem o mesmo tratamento, e quem precisava de atenção agora era o interessado.',
  plano_sem_fechar: 'O que mais pesa aí é o "vou ver e te falo". Quem pediu valor e sumiu quase nunca volta sozinho, e sem uma lista de quem parou no meio não tem ninguém pra chamar de volta.',
  renovacao_cega: 'O que mais pesa aí é o aluno que some antes de você notar. A evasão só aparece quando o pagamento não entra, e nesse ponto ele já decidiu faz tempo.',
  agenda_no_zap: 'O que mais pesa aí é a agenda morando dentro da conversa. Remarcação de aula misturada com negociação de plano no mesmo rolo de mensagem, e o que é urgente fica igual ao que é dinheiro.',

  // Corretor de Imóveis
  corrida_do_primeiro: 'O que mais pesa aí é a corrida do primeiro. O lead do portal não é teu, é de quem chegar antes, então cada minuto de atraso é outro corretor atendendo o teu cliente.',
  lead_sem_triagem: 'O que mais pesa aí é todo lead recebendo o mesmo esforço. Curioso e comprador com dinheiro na mão tratados igual, e como o curioso responde mais rápido, é nele que o teu dia acaba indo.',
  visita_furada: 'O que mais pesa aí é a visita marcada que não acontece. Deslocamento e horário perdidos, sem nenhum aviso. Confirmar na véspera não é burocracia, é o que separa agenda cheia de agenda ocupada.',
  imovel_errado_fim: 'O que mais pesa aí é quem não gostou daquele imóvel e sumiu de vez. O problema era só aquele imóvel: era cliente com intenção de compra que virou nada por falta de um segundo contato.',
  sem_origem: 'O que mais pesa aí é não saber qual anúncio trouxe cada lead. Você paga por todos e não sabe qual pagou por si, então não dá pra saber onde investir mais nem o que cortar.',

  // Dentista
  orcamento_parado: 'O que mais pesa aí é o orçamento passado que ninguém retoma. É o de maior valor da lista: tratamento avaliado, orçado e nunca começado, esperando um segundo contato que não veio.',
  cadeira_vazia: 'O que mais pesa aí é a falta sem aviso. Hora de cadeira não se recupera, e sem lembrete de véspera a falta deixa de ser exceção e vira parte do custo.',
  recepcao_afogada: 'O que mais pesa aí é uma pessoa pra três canais. Telefone, balcão e WhatsApp na mesma pessoa, e o paciente que está na frente sempre ganha, o que faz do WhatsApp o canal que sempre espera.',
  sem_retorno: 'O que mais pesa aí é o paciente de manutenção que nunca é chamado. Quem terminou o tratamento sai da tua vida sem precisar sair, e é a receita mais barata que existe, porque ele já confia em você.',
  preco_sem_conversa: 'O que mais pesa aí é o orçamento respondido só com o número. Sem a conversa que sustenta o valor, a decisão vira comparação de preço, que é a única disputa em que ninguém ganha.',

  // Corretor de Seguros
  renovacao_perdida: 'O que mais pesa aí é a apólice que venceu sem ninguém avisar. Não é uma venda perdida, é comissão que se repetia todo ano e parou. E quase sempre o cliente não saiu por preço, saiu porque outro corretor lembrou antes.',
  cotacao_parada: 'O que mais pesa aí é a cotação que ninguém retoma. Ele pediu, você calculou, mandou, e ele não respondeu. Sem uma lista de quem parou nesse ponto, vira trabalho feito e não pago.',
  sinistro_lento: 'O que mais pesa aí é o sinistro. Ninguém avisa sinistro em horário comercial: é batida, é roubo, é urgência. A demora nessa mensagem específica vale mais que a demora em todas as outras juntas.',
  carteira_fria: 'O que mais pesa aí é o cliente só ouvir falar de você quando a apólice vence. Um contato por ano, e ele é uma cobrança. É pouco pra competir com preço de concorrente todo aniversário.',
  uma_apolice_so: 'O que mais pesa aí é o cliente que tem uma apólice e podia ter três. Quem já confia em você pro carro é quem tem menos resistência pra vida ou residencial, e sem saber quem tem só uma, essa venda nunca é oferecida.',

  // Veterinário
  retorno_vacina: 'O que mais pesa aí é a vacina do ano que vem. É a receita mais previsível da clínica e a mais abandonada: o tutor não tem calendário na cabeça, e sem lembrete o retorno simplesmente não acontece.',
  emergencia_sem_resposta: 'O que mais pesa aí é a urgência fora do horário. Bicho passando mal não espera abrir, e quem não é respondido nessa hora não perde uma consulta: leva o cartão de vacina inteiro pra outra clínica.',
  agenda_banho: 'O que mais pesa aí é o horário desmarcado que ninguém reocupa. A remarcação chega por mensagem, é combinada de cabeça e não entra na agenda, aí o horário fica vago e a fila de espera nem fica sabendo.',
  orcamento_exame: 'O que mais pesa aí é o exame orçado que para no ar. O tutor recebe o valor, diz que vai pensar e some. Não é recusa, é decisão adiada, e sem um segundo contato ela nunca é retomada.',
  tutor_some: 'O que mais pesa aí é o tutor que atendeu uma vez e nunca mais voltou. Ele não fica com raiva, ele só não volta, porque nada nem ninguém lembrou dele.',

  // Oficina Mecânica
  orcamento_sem_resposta: 'O que mais pesa aí é o orçamento no vácuo. Você fotografou a peça, explicou, mandou o valor, e o cliente sumiu. Enquanto ele não responde você não pode nem começar nem liberar o carro.',
  box_travado: 'O que mais pesa aí é o carro parado ocupando elevador. Essa dor quase nenhum outro negócio tem: a indecisão do cliente ocupa espaço físico, e box parado não é serviço adiado, é o serviço seguinte que não entra.',
  aprovacao_demorada: 'O que mais pesa aí é a aprovação que não chega. Abriu, achou outra coisa, precisa de um "pode fazer", e a mensagem some no meio da conversa com o mecânico de mão parada esperando.',
  status_repetido: 'O que mais pesa aí é o "meu carro tá pronto?". A mesma pergunta o dia inteiro, de gente diferente. Cada uma é rápida, e juntas comem a manhã de quem devia estar orçando serviço novo.',
  revisao_esquecida: 'O que mais pesa aí é consertar e nunca mais chamar. O cliente volta quando quebra de novo, e às vezes volta pra outro. A próxima revisão tem data previsível e ninguém usa isso pra trazer ele de volta.',
};

// Todas as dores que existem hoje, do genérico e de todo nicho. O teste usa isto para exigir
// gancho de cada uma, em vez de citar ids na mão: praça nova quebra a suíte em vez de degradar
// calada, que é o mesmo desenho que já guarda a VSL por profissão.
export function todasAsDores() {
  const ids = new Set(Object.keys(VAZAMENTOS));
  Object.values(QUIZ_POR_NICHO).forEach((quiz) => {
    Object.keys(quiz.dores || {}).forEach((id) => ids.add(id));
  });
  return [...ids];
}

// O texto de uma dor. Gancho escrito quando existe; título da dor como rede, para uma dor nova
// nunca deixar a mensagem sem terceiro parágrafo. O teste acima impede a rede de virar o normal.
function textoDaDor(id, nicho, prof) {
  const escrito = GANCHOS[id];
  if (escrito) return aplicarVocabulario(escrito, prof);
  const dores = (QUIZ_POR_NICHO[nicho] || {}).dores || VAZAMENTOS;
  const dor = dores[id] || VAZAMENTOS[id];
  return dor ? `O que mais pesa aí é isto: ${aplicarVocabulario(dor.titulo, prof).toLowerCase()}.` : '';
}

function primeiroNome(nome) {
  const limpo = String(nome || '').trim().replace(/\s+/g, ' ');
  if (!limpo) return '';
  const p = limpo.split(' ')[0];
  return p.charAt(0).toUpperCase() + p.slice(1);
}

// Monta a mensagem inteira a partir do mesmo corpo que a rota já recebe do front.
//
// Quatro parágrafos: quem está falando, o que ele mesmo declarou, a dor que mais pesa, e o
// convite. O segundo só afirma número quando o lead deu um número: quem respondeu que não faz
// ideia recebe a versão sem número, a mesma regra que o diagnóstico da tela e a VSL seguem.
export function montarAbordagem(corpo) {
  const c = corpo || {};
  const r = c.respostas || {};
  const prof = r.profissao;
  const nome = primeiroNome(c.nome);

  const abertura = nome
    ? `Oi, ${nome}. Aqui é o ${REMETENTE}, da CHAMA 360.`
    : `Oi. Aqui é o ${REMETENTE}, da CHAMA 360.`;

  const fatos = [];
  const faixa = FAIXAS[r.quantos];
  if (faixa) fatos.push(`${faixa} te procuram e não fecham`);
  const quem = QUEM_RESPONDE[r.quemResponde];
  if (quem) fatos.push(quem);

  const codigo = String(c.codigo || '').trim();
  let contexto = codigo ? `Vi teu diagnóstico aqui, código ${codigo}.` : 'Vi teu diagnóstico aqui.';
  if (fatos.length) contexto += ` Você marcou que ${fatos.join(', e que ')}.`;

  const vazamentos = Array.isArray(c.vazamentos) ? c.vazamentos : [];
  const dor = vazamentos.length
    ? textoDaDor(vazamentos[0], c.nicho, prof)
    : 'Pelas tuas respostas não apareceu vazamento óbvio, e isso já é bom sinal. Nesse caso a conversa é outra: como crescer sem que o atendimento vire gargalo de novo.';

  const convite = 'Consegue 20 minutos essa semana pra eu te mostrar como a gente resolve isso?';

  return [abertura, contexto, dor, convite].filter(Boolean).join('\n\n');
}
