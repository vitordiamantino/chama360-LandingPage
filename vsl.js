// A VSL: um lugar só para trocar o vídeo, agora com uma entrada por profissão.
//
// O bloco do player existe em duas páginas (o funil dedicado e o quiz embutido no institucional).
// Sem este arquivo, trocar o vídeo exigiria editar os dois HTMLs, e esquecer um deixaria metade
// do tráfego vendo o espaço vazio sem ninguém perceber.
//
// COMO PUBLICAR O VÍDEO DE UM NICHO, quando o Orlando gravar:
//
//   1. Ache a entrada da profissão em VSL_POR_PROFISSAO (personal, corretor, dentista...).
//   2. Cole o id do vídeo em `vturbId`. É o que aparece no painel da VTurb, no embed.
//      Só a VTurb mede o que o método pede: play rate, retenção do lead e o ponto exato de queda.
//   3. Nada mais muda. O título e a legenda daquele nicho já estão aqui, e passam a valer junto.
//
//   Arquivo MP4 ... deixe `vturbId` vazio e ponha a URL em `arquivo`. Serve para revisão interna
//                   e para o dia em que o vídeo existir antes de o plano da VTurb estar ativo.
//
// Enquanto a entrada de um nicho não tem `vturbId` nem `arquivo`, o lead daquele nicho vê o
// vídeo `default`. É o que sustenta a estratégia de camadas: nicho de camada 2 usa o `default`
// sem uma linha de código a mais, e nicho de camada 1 ainda sem gravação também.
//
// Com o `default` também vazio, o bloco continua mostrando o espaço reservado do HTML.

const CORPO_LEGENDA = 'Orlando, sócio da ORL360, explica por que isso acontece e como a gente resolve.';

export const VSL_POR_PROFISSAO = {
  // Vale para todo nicho de camada 2 e para os de camada 1 ainda sem vídeo próprio.
  default: {
    vturbId: '',   // ex.: '68a1f...'  (preferido: é o que mede retenção)
    arquivo: '',   // ex.: '/assets/vsl-chama-v1.mp4'
    poster: '',    // ex.: '/assets/vsl-capa.jpg'  (primeira imagem, antes do play)
    titulo: 'O que fazer com isso, em 2 minutos',
    legenda: CORPO_LEGENDA,
  },

  // Camada 1. Título e legenda sob medida pela dor dominante de cada nicho (W8). O `vturbId`
  // entra quando o Orlando gravar a abertura daquele nicho — até lá, resolverVsl devolve o
  // `default`. Roteiros das aberturas em "CHAMA 360 — W1 Aberturas de VSL por Nicho".
  personal: {
    vturbId: '', arquivo: '', poster: '',
    titulo: 'Por que o aluno esfria antes de você sair da aula',
    legenda: 'Orlando, sócio da ORL360, mostra onde o plano se perde entre o Direct e a sua resposta da noite, e como a CHAMA fecha essa janela.',
  },
  corretor: {
    vturbId: '', arquivo: '', poster: '',
    titulo: 'Por que o lead do portal fecha com quem respondeu primeiro',
    legenda: 'Orlando, sócio da ORL360, explica por que a corrida pelo primeiro contato decide a venda, e como a CHAMA te coloca na frente.',
  },
  dentista: {
    vturbId: '', arquivo: '', poster: '',
    titulo: 'Por que o orçamento aprovado nunca vira tratamento',
    legenda: 'Orlando, sócio da ORL360, mostra onde o orçamento para entre o WhatsApp e a cadeira, e como a CHAMA faz a retomada sozinha.',
  },

  // Entradas de 31/08, uma por profissão da pergunta 1. Roteiro de cada abertura em
  // "VSL - CHAMA 360 (v2, abertura por profissão)". Todas com vturbId vazio: enquanto estiver
  // assim, resolverVsl devolve o `default` e o lead vê a abertura genérica. Publicar uma
  // profissão é colar o id aqui, sem tocar em mais nada.
  corretor_seguros: {
    vturbId: '', arquivo: '', poster: '',
    titulo: 'Por que a apólice vence sem ninguém avisar',
    legenda: 'Orlando, sócio da ORL360, mostra por que a renovação esquecida custa mais que a venda nova, e como a CHAMA avisa antes.',
  },
  veterinario: {
    vturbId: '', arquivo: '', poster: '',
    titulo: 'Por que o tutor some entre uma vacina e a próxima',
    legenda: 'Orlando, sócio da ORL360, mostra por que o retorno anual se perde sem lembrete, e como a CHAMA chama de volta sozinha.',
  },
  oficina: {
    vturbId: '', arquivo: '', poster: '',
    titulo: 'Por que o carro parado no elevador custa mais que o serviço',
    legenda: 'Orlando, sócio da ORL360, mostra por que o orçamento sem resposta trava a oficina, e como a CHAMA destrava.',
  },
  nutri: {
    vturbId: '', arquivo: '', poster: '',
    titulo: 'Por que o paciente faz a primeira consulta e some',
    legenda: 'Orlando, sócio da ORL360, mostra por que o retorno se perde sem ninguém puxar, e como a CHAMA faz isso sozinha.',
  },
  esteticista: {
    vturbId: '', arquivo: '', poster: '',
    titulo: 'Por que o horário desmarcado nunca é reocupado',
    legenda: 'Orlando, sócio da ORL360, mostra o custo do buraco na agenda, e como a CHAMA avisa quem estava esperando.',
  },
  // Advogado: Provimento 205/2021 da OAB. Título e legenda falam de atendimento e prazo, nunca
  // de vender ou fechar mais clientes. Não trocar por linguagem comercial.
  advogado: {
    vturbId: '', arquivo: '', poster: '',
    titulo: 'Por que quem procura advogado não espera até amanhã',
    legenda: 'Orlando, sócio da ORL360, mostra por que o primeiro atendimento decide, e como a CHAMA organiza a entrada de casos.',
  },
  psicologo: {
    vturbId: '', arquivo: '', poster: '',
    titulo: 'Por que a primeira mensagem tem prazo de validade',
    legenda: 'Orlando, sócio da ORL360, mostra por que a demora na primeira resposta custa o paciente inteiro, e como a CHAMA encurta esse tempo.',
  },
  fisio: {
    vturbId: '', arquivo: '', poster: '',
    titulo: 'Por que a série de dez sessões vira seis',
    legenda: 'Orlando, sócio da ORL360, mostra onde a remarcação se perde, e como a CHAMA mantém a série de pé.',
  },
  cabeleireiro: {
    vturbId: '', arquivo: '', poster: '',
    titulo: 'Por que o sábado cheio tem buraco no meio da tarde',
    legenda: 'Orlando, sócio da ORL360, mostra como a agenda se perde entre um cliente e outro, e como a CHAMA segura.',
  },
  medico: {
    vturbId: '', arquivo: '', poster: '',
    titulo: 'Por que você não sabe quantos pacientes desistiram de marcar',
    legenda: 'Orlando, sócio da ORL360, mostra o que não aparece quando outra pessoa responde, e como a CHAMA devolve essa visão.',
  },
  barbearia: {
    vturbId: '', arquivo: '', poster: '',
    titulo: 'Por que a cadeira fica vazia com gente querendo cortar',
    legenda: 'Orlando, sócio da ORL360, mostra o custo do horário desmarcado, e como a CHAMA avisa a fila.',
  },
  pilates: {
    vturbId: '', arquivo: '', poster: '',
    titulo: 'Por que o aluno some três semanas antes de você saber',
    legenda: 'Orlando, sócio da ORL360, mostra por que a evasão aparece tarde demais, e como a CHAMA avisa antes.',
  },
  // Arquiteto: Resolução CAU/BR 52/2013 veda divulgar honorários. Nada de valor aqui.
  arquiteto: {
    vturbId: '', arquivo: '', poster: '',
    titulo: 'Por que a proposta some no meio das conversas',
    legenda: 'Orlando, sócio da ORL360, mostra por que o projeto esfria sem segundo contato, e como a CHAMA guarda o estado de cada proposta.',
  },
  // Contador: NBC PG 01 pede publicidade moderada e veda mercantilização. O argumento é risco
  // operacional, não vender mais.
  contador: {
    vturbId: '', arquivo: '', poster: '',
    titulo: 'Por que o documento se perde e a multa é sua',
    legenda: 'Orlando, sócio da ORL360, mostra por que o anexo some no WhatsApp, e como a CHAMA não deixa passar.',
  },
};

