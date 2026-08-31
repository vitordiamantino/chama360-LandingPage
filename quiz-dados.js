// Conteúdo do quiz da CHAMA 360.
//
// Este arquivo é só dado. O motor que percorre a árvore está em quiz.js, e a regra é que
// mexer em texto de pergunta nunca deve exigir abrir o motor.
//
// A árvore tem 7 perguntas e sempre 7 respostas, mesmo ramificando. As perguntas 1, 2, 5 e 7
// são fixas. As perguntas 3, 4 e 6 escolhem uma variante conforme o que veio antes. Isso mantém
// a planilha com um número fixo de colunas: 7 de resposta, mais 3 dizendo qual variante apareceu.

// As oito profissões dos criativos de 24/08, mais uma saída para quem não se encaixa.
// `cliente` e `plural` reescrevem o texto das perguntas. `ocupado` é o momento em que a mão
// dele está presa exatamente quando o cliente chega, que é a dor comum às oito.
export const PROFISSOES = [
  { id: 'personal',    label: 'Personal Trainer',      cliente: 'aluno',    plural: 'alunos',    ocupado: 'dando aula',              espera: 'quem quer fechar um plano' },
  { id: 'nutri',       label: 'Nutricionista',         cliente: 'paciente', plural: 'pacientes', ocupado: 'em consulta',             espera: 'quem quer marcar a primeira consulta' },
  { id: 'dentista',    label: 'Dentista',              cliente: 'paciente', plural: 'pacientes', ocupado: 'com paciente na cadeira', espera: 'quem pediu orçamento' },
  { id: 'esteticista', label: 'Esteticista',           cliente: 'cliente',  plural: 'clientes',  ocupado: 'atendendo',               espera: 'quem quer agendar um procedimento' },
  { id: 'advogado',    label: 'Advogado ou Advogada',  cliente: 'cliente',  plural: 'clientes',  ocupado: 'em audiência',            espera: 'quem tem um caso pra te contar' },
  { id: 'psicologo',   label: 'Psicólogo ou Psicóloga',cliente: 'paciente', plural: 'pacientes', ocupado: 'em sessão',               espera: 'quem quer marcar a primeira sessão' },
  { id: 'corretor',    label: 'Corretor de Imóveis',   cliente: 'cliente',  plural: 'clientes',  ocupado: 'mostrando um imóvel',     espera: 'quem perguntou o valor' },
  { id: 'fisio',       label: 'Fisioterapeuta',        cliente: 'paciente', plural: 'pacientes', ocupado: 'atendendo na maca',       espera: 'quem quer marcar sessão' },
  // Camada 2, entram em 28/08 pelo W8. Cabeleireiro passa nos três filtros e tem o melhor dado
  // de canal da lista (9 em 10 clientes agendam por WhatsApp); médico passa no filtro do conselho
  // e cai no de "quem atende", porque tem secretária — quem qualifica se separa sozinho na
  // pergunta 2. Os dois usam o quiz e a VSL padrão, sem uma linha de código a mais.
  { id: 'cabeleireiro',label: 'Cabeleireiro ou Cabeleireira', cliente: 'cliente', plural: 'clientes', ocupado: 'atendendo na cadeira', espera: 'quem quer marcar um horário' },
  { id: 'medico',      label: 'Médico ou Médica',      cliente: 'paciente', plural: 'pacientes', ocupado: 'em consulta',             espera: 'quem quer marcar consulta' },

  // Praças novas, 31/08. Ordem e recorte vêm da pesquisa de profissões que mais dependem de
  // WhatsApp, aplicando os mesmos 4 filtros do W8 (volume · o dono responde · o conselho deixa
  // falar · consegue pagar R$447). Fontes por nicho no log de produção de 31/08.
  //
  // Corretor de seguros, veterinário e oficina ganharam quiz próprio (camada 1) porque a dor
  // deles não é a mesma do genérico: renovação de apólice, retorno de vacina e box travado não
  // têm equivalente na árvore padrão. Os outros quatro usam o genérico.
  { id: 'corretor_seguros', label: 'Corretor de Seguros',  cliente: 'cliente', plural: 'clientes', ocupado: 'resolvendo um sinistro',   espera: 'quem pediu uma cotação' },
  { id: 'veterinario', label: 'Veterinário ou Clínica Veterinária', cliente: 'tutor', plural: 'tutores', ocupado: 'em atendimento',  espera: 'quem quer marcar consulta' },
  { id: 'oficina',     label: 'Oficina Mecânica',      cliente: 'cliente',  plural: 'clientes',  ocupado: 'com o carro no elevador', espera: 'quem está esperando orçamento' },
  { id: 'barbearia',   label: 'Barbearia',             cliente: 'cliente',  plural: 'clientes',  ocupado: 'atendendo na cadeira',    espera: 'quem quer marcar um horário' },
  { id: 'pilates',     label: 'Estúdio de Pilates ou Academia', cliente: 'aluno', plural: 'alunos', ocupado: 'dando aula',          espera: 'quem quer fazer uma aula experimental' },
  { id: 'arquiteto',   label: 'Arquiteto ou Designer de Interiores', cliente: 'cliente', plural: 'clientes', ocupado: 'visitando uma obra', espera: 'quem pediu uma proposta' },
  { id: 'contador',    label: 'Contador ou Escritório de Contabilidade', cliente: 'cliente', plural: 'clientes', ocupado: 'fechando um balanço', espera: 'quem mandou um documento' },

  { id: 'outra',       label: 'Outra profissão',       cliente: 'cliente',  plural: 'clientes',  ocupado: 'com a mão ocupada',       espera: 'quem quer comprar de você' },
];

