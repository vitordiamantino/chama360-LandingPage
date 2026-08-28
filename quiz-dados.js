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
};

// Nicho sem lista própria cai no genérico. É a única linha que sustenta a camada 2.
export function resolverQuiz(profissaoId) {
  return QUIZ_POR_NICHO[profissaoId] || QUIZ_POR_NICHO.default;
}