// Entrada com vídeo próprio (vturbId ou arquivo) vence. Sem vídeo, ou id desconhecido, ou antes
// da pergunta 1, cai no `default`. É a única linha que sustenta a estratégia de camadas.
export function resolverVsl(profissaoId) {
  const e = VSL_POR_PROFISSAO[profissaoId];
  return e && (e.vturbId || e.arquivo) ? e : VSL_POR_PROFISSAO.default;
}

/**
 * Preenche o bloco do player conforme a profissão respondida no quiz.
 * Chamado pelo quiz.js quando o diagnóstico aparece, nas duas páginas.
 *
 * @param {HTMLElement} caixa       o elemento #player-vsl
 * @param {function} medir          a função de medição do quiz, para registrar o play
 * @param {string} profissaoId      a profissão respondida na pergunta 1, ou undefined
 */
export function montarVsl(caixa, medir, profissaoId) {
  if (!caixa) return;

  const vsl = resolverVsl(profissaoId);

  // Título e legenda do bloco .vsl, ao lado do player nas duas páginas. Ficam com o texto do
  // nicho quando ele tem vídeo próprio, e com o do default enquanto não tem.
  const elTitulo = document.getElementById('vsl-titulo');
  const elLegenda = document.getElementById('vsl-legenda');
  if (elTitulo) elTitulo.textContent = vsl.titulo;
  if (elLegenda) elLegenda.textContent = vsl.legenda;

  if (vsl.vturbId) {
    // O embed da VTurb é um script que se injeta sozinho no div de id correspondente.
    caixa.innerHTML = `<div id="vid_${vsl.vturbId}" style="position:absolute;inset:0;"></div>`;
    const s = document.createElement('script');
    s.src = `https://scripts.converteai.net/${vsl.vturbId}/player.js`;
    s.async = true;
    caixa.appendChild(s);
    if (medir) medir('vsl_player_carregado', { player: 'vturb', profissao: profissaoId || 'nao_informada' });
    return;
  }

  if (vsl.arquivo) {
    const v = document.createElement('video');
    v.src = vsl.arquivo;
    v.controls = true;
    v.playsInline = true;          // no iPhone, sem isto o vídeo abre em tela cheia sozinho
    v.preload = 'metadata';        // não baixa o vídeo inteiro de quem nem vai dar play
    if (vsl.poster) v.poster = vsl.poster;
    v.addEventListener('play', () => medir && medir('vsl_play', { player: 'arquivo', profissao: profissaoId || 'nao_informada' }), { once: true });
    caixa.innerHTML = '';
    caixa.appendChild(v);
    return;
  }

  // Nada configurado ainda: o espaço reservado do HTML continua, com a medida certa do vídeo.
}