// Toda pergunta tem id, texto e opções. Texto aceita {cliente}, {plural}, {ocupado} e {espera},
// trocados pelo vocabulário da profissão respondida na pergunta 1.
//
// `proxima` decide o passo seguinte. Quando é função, recebe as respostas acumuladas.
// `peso` marca quais respostas alimentam qual vazamento no diagnóstico.
export const PERGUNTAS = {
  profissao: {
    id: 'profissao',
    numero: 1,
    texto: 'Pra começar: o que você faz?',
    ajuda: 'As perguntas seguintes mudam conforme a sua resposta aqui.',
    opcoes: PROFISSOES.map((p) => ({ valor: p.id, label: p.label })),
    proxima: () => 'quemResponde',
  },

  quemResponde: {
    id: 'quemResponde',
    numero: 2,
    texto: 'Quem responde o WhatsApp do seu negócio hoje?',
    opcoes: [
      { valor: 'so_eu',    label: 'Só eu' },
      { valor: 'mais_um',  label: 'Eu e mais uma pessoa' },
      { valor: 'equipe',   label: 'Uma equipe, três ou mais' },
      { valor: 'ninguem',  label: 'Na prática ninguém dá conta, fica muita coisa sem resposta', peso: ['demora'] },
    ],
    // Quem atende sozinho tem um problema de tempo. Quem atende em grupo tem um problema de
    // dono. São perguntas diferentes porque são doenças diferentes.
    proxima: (r) => (r.quemResponde === 'so_eu' || r.quemResponde === 'ninguem' ? 'tempoResposta' : 'divisao'),
  },

  tempoResposta: {
    id: 'tempoResposta',
    numero: 3,
    variante: 'A',
    texto: 'Quando {espera} te chama, quanto tempo passa até você responder?',
    ajuda: 'Vale a média de um dia comum, não o seu melhor dia.',
    opcoes: [
      { valor: 'minutos',      label: 'Minutos, respondo quase na hora' },
      { valor: 'poucas_horas', label: 'Uma ou duas horas' },
      { valor: 'a_noite',      label: 'Só quando eu paro, geralmente à noite', peso: ['demora'] },
      { valor: 'dia_seguinte', label: 'Às vezes só no dia seguinte',           peso: ['demora'] },
    ],
    proxima: (r) => (r.tempoResposta === 'a_noite' || r.tempoResposta === 'dia_seguinte' ? 'esquecimento' : 'depoisQue'),
  },

  divisao: {
    id: 'divisao',
    numero: 3,
    variante: 'B',
    texto: 'Como vocês dividem quem atende quem?',
    opcoes: [
      { valor: 'quem_ve',    label: 'Quem vê primeiro responde',        peso: ['sem_dono'] },
      { valor: 'cada_um',    label: 'Cada um tem o próprio número' },
      { valor: 'combinada',  label: 'Tem uma divisão combinada entre a gente' },
      { valor: 'sem_regra',  label: 'Não tem regra nenhuma',            peso: ['sem_dono'] },
    ],
    proxima: (r) => (r.divisao === 'quem_ve' || r.divisao === 'sem_regra' ? 'atropelo' : 'depoisQue'),
  },

  esquecimento: {
    id: 'esquecimento',
    numero: 4,
    variante: 'A',
    texto: 'Já aconteceu de você ver a mensagem enquanto estava {ocupado}, pensar "respondo daqui a pouco" e só lembrar no outro dia?',
    opcoes: [
      { valor: 'toda_semana', label: 'Toda semana',            peso: ['demora'] },
      { valor: 'as_vezes',    label: 'Já aconteceu algumas vezes', peso: ['demora'] },
      { valor: 'nunca',       label: 'Não, isso não acontece comigo' },
    ],
    proxima: () => 'quantos',
  },

  atropelo: {
    id: 'atropelo',
    numero: 4,
    variante: 'B',
    texto: 'Já aconteceu de duas pessoas responderem o mesmo {cliente}, ou de ninguém responder porque cada um achou que o outro tinha respondido?',
    opcoes: [
      { valor: 'toda_semana', label: 'Toda semana',            peso: ['sem_dono'] },
      { valor: 'as_vezes',    label: 'Já aconteceu algumas vezes', peso: ['sem_dono'] },
      { valor: 'nunca',       label: 'Não, isso não acontece aqui' },
    ],
    proxima: () => 'quantos',
  },

  depoisQue: {
    id: 'depoisQue',
    numero: 4,
    variante: 'C',
    texto: 'Depois que o {cliente} responde, o que acontece?',
    ajuda: 'Pensa no caminho mais comum, do primeiro oi até fechar.',
    opcoes: [
      { valor: 'agenda',    label: 'Já agendo ou fecho ali mesmo' },
      { valor: 'orcamento', label: 'Mando valor ou proposta e espero ele voltar', peso: ['sem_retomada'] },
      { valor: 'anoto',     label: 'Anoto num caderno ou numa planilha' },
      { valor: 'esquece',   label: 'Se ele não voltar, acaba ficando por isso mesmo', peso: ['sem_retomada'] },
    ],
    proxima: () => 'quantos',
  },

  quantos: {
    id: 'quantos',
    numero: 5,
    texto: 'Numa semana comum, quantas pessoas te chamam e não fecham nada?',
    ajuda: 'Não precisa ser exato.',
    opcoes: [
      { valor: 'ate5',    label: 'Até 5' },
      { valor: '6a15',    label: 'De 6 a 15' },
      { valor: '16a30',   label: 'De 16 a 30' },
      { valor: 'mais30',  label: 'Mais de 30' },
      { valor: 'nao_sei', label: 'Não faço ideia', peso: ['cegueira'] },
    ],
    // Quem não sabe o número tem um problema anterior ao vazamento: não enxerga. A pergunta
    // seguinte confirma se é cegueira geral ou só desta conta.
    proxima: (r) => (r.quantos === 'nao_sei' ? 'cegueira' : 'retomada'),
  },

  cegueira: {
    id: 'cegueira',
    numero: 6,
    variante: 'A',
    texto: 'E se eu te perguntar quantos {plural} novos vieram do Instagram no mês passado, você consegue me dizer agora?',
    opcoes: [
      { valor: 'com_numero', label: 'Consigo, sei o número' },
      { valor: 'mais_menos', label: 'Mais ou menos, por cima',   peso: ['cegueira'] },
      { valor: 'nao',        label: 'Não, não tenho como saber', peso: ['cegueira'] },
    ],
    proxima: () => 'ferramenta',
  },

  retomada: {
    id: 'retomada',
    numero: 6,
    variante: 'B',
    texto: 'E com quem não fechou, você faz alguma coisa depois?',
    opcoes: [
      { valor: 'chamo',     label: 'Chamo de novo depois de um tempo' },
      { valor: 'promocao',  label: 'Mando promoção de vez em quando',      peso: ['sem_retomada'] },
      { valor: 'nada',      label: 'Nada, fica por isso mesmo',            peso: ['sem_retomada'] },
    ],
    proxima: () => 'ferramenta',
  },

  ferramenta: {
    id: 'ferramenta',
    numero: 7,
    texto: 'Hoje você usa alguma ferramenta pra organizar esse atendimento?',
    opcoes: [
      { valor: 'whats_normal',   label: 'Só o WhatsApp normal' },
      { valor: 'whats_business', label: 'WhatsApp Business' },
      { valor: 'crm_largado',    label: 'Já testei um CRM e larguei' },
      { valor: 'crm_hoje',       label: 'Uso um CRM hoje' },
    ],
    proxima: () => null, // fim da árvore, vai para a captura
  },
};

