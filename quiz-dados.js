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