export const PRIMEIRA_PERGUNTA = 'profissao';

// Os três vazamentos e a cegueira. O diagnóstico monta o texto a partir do que foi marcado
// pelos `peso` das respostas, e nunca afirma número que o lead não deu.
export const VAZAMENTOS = {
  demora: {
    titulo: 'O tempo até a primeira resposta',
    texto: 'Você responde quando consegue parar, e quase nunca é na hora em que a pessoa perguntou. Nesse intervalo {espera} não fica esperando: manda mensagem pra mais dois.',
  },
  sem_dono: {
    titulo: 'Nenhuma conversa tem dono',
    texto: 'Quando todo mundo pode responder, ninguém é responsável. É o que faz duas pessoas atenderem o mesmo {cliente}, e faz outro ficar sem resposta porque cada um achou que o outro já tinha ido lá.',
  },
  sem_retomada: {
    titulo: 'Quem não fechou nunca mais é chamado',
    texto: 'O "depois eu te falo" morre ali. Não existe lista de quem parou no meio, então não existe ninguém pra puxar de volta.',
  },
  cegueira: {
    titulo: 'Você não tem o número',
    texto: 'Essa é a que vem antes das outras. Sem saber quantos {plural} escapam por semana, não dá pra saber se melhorou nem quanto isso custa. É a primeira coisa a consertar.',
  },
};

// Faixas da pergunta 5 em texto, para o diagnóstico falar a linguagem do lead.
export const FAIXAS = {
  ate5:   'cerca de 5 pessoas por semana',
  '6a15': 'entre 6 e 15 pessoas por semana',
  '16a30':'entre 16 e 30 pessoas por semana',
  mais30: 'mais de 30 pessoas por semana',
};

export function acharProfissao(id) {
  return PROFISSOES.find((p) => p.id === id) || PROFISSOES[PROFISSOES.length - 1];
}

// Troca {cliente}, {plural}, {ocupado} e {espera} pelo vocabulário da profissão.
export function aplicarVocabulario(texto, profissaoId) {
  const p = acharProfissao(profissaoId);
  return String(texto || '')
    .replace(/\{cliente\}/g, p.cliente)
    .replace(/\{plural\}/g, p.plural)
    .replace(/\{ocupado\}/g, p.ocupado)
    .replace(/\{espera\}/g, p.espera);
}

// ==========================================================================================
// W2 — quiz de dores por nicho
//
// A pergunta 1 (profissão) fica FORA das listas abaixo: é ela que escolhe qual lista o motor
// percorre. Nicho sem lista própria cai no `default`, que é o quiz genérico de sempre — é isso
// que faz a camada 2 funcionar sem código extra.
//
// O motor continua andando por `proxima()`. Uma lista linear é só uma árvore em que cada
// pergunta aponta para a seguinte, então `listaLinear` liga os nós e o motor não precisa saber
// se está num nicho ou no genérico. O `default` mantém a ramificação real que já tinha.
//
// Comprimento: 7 perguntas no total em todos os nichos, igual ao genérico de hoje. Decisão do
// Vitor em 28/08 — o ganho vem de perguntar melhor, não mais, e mantendo o tamanho a comparação
// com o histórico continua limpa. A margem até 10 fica para quando houver conclusão por nicho.
// ==========================================================================================

// Recebe as perguntas na ordem e devolve o objeto indexado por id, com `proxima` ligando cada
// uma à seguinte e a última fechando a lista.
function listaLinear(perguntas) {
  const porId = {};
  perguntas.forEach((p, i) => {
    const seguinte = perguntas[i + 1];
    porId[p.id] = { ...p, numero: i + 2, proxima: () => (seguinte ? seguinte.id : null) };
  });
  return porId;
}

const DORES_PERSONAL = {
  cegueira: {
    titulo: 'Você não tem o número',
    texto: 'Essa vem antes das outras. Sem saber quantas pessoas te procuram querendo treinar por semana, não dá pra saber se melhorou nem quanto isso custa.',
  },
  timing_direct: {
    titulo: 'O lead esfria enquanto você dá aula',
    texto: 'A pessoa chama decidida a começar. Quando você responde, à noite, ela já perguntou preço pra mais dois. A janela de fechar não é o dia inteiro: são as primeiras horas.',
  },
  sem_funil: {
    titulo: 'Aluno e interessado no mesmo lugar',
    texto: 'Sem separar quem já paga de quem ainda está decidindo, os dois recebem o mesmo tratamento: nenhum. E o interessado é justamente quem precisava de atenção agora.',
  },
  plano_sem_fechar: {
    titulo: 'O "vou ver e te falo" que ninguém puxa',
    texto: 'Quem pediu valor e sumiu quase nunca volta sozinho. Sem uma lista de quem parou no meio, não existe ninguém pra chamar de volta.',
  },
  renovacao_cega: {
    titulo: 'Aluno que some antes de você notar',
    texto: 'A evasão aparece tarde, quando o pagamento não entra. Nesse ponto ele já decidiu, e trazer de volta custa muito mais do que teria custado perguntar antes.',
  },
  agenda_no_zap: {
    titulo: 'A agenda vive dentro da conversa',
    texto: 'Remarcação de aula misturada com negociação de plano, no mesmo rolo de mensagens. O que é urgente e o que é dinheiro ficam indistinguíveis.',
  },
};

const DORES_CORRETOR = {
  cegueira: {
    titulo: 'Você não tem o número',
    texto: 'Sem saber quantos leads entram por semana e quantos viram visita, não dá pra saber onde está o furo nem quanto ele custa.',
  },
  corrida_do_primeiro: {
    titulo: 'Quem responde primeiro leva',
    texto: 'O lead do portal não é seu: é de quem chegar antes. Cada minuto de atraso não é atraso, é outro corretor atendendo o seu cliente.',
  },
  lead_sem_triagem: {
    titulo: 'Todo lead recebe o mesmo esforço',
    texto: 'Curioso e comprador com dinheiro na mão tratados igual. Como o curioso costuma responder mais rápido, é nele que o seu dia acaba indo.',
  },
  visita_furada: {
    titulo: 'Visita marcada que não acontece',
    texto: 'Deslocamento perdido, horário perdido, e nenhum aviso. A confirmação véspera não é burocracia: é o que separa a agenda cheia da agenda ocupada.',
  },
  imovel_errado_fim: {
    titulo: 'Não fechou aquele, sumiu de vez',
    texto: 'Quem não gostou do imóvel some, quando o problema era só aquele imóvel. Era cliente com intenção de compra, e virou nada por falta de um segundo contato.',
  },
  sem_origem: {
    titulo: 'Você não sabe qual anúncio trouxe',
    texto: 'Sem saber de onde veio cada lead, não dá pra saber onde investir mais nem o que cortar. Você paga por todos e não sabe qual pagou por si.',
  },
};

const DORES_DENTISTA = {
  cegueira: {
    titulo: 'Você não tem o número',
    texto: 'Sem saber quantos orçamentos viram tratamento, não dá pra saber se o problema é preço, se é a explicação, ou se é só ninguém ter voltado a falar com a pessoa.',
  },
  orcamento_parado: {
    titulo: 'Orçamento passado que ninguém retoma',
    texto: 'É o de maior valor da lista: tratamento avaliado, orçado, e nunca começado. Não foi recusado, ficou esperando um segundo contato que não veio.',
  },
  cadeira_vazia: {
    titulo: 'Falta sem aviso',
    texto: 'Hora de cadeira não se recupera: o dia tem as horas que tem. Sem lembrete de véspera, a falta deixa de ser exceção e vira parte do custo.',
  },
  recepcao_afogada: {
    titulo: 'Uma pessoa, três canais',
    texto: 'Telefone, balcão e WhatsApp na mesma pessoa. O paciente na frente sempre ganha, e ganha certo — mas isso faz do WhatsApp o canal que sempre espera.',
  },
  sem_retorno: {
    titulo: 'Paciente de manutenção nunca é chamado',
    texto: 'Quem terminou o tratamento sai da sua vida sem precisar sair. É a receita mais barata que existe, porque a pessoa já confia em você.',
  },
  preco_sem_conversa: {
    titulo: 'Só mandam o valor',
    texto: 'Orçamento respondido com número seco, sem a conversa que sustenta o valor. Aí a decisão vira comparação de preço, que é a única disputa em que ninguém ganha.',
  },
};

// ------------------------------------------------------------------------------------------
// Praças novas de 31/08. Mesma disciplina do W8: a dor é descrita pelo que o profissional
// PERDE, nunca por número que ele não deu, e nenhuma estatística entra no texto.
// ------------------------------------------------------------------------------------------

const DORES_CORRETOR_SEGUROS = {
  cegueira: {
    titulo: 'Você não tem o número',
    texto: 'Sem saber quantas cotações viram apólice e quantas apólices venceram sem renovar, não dá pra saber se o furo está na venda nova ou na carteira que você já tem.',
  },
  renovacao_perdida: {
    titulo: 'A apólice venceu e ninguém avisou',
    texto: 'É a perda mais cara da sua lista, porque não é uma venda: é comissão que se repetia todo ano e parou. E quase sempre o cliente não saiu por preço, saiu porque outro corretor lembrou antes de você.',
  },
  cotacao_parada: {
    titulo: 'Cotação enviada que ninguém retoma',
    texto: 'O cliente pediu, você calculou, mandou. Ele não respondeu. Sem uma lista de quem parou nesse ponto, a cotação vira trabalho feito e não pago.',
  },
  sinistro_lento: {
    titulo: 'O sinistro é a hora em que ele decide se fica',
    texto: 'Ninguém avisa sinistro em horário comercial por educação. É batida, é roubo, é urgência. A demora nessa mensagem específica vale mais que a demora em todas as outras juntas.',
  },
  carteira_fria: {
    titulo: 'O cliente só ouve falar de você quando vence',
    texto: 'Um contato por ano, e ele é uma cobrança. É pouco pra sustentar um relacionamento que precisa competir com preço de concorrente todo aniversário da apólice.',
  },
  uma_apolice_so: {
    titulo: 'Ele tem uma apólice e podia ter três',
    texto: 'Quem já confia em você para o carro é quem tem menos resistência para vida, residencial ou saúde. Sem saber quem tem só uma, essa venda nunca é oferecida.',
  },
};

const DORES_VETERINARIO = {
  cegueira: {
    titulo: 'Você não tem o número',
    texto: 'Sem saber quantos tutores chamam por semana e quantos viram consulta, não dá pra saber se falta gente chegando ou se está escapando na porta.',
  },
  retorno_vacina: {
    titulo: 'A vacina do ano que vem ninguém lembra',
    texto: 'É a receita mais previsível que existe na clínica, e a mais abandonada. O tutor não tem calendário na cabeça, e sem lembrete o retorno anual simplesmente não acontece.',
  },
  emergencia_sem_resposta: {
    titulo: 'A urgência chegou fora do horário',
    texto: 'Animal passando mal não espera abrir. Quem não é respondido nessa hora não perde uma consulta: leva o cartão de vacina inteiro pra outra clínica, e o resto da vida do bicho junto.',
  },
  agenda_banho: {
    titulo: 'O horário desmarcado que ninguém reocupa',
    texto: 'A remarcação chega por mensagem, é combinada de cabeça e nunca entra na agenda. O horário fica vago, e a fila de espera que existia não é avisada.',
  },
  orcamento_exame: {
    titulo: 'Exame e cirurgia orçados que param no ar',
    texto: 'O tutor recebe o valor, diz que vai pensar e some. Não é recusa, é decisão adiada. Sem segundo contato, ela nunca é retomada.',
  },
  tutor_some: {
    titulo: 'Atendeu uma vez e nunca mais viu',
    texto: 'Consulta pontual sem nenhum acompanhamento depois. O tutor não fica com raiva, ele só não volta, porque nada nem ninguém lembrou dele.',
  },
};

const DORES_OFICINA = {
  cegueira: {
    titulo: 'Você não tem o número',
    texto: 'Sem saber quantos orçamentos você manda por semana e quantos viram serviço, não dá pra saber se o problema é preço, é demora, ou é ninguém ter cobrado resposta.',
  },
  orcamento_sem_resposta: {
    titulo: 'Orçamento mandado que fica no vácuo',
    texto: 'Você fotografou a peça, explicou, mandou o valor. O cliente sumiu. E enquanto ele não responde, você não pode nem começar nem liberar o carro.',
  },
  box_travado: {
    titulo: 'Carro parado ocupando elevador',
    texto: 'Essa é a sua dor que nenhum outro negócio tem: a indecisão do cliente ocupa espaço físico. Box parado não é serviço adiado, é o serviço seguinte que não entra.',
  },
  aprovacao_demorada: {
    titulo: 'Achou um problema e o serviço parou',
    texto: 'Abriu, encontrou outra coisa, precisa de aprovação. A mensagem some no meio da conversa e o mecânico fica de mão parada esperando um "pode fazer".',
  },
  status_repetido: {
    titulo: '"Meu carro tá pronto?"',
    texto: 'A mesma pergunta, o dia inteiro, de gente diferente. Cada uma é rápida, e juntas comem a manhã de quem devia estar orçando serviço novo.',
  },
  revisao_esquecida: {
    titulo: 'Consertou e nunca mais chamou',
    texto: 'O cliente volta quando quebra de novo, e às vezes volta pra outro. A próxima revisão tem data previsível e ninguém usa isso pra trazer ele de volta.',
  },
};

export const QUIZ_POR_NICHO = {
  // O genérico de hoje, intocado. É o que responde por toda a camada 2.
  default: {
    perguntas: PERGUNTAS,
    dores: VAZAMENTOS,
    ordemDores: ['cegueira', 'demora', 'sem_dono', 'sem_retomada'],
    total: 7,
  },

  personal: {
    dores: DORES_PERSONAL,
    ordemDores: ['cegueira', 'timing_direct', 'sem_funil', 'plano_sem_fechar', 'renovacao_cega', 'agenda_no_zap'],
    total: 7,
    perguntas: listaLinear([
      {
        id: 'quemResponde',
        texto: 'Quem responde o WhatsApp do seu negócio hoje?',
        opcoes: [
          { valor: 'so_eu',   label: 'Só eu' },
          { valor: 'mais_um', label: 'Eu e mais uma pessoa' },
          { valor: 'equipe',  label: 'Uma equipe, três ou mais' },
          { valor: 'ninguem', label: 'Na prática ninguém dá conta, fica muita coisa sem resposta', peso: ['timing_direct'] },
        ],
      },
      {
        id: 'tempoPlano',
        texto: 'Quando alguém te chama querendo fechar um plano, quanto tempo passa até você responder?',
        ajuda: 'Vale a média de um dia comum, não o seu melhor dia.',
        opcoes: [
          { valor: 'minutos',      label: 'Minutos, respondo quase na hora' },
          { valor: 'poucas_horas', label: 'Uma ou duas horas' },
          { valor: 'a_noite',      label: 'Só quando eu paro, geralmente à noite', peso: ['timing_direct'] },
          { valor: 'dia_seguinte', label: 'Às vezes só no dia seguinte',           peso: ['timing_direct'] },
        ],
      },
      {
        id: 'separaAluno',
        texto: 'Hoje você consegue olhar e saber quem é aluno pagante e quem ainda é só interessado?',
        opcoes: [
          { valor: 'separado', label: 'Sim, tenho isso separado' },
          { valor: 'de_cabeca',label: 'Sei de cabeça, não tá anotado',  peso: ['sem_funil'] },
          { valor: 'tudo_junto',label: 'Tá tudo junto no WhatsApp',     peso: ['sem_funil', 'agenda_no_zap'] },
          { valor: 'caderno',  label: 'Anoto num caderno ou planilha',  peso: ['sem_funil'] },
        ],
      },
      {
        id: 'sumiuValor',
        texto: 'Quando alguém pergunta o valor do plano e some, o que acontece?',
        opcoes: [
          { valor: 'chamo',    label: 'Chamo de volta depois de uns dias' },
          { valor: 'se_lembro',label: 'Chamo se eu lembrar',      peso: ['plano_sem_fechar'] },
          { valor: 'nada',     label: 'Fica por isso mesmo',      peso: ['plano_sem_fechar'] },
          { valor: 'nunca',    label: 'Nunca aconteceu' },
        ],
      },
      {
        id: 'evasao',
        texto: 'Como você percebe que um aluno parou de treinar?',
        opcoes: [
          { valor: 'acompanho', label: 'Tenho acompanhamento e vejo antes' },
          { valor: 'some',      label: 'Quando ele some das aulas',           peso: ['renovacao_cega'] },
          { valor: 'pagamento', label: 'Quando o pagamento não entra',        peso: ['renovacao_cega'] },
          { valor: 'avisa',     label: 'Só quando ele avisa que quer cancelar',peso: ['renovacao_cega'] },
        ],
      },
      {
        id: 'quantosMes',
        texto: 'Se eu te perguntar quantas pessoas te chamaram querendo treinar no mês passado, você me diz agora?',
        opcoes: [
          { valor: 'anotado',    label: 'Sim, tenho anotado' },
          { valor: 'mais_menos', label: 'Sei mais ou menos' },
          { valor: 'nao_ideia',  label: 'Não tenho ideia',   peso: ['cegueira'] },
          { valor: 'nunca_contei',label: 'Nunca contei isso',peso: ['cegueira'] },
        ],
      },
    ]),
  },

  corretor: {
    dores: DORES_CORRETOR,
    ordemDores: ['cegueira', 'corrida_do_primeiro', 'lead_sem_triagem', 'visita_furada', 'imovel_errado_fim', 'sem_origem'],
    total: 7,
    perguntas: listaLinear([
      {
        id: 'quemResponde',
        texto: 'Quem responde o WhatsApp dos seus leads hoje?',
        opcoes: [
          { valor: 'so_eu',   label: 'Só eu' },
          { valor: 'mais_um', label: 'Eu e mais uma pessoa' },
          { valor: 'equipe',  label: 'Uma equipe, três ou mais' },
          { valor: 'ninguem', label: 'Na prática ninguém dá conta, fica muita coisa sem resposta', peso: ['corrida_do_primeiro'] },
        ],
      },
      {
        id: 'tresAoMesmoTempo',
        texto: 'Quando chegam três leads ao mesmo tempo, como você decide quem responder primeiro?',
        opcoes: [
          { valor: 'todos',    label: 'Respondo todos rápido, tenho como' },
          { valor: 'vi_primeiro',label: 'Respondo quem eu vi primeiro',    peso: ['lead_sem_triagem'] },
          { valor: 'feeling',  label: 'Respondo quem parece mais quente, no feeling', peso: ['lead_sem_triagem'] },
          { valor: 'fica_um',  label: 'Sinceramente, acaba ficando um sem resposta',  peso: ['corrida_do_primeiro', 'lead_sem_triagem'] },
        ],
      },
      {
        id: 'perdeuPorAtraso',
        texto: 'Você já perdeu negócio por outro corretor ter respondido antes de você?',
        opcoes: [
          { valor: 'nunca_soube', label: 'Nunca soube' },
          { valor: 'ja',          label: 'Já aconteceu',                    peso: ['corrida_do_primeiro'] },
          { valor: 'direto',      label: 'Acontece direto, é assim que funciona', peso: ['corrida_do_primeiro'] },
          { valor: 'sem_portal',  label: 'Não trabalho com portal' },
        ],
      },
      {
        id: 'visitaFurada',
        texto: 'Das visitas que você marca, quantas o cliente não aparece?',
        opcoes: [
          { valor: 'quase_nenhuma', label: 'Quase nenhuma' },
          { valor: 'uma_em_cinco',  label: 'Uma em cada cinco, mais ou menos', peso: ['visita_furada'] },
          { valor: 'bastante',      label: 'Bastante, perco manhã inteira',    peso: ['visita_furada'] },
          { valor: 'nao_marco',     label: 'Não marco visita por WhatsApp' },
        ],
      },
      {
        id: 'naoGostou',
        texto: 'O cliente viu o imóvel e não gostou. O que acontece com ele?',
        opcoes: [
          { valor: 'sigo',      label: 'Ofereço outros e sigo com ele' },
          { valor: 'esfria',    label: 'Ofereço na hora, depois esfria',   peso: ['imovel_errado_fim'] },
          { valor: 'some',      label: 'Ele some e eu não puxo',           peso: ['imovel_errado_fim'] },
          { valor: 'nem_sei',   label: 'Nem sei dizer quantos estão parados assim', peso: ['imovel_errado_fim', 'cegueira'] },
        ],
      },
      {
        id: 'origemLead',
        texto: 'Você sabe de qual anúncio ou portal veio cada lead que te chamou essa semana?',
        opcoes: [
          { valor: 'todos',     label: 'Sei de todos' },
          { valor: 'alguns',    label: 'Sei de alguns',  peso: ['sem_origem'] },
          { valor: 'nao_sei',   label: 'Não sei',        peso: ['sem_origem', 'cegueira'] },
          { valor: 'nunca_olhei',label: 'Nunca parei pra olhar isso', peso: ['sem_origem', 'cegueira'] },
        ],
      },
    ]),
  },

  dentista: {
    dores: DORES_DENTISTA,
    ordemDores: ['cegueira', 'orcamento_parado', 'cadeira_vazia', 'recepcao_afogada', 'sem_retorno', 'preco_sem_conversa'],
    total: 7,
    perguntas: listaLinear([
      {
        id: 'quemResponde',
        texto: 'Quem responde o WhatsApp da clínica hoje?',
        opcoes: [
          { valor: 'so_eu',   label: 'Só eu' },
          { valor: 'mais_um', label: 'Eu e mais uma pessoa' },
          { valor: 'equipe',  label: 'Uma equipe, três ou mais' },
          { valor: 'ninguem', label: 'Na prática ninguém dá conta, fica muita coisa sem resposta', peso: ['recepcao_afogada'] },
        ],
      },
      {
        id: 'quemOrcamento',
        texto: 'Quando chega um pedido de orçamento no WhatsApp, quem responde e em quanto tempo?',
        opcoes: [
          { valor: 'dedicado',  label: 'Na hora, tem gente dedicada' },
          { valor: 'brecha',    label: 'A recepção responde quando dá uma brecha', peso: ['recepcao_afogada'] },
          { valor: 'eu_mesmo',  label: 'Eu mesmo respondo entre um paciente e outro', peso: ['recepcao_afogada'] },
          { valor: 'fim_do_dia',label: 'Às vezes só no fim do dia', peso: ['recepcao_afogada', 'orcamento_parado'] },
        ],
      },
      {
        id: 'comoPassaValor',
        texto: 'Como o valor do tratamento é passado?',
        opcoes: [
          { valor: 'presencial', label: 'Só presencialmente, depois de avaliar' },
          { valor: 'manda_zap',  label: 'Mando o valor pelo WhatsApp mesmo', peso: ['preco_sem_conversa'] },
          { valor: 'manda_espera',label: 'Mando o valor e espero ele voltar', peso: ['preco_sem_conversa', 'orcamento_parado'] },
          { valor: 'depende',    label: 'Depende do tratamento' },
        ],
      },
      {
        id: 'orcamentoParado',
        texto: 'Um paciente recebeu o orçamento e não voltou. O que acontece?',
        opcoes: [
          { valor: 'rotina',   label: 'Temos rotina de retomada' },
          { valor: 'liga',     label: 'Alguém liga, quando lembra',  peso: ['orcamento_parado'] },
          { valor: 'nada',     label: 'Fica por isso mesmo',         peso: ['orcamento_parado'] },
          { valor: 'nao_sei',  label: 'Não tenho como saber quantos estão nessa situação', peso: ['orcamento_parado', 'cegueira'] },
        ],
      },
      {
        id: 'faltas',
        texto: 'Quantos pacientes faltam sem avisar por semana?',
        opcoes: [
          { valor: 'confirmamos', label: 'Quase nenhum, confirmamos todos' },
          { valor: 'dois_tres',   label: 'Uns dois ou três',                 peso: ['cadeira_vazia'] },
          { valor: 'bastante',    label: 'Bastante, é o meu maior problema', peso: ['cadeira_vazia'] },
          { valor: 'nao_sei',     label: 'Não sei dizer',                    peso: ['cadeira_vazia', 'cegueira'] },
        ],
      },
      {
        id: 'manutencao',
        texto: 'Quem terminou o tratamento é chamado de volta para manutenção?',
        opcoes: [
          { valor: 'controle',  label: 'Sim, temos controle disso' },
          { valor: 'se_procura',label: 'Só se ele procurar',        peso: ['sem_retorno'] },
          { valor: 'deveria',   label: 'Deveria, mas não acontece', peso: ['sem_retorno'] },
          { valor: 'nunca',     label: 'Nunca pensei nisso',        peso: ['sem_retorno'] },
        ],
      },
    ]),
  },

  // --------------------------------------------------------------------------------------
  // Camada 1 nova, 31/08. Três praças cuja dor não cabe no genérico.
  // --------------------------------------------------------------------------------------

  corretor_seguros: {
    dores: DORES_CORRETOR_SEGUROS,
    ordemDores: ['cegueira', 'renovacao_perdida', 'cotacao_parada', 'sinistro_lento', 'carteira_fria', 'uma_apolice_so'],
    total: 7,
    perguntas: listaLinear([
      {
        id: 'quemResponde',
        texto: 'Quem responde o WhatsApp da corretora hoje?',
        opcoes: [
          { valor: 'so_eu',   label: 'Só eu' },
          { valor: 'mais_um', label: 'Eu e mais uma pessoa' },
          { valor: 'equipe',  label: 'Uma equipe, três ou mais' },
          { valor: 'ninguem', label: 'Na prática ninguém dá conta, fica muita coisa sem resposta', peso: ['cotacao_parada'] },
        ],
      },
      {
        id: 'controleRenovacao',
        texto: 'Como você sabe quais apólices vencem no mês que vem?',
        ajuda: 'Vale como funciona de verdade, não como deveria funcionar.',
        opcoes: [
          { valor: 'sistema_meu',  label: 'Tenho um controle meu e aviso com antecedência' },
          { valor: 'seguradora',   label: 'Espero o aviso da seguradora',        peso: ['renovacao_perdida'] },
          { valor: 'planilha',     label: 'Planilha, quando eu lembro de olhar', peso: ['renovacao_perdida'] },
          { valor: 'cliente_avisa',label: 'Na prática o cliente me procura',     peso: ['renovacao_perdida', 'carteira_fria'] },
        ],
      },
      {
        id: 'cotacaoSumiu',
        texto: 'Você mandou a cotação e o cliente não respondeu. O que acontece?',
        opcoes: [
          { valor: 'rotina',    label: 'Tenho rotina de retomar' },
          { valor: 'se_lembro', label: 'Retomo se eu lembrar',   peso: ['cotacao_parada'] },
          { valor: 'nada',      label: 'Fica por isso mesmo',    peso: ['cotacao_parada'] },
          { valor: 'nao_sei',   label: 'Não tenho como saber quantas estão paradas assim', peso: ['cotacao_parada', 'cegueira'] },
        ],
      },
      {
        id: 'sinistroForaHora',
        texto: 'Um cliente avisa sinistro à noite ou no fim de semana. O que acontece com essa mensagem?',
        opcoes: [
          { valor: 'atendo',      label: 'Eu atendo na hora, é prioridade' },
          { valor: 'so_no_dia',   label: 'Vejo só no dia útil seguinte',  peso: ['sinistro_lento'] },
          { valor: 'as_vezes',    label: 'Depende de eu ver a notificação', peso: ['sinistro_lento'] },
          { valor: 'perde',       label: 'Já perdi cliente exatamente assim', peso: ['sinistro_lento', 'carteira_fria'] },
        ],
      },
      {
        id: 'contatoNoAno',
        texto: 'Fora renovação e sinistro, quantas vezes você fala com um cliente da carteira no ano?',
        opcoes: [
          { valor: 'varias',   label: 'Várias, mantenho contato' },
          { valor: 'uma_duas', label: 'Uma ou duas',                    peso: ['carteira_fria'] },
          { valor: 'so_vence', label: 'Só quando a apólice vence',      peso: ['carteira_fria'] },
          { valor: 'nao_sei',  label: 'Não sei dizer',                  peso: ['carteira_fria', 'cegueira'] },
        ],
      },
      {
        id: 'umaApolice',
        texto: 'Você consegue listar agora quais clientes têm só uma apólice com você?',
        opcoes: [
          { valor: 'listo',     label: 'Sim, tenho isso separado' },
          { valor: 'de_cabeca', label: 'Sei de cabeça alguns',  peso: ['uma_apolice_so'] },
          { valor: 'daria',     label: 'Daria trabalho levantar', peso: ['uma_apolice_so'] },
          { valor: 'nao',       label: 'Não, não tenho como',   peso: ['uma_apolice_so', 'cegueira'] },
        ],
      },
    ]),
  },

  veterinario: {
    dores: DORES_VETERINARIO,
    ordemDores: ['cegueira', 'retorno_vacina', 'emergencia_sem_resposta', 'agenda_banho', 'orcamento_exame', 'tutor_some'],
    total: 7,
    perguntas: listaLinear([
      {
        id: 'quemResponde',
        texto: 'Quem responde o WhatsApp da clínica hoje?',
        opcoes: [
          { valor: 'so_eu',   label: 'Só eu' },
          { valor: 'mais_um', label: 'Eu e mais uma pessoa' },
          { valor: 'equipe',  label: 'Uma equipe, três ou mais' },
          { valor: 'ninguem', label: 'Na prática ninguém dá conta, fica muita coisa sem resposta', peso: ['emergencia_sem_resposta'] },
        ],
      },
      {
        id: 'retornoVacina',
        texto: 'Como o tutor fica sabendo que a vacina do animal vence?',
        opcoes: [
          { valor: 'chamamos',   label: 'A gente chama, tem controle disso' },
          { valor: 'cartao',     label: 'Está anotado no cartão, ele que se lembre', peso: ['retorno_vacina'] },
          { valor: 'quando_da',  label: 'Quando alguém lembra de olhar',   peso: ['retorno_vacina'] },
          { valor: 'nao_chama',  label: 'A gente não chama',               peso: ['retorno_vacina', 'tutor_some'] },
        ],
      },
      {
        id: 'foraDoHorario',
        texto: 'Chega uma mensagem de urgência fora do horário. O que acontece?',
        opcoes: [
          { valor: 'plantao',     label: 'Temos plantão e respondemos' },
          { valor: 'vejo_depois', label: 'Vejo quando abro no dia seguinte', peso: ['emergencia_sem_resposta'] },
          { valor: 'se_eu_ver',   label: 'Depende de eu ver no celular',     peso: ['emergencia_sem_resposta'] },
          { valor: 'ja_perdi',    label: 'Já perdi cliente por isso',        peso: ['emergencia_sem_resposta', 'tutor_some'] },
        ],
      },
      {
        id: 'remarcacao',
        texto: 'O tutor desmarca o banho ou a consulta por mensagem. Esse horário é reocupado?',
        opcoes: [
          { valor: 'lista',      label: 'Sim, chamamos alguém da lista de espera' },
          { valor: 'as_vezes',   label: 'Às vezes, se alguém lembrar',   peso: ['agenda_banho'] },
          { valor: 'fica_vago',  label: 'Fica vago mesmo',               peso: ['agenda_banho'] },
          { valor: 'nem_anota',  label: 'Muitas vezes nem chega a ser anotado na agenda', peso: ['agenda_banho', 'cegueira'] },
        ],
      },
      {
        id: 'orcamentoExame',
        texto: 'Você passou o valor de um exame ou cirurgia e o tutor não voltou. E aí?',
        opcoes: [
          { valor: 'retomamos', label: 'A gente retoma depois de uns dias' },
          { valor: 'se_lembrar',label: 'Só se alguém lembrar',   peso: ['orcamento_exame'] },
          { valor: 'nada',      label: 'Fica por isso mesmo',    peso: ['orcamento_exame'] },
          { valor: 'nao_sei',   label: 'Não sei quantos estão parados assim', peso: ['orcamento_exame', 'cegueira'] },
        ],
      },
      {
        id: 'quantosTutores',
        texto: 'Quantos tutores novos chamaram a clínica no mês passado?',
        opcoes: [
          { valor: 'anotado',     label: 'Sei, tenho anotado' },
          { valor: 'mais_menos',  label: 'Sei mais ou menos' },
          { valor: 'nao_ideia',   label: 'Não tenho ideia',    peso: ['cegueira'] },
          { valor: 'nunca_contei',label: 'Nunca contei isso',  peso: ['cegueira'] },
        ],
      },
    ]),
  },

  oficina: {
    dores: DORES_OFICINA,
    ordemDores: ['cegueira', 'orcamento_sem_resposta', 'box_travado', 'aprovacao_demorada', 'status_repetido', 'revisao_esquecida'],
    total: 7,
    perguntas: listaLinear([
      {
        id: 'quemResponde',
        texto: 'Quem responde o WhatsApp da oficina hoje?',
        opcoes: [
          { valor: 'so_eu',   label: 'Só eu' },
          { valor: 'mais_um', label: 'Eu e mais uma pessoa' },
          { valor: 'equipe',  label: 'Uma equipe, três ou mais' },
          { valor: 'ninguem', label: 'Na prática ninguém dá conta, fica muita coisa sem resposta', peso: ['orcamento_sem_resposta'] },
        ],
      },
      {
        id: 'tempoOrcamento',
        texto: 'Depois que você monta o orçamento, quanto tempo até ele chegar no cliente?',
        opcoes: [
          { valor: 'na_hora',     label: 'Mando na hora, com foto' },
          { valor: 'algumas_horas',label: 'Alguma hora do mesmo dia' },
          { valor: 'fim_do_dia',  label: 'Só no fim do dia',        peso: ['orcamento_sem_resposta'] },
          { valor: 'dia_seguinte',label: 'Às vezes só no dia seguinte', peso: ['orcamento_sem_resposta', 'box_travado'] },
        ],
      },
      {
        id: 'carroParado',
        texto: 'O cliente não responde o orçamento. O carro fica onde?',
        ajuda: 'Essa é a pergunta que separa a sua oficina de qualquer outro negócio.',
        opcoes: [
          { valor: 'patio',     label: 'Sai do elevador e vai pro pátio' },
          { valor: 'elevador',  label: 'Fica no elevador esperando',    peso: ['box_travado'] },
          { valor: 'trava',     label: 'Trava o box e atrasa o serviço seguinte', peso: ['box_travado'] },
          { valor: 'nao_sei',   label: 'Não sei dizer quantos estão parados assim agora', peso: ['box_travado', 'cegueira'] },
        ],
      },
      {
        id: 'servicoExtra',
        texto: 'Abriu o carro e achou outro problema. Como sai a aprovação?',
        opcoes: [
          { valor: 'rapido',    label: 'Mando foto e ele aprova rápido' },
          { valor: 'demora',    label: 'Mando e demora horas pra responder', peso: ['aprovacao_demorada'] },
          { valor: 'parado',    label: 'O mecânico fica parado esperando',   peso: ['aprovacao_demorada', 'box_travado'] },
          { valor: 'faco_torco',label: 'Às vezes faço e torço pra ele aceitar', peso: ['aprovacao_demorada'] },
        ],
      },
      {
        id: 'statusCarro',
        texto: 'Quantas vezes por dia alguém pergunta se o carro já está pronto?',
        opcoes: [
          { valor: 'poucas',   label: 'Poucas, a gente já avisa antes' },
          { valor: 'varias',   label: 'Várias, é parte do dia',        peso: ['status_repetido'] },
          { valor: 'o_tempo',  label: 'O tempo todo, atrapalha o serviço', peso: ['status_repetido'] },
          { valor: 'nao_conto',label: 'Nunca parei pra contar',        peso: ['status_repetido', 'cegueira'] },
        ],
      },
      {
        id: 'proximaRevisao',
        texto: 'O cliente fez o serviço e foi embora. Ele é chamado pra próxima revisão?',
        opcoes: [
          { valor: 'chamamos', label: 'Sim, a gente chama' },
          { valor: 'se_lembrar',label: 'Só se alguém lembrar',  peso: ['revisao_esquecida'] },
          { valor: 'ele_volta', label: 'Ele volta quando quebrar de novo', peso: ['revisao_esquecida'] },
          { valor: 'nunca',     label: 'Nunca fizemos isso',    peso: ['revisao_esquecida'] },
        ],
      },
    ]),
  },
};

// Nicho sem lista própria cai no genérico. É a única linha que sustenta a camada 2.
export function resolverQuiz(profissaoId) {
  return QUIZ_POR_NICHO[profissaoId] || QUIZ_POR_NICHO.default;
}
