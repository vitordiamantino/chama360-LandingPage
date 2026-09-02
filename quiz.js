// Motor do quiz da CHAMA 360.
//
// Percorre a árvore de quiz-dados.js, guarda as respostas, monta o diagnóstico e manda tudo
// para /api/quiz. Não conhece nenhum texto de pergunta: se precisar mexer em copy, é lá.

import {
  PRIMEIRA_PERGUNTA, FAIXAS,
  acharProfissao, aplicarVocabulario, resolverQuiz, QUIZ_POR_NICHO,
} from './quiz-dados.js';
import { registrarVisita, lerAtribuicao } from './atribuicao.js';
import { montarVsl } from './vsl.js';

const WHATSAPP = '5511981670838';

// Qual quiz está em jogo. Enquanto a profissão não foi respondida, é o genérico — que é onde a
// pergunta 1 mora. Depois dela, passa a ser o do nicho, ou o genérico de novo se aquele nicho
// for de camada 2. O motor abaixo não precisa saber em qual dos dois está.
function quizAtual() {
  return resolverQuiz(estado.respostas.profissao);
}

// A pergunta 1 mora no genérico, as outras na lista do nicho. Quem volta da pergunta 2 para a 1,
// ou percorre as respostas para montar o diagnóstico, precisa achar as duas — então a busca cai
// no genérico quando o id não está no nicho. Sem isso, voltar para a primeira pergunta trava.
function acharPergunta(id) {
  return quizAtual().perguntas[id] || QUIZ_POR_NICHO.default.perguntas[id];
}

const estado = {
  atual: PRIMEIRA_PERGUNTA,
  respostas: {},        // { id: valor }
  rotulos: {},          // { id: texto da opção, para a planilha ficar legível }
  variantes: {},        // { numero: 'A'|'B'|'C' }
  caminho: [],          // ids visitados, para o botão voltar
  selecionado: null,
  codigo: null,
  enviando: false,
};

// Medição. Os três destinos recebem o mesmo evento, e nenhum deles é obrigatório existir:
// se a tag não estiver instalada, a chamada é ignorada em silêncio.
//
// `profissao` é injetada aqui, em TODO evento, e não em cada chamada. É a dimensão que
// responde "qual nicho converte melhor" e "qual nicho abandona o quiz", e ela decide promoção
// de camada 2 para camada 1. Passar em cada chamada garante que o próximo evento nasça sem
// ela e o relatório fique com um buraco silencioso. Antes da pergunta 1 ainda não há resposta.
function medir(evento, dados = {}) {
  const d = { profissao: estado.respostas.profissao || 'nao_informada', ...dados };
  try { if (typeof window.gtag === 'function') window.gtag('event', evento, d); } catch (e) { /* medição nunca derruba o funil */ }
  try { if (typeof window.fbq === 'function') window.fbq('trackCustom', evento, d); } catch (e) { /* idem */ }
  try {
    if (typeof window.clarity === 'function') {
      // O Clarity não aceita parâmetro no evento: a profissão entra como tag de sessão, que é
      // o que permite filtrar as gravações por nicho.
      window.clarity('set', 'profissao', d.profissao);
      window.clarity('event', evento);
    }
  } catch (e) { /* idem */ }
}

function el(id) { return document.getElementById(id); }

// Gera o código que vai na mensagem do WhatsApp e na planilha, para quem atende achar a linha.
// Letra da profissão mais quatro dígitos. Não é identificador seguro e não precisa ser: serve
// para casar uma conversa com uma linha, e a planilha é a fonte de verdade.
function gerarCodigo(profissaoId) {
  const letra = (acharProfissao(profissaoId).label[0] || 'C').toUpperCase();
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${letra}-${n}`;
}

function perguntaAtual() { return quizAtual().perguntas[estado.atual]; }

function progresso() {
  const p = perguntaAtual();
  return p ? p.numero : quizAtual().total;
}

function renderPergunta() {
  const p = perguntaAtual();
  if (!p) return renderCaptura();

  const prof = estado.respostas.profissao;
  const texto = aplicarVocabulario(p.texto, prof);
  const ajuda = p.ajuda ? aplicarVocabulario(p.ajuda, prof) : '';

  el('quiz-passo').textContent = `Pergunta ${p.numero} de ${quizAtual().total}`;
  el('quiz-barra-fill').style.width = `${(p.numero / quizAtual().total) * 100}%`;
  el('quiz-pergunta').textContent = texto;

  const elAjuda = el('quiz-ajuda');
  elAjuda.textContent = ajuda;
  elAjuda.hidden = !ajuda;

  const lista = el('quiz-opcoes');
  lista.innerHTML = '';
  // Lista longa ganha duas colunas e altura menor. Ver .opcoes-densas em quiz.css.
  lista.classList.toggle('opcoes-densas', p.opcoes.length > 8);
  p.opcoes.forEach((o) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opcao';
    b.textContent = aplicarVocabulario(o.label, prof);
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => escolher(p, o, b));
    lista.appendChild(b);
  });

  el('quiz-voltar').hidden = estado.caminho.length === 0;
  el('quiz-avancar').disabled = true;
  estado.selecionado = null;

  mostrar('quiz');
  medir('quiz_pergunta_vista', { numero: p.numero, pergunta: p.id });
}

function escolher(pergunta, opcao, botao) {
  estado.selecionado = opcao;
  Array.from(el('quiz-opcoes').children).forEach((b) => {
    b.classList.toggle('selecionada', b === botao);
    b.setAttribute('aria-pressed', String(b === botao));
  });
  el('quiz-avancar').disabled = false;
}

function avancar() {
  const p = perguntaAtual();
  const o = estado.selecionado;
  if (!p || !o) return;

  estado.respostas[p.id] = o.valor;
  // `rotulo` quando existe, `label` senão. A pergunta de profissão mostra um texto curto no
  // botão e grava o nome completo na planilha, para não partir o histórico da coluna Profissão
  // nem criar aba de nicho com nome novo.
  estado.rotulos[p.id] = aplicarVocabulario(o.rotulo || o.label, estado.respostas.profissao);
  if (p.variante) estado.variantes[p.numero] = p.variante;
  estado.caminho.push(p.id);

  medir('quiz_resposta', { numero: p.numero, pergunta: p.id, resposta: o.valor });

  const proxima = p.proxima(estado.respostas);
  if (!proxima) {
    estado.codigo = gerarCodigo(estado.respostas.profissao);
    return renderCaptura();
  }
  estado.atual = proxima;
  renderPergunta();
}

function voltar() {
  const anterior = estado.caminho.pop();
  if (!anterior) return;
  const p = acharPergunta(anterior);
  // Apaga o que foi respondido daqui pra frente: mudar uma resposta pode trocar o ramo inteiro,
  // e resposta de um ramo abandonado não pode sobrar na planilha.
  delete estado.respostas[anterior];
  delete estado.rotulos[anterior];
  if (p && p.variante) delete estado.variantes[p.numero];
  estado.atual = anterior;
  renderPergunta();
}

function renderCaptura() {
  el('captura-passo').textContent = `${quizAtual().total} de ${quizAtual().total} respondidas`;
  mostrar('captura');
  medir('quiz_captura_vista');
  setTimeout(() => { const n = el('campo-nome'); if (n) n.focus(); }, 60);
}

// Aceita o que o brasileiro digita: com DDD, com nono dígito ou sem, com máscara ou sem.
// Guarda só dígitos, no formato que o wa.me entende.
function normalizarWhatsapp(bruto) {
  const d = String(bruto || '').replace(/\D/g, '');
  if (d.length < 10 || d.length > 13) return null;
  const sem55 = d.startsWith('55') && d.length > 11 ? d.slice(2) : d;
  if (sem55.length < 10 || sem55.length > 11) return null;
  return `55${sem55}`;
}

function calcularDiagnostico() {
  const marcados = new Set();
  Object.keys(estado.respostas).forEach((idPergunta) => {
    const p = acharPergunta(idPergunta);
    if (!p) return;
    const escolhida = p.opcoes.find((o) => o.valor === estado.respostas[idPergunta]);
    (escolhida && escolhida.peso ? escolhida.peso : []).forEach((w) => marcados.add(w));
  });

  // A cegueira vem primeiro quando existe: não adianta falar de vazamento com quem não
  // consegue medir nenhum.
  const ordem = quizAtual().ordemDores;
  return ordem.filter((k) => marcados.has(k));
}

function renderDiagnostico() {
  const prof = estado.respostas.profissao;
  const achados = calcularDiagnostico();
  const faixa = FAIXAS[estado.respostas.quantos];

  // A cegueira aparece na lista mas não é um vazamento: é a falta de instrumento para enxergar
  // qualquer um deles. O título precisa dizer isso, senão ele conta 1 e a lista mostra 2.
  const temCegueira = achados.includes('cegueira');
  const vazamentosReais = achados.filter((k) => k !== 'cegueira').length;
  const plural = vazamentosReais === 1 ? 'vazamento' : 'vazamentos';

  let titulo;
  if (vazamentosReais > 0 && temCegueira) titulo = `Seu atendimento tem ${vazamentosReais} ${plural}, e um ponto cego.`;
  else if (vazamentosReais > 0)           titulo = `Seu atendimento tem ${vazamentosReais} ${plural}.`;
  else if (temCegueira)                   titulo = 'Seu atendimento tem um ponto cego.';
  else                                    titulo = 'Seu atendimento está mais organizado que a média.';
  el('diag-titulo').textContent = titulo;

  const abertura = el('diag-abertura');
  if (faixa) {
    abertura.textContent = `Pelas suas respostas, ${faixa} te procuram e não fecham nada. Abaixo, por onde elas escapam.`;
  } else if (achados.includes('cegueira')) {
    abertura.textContent = 'Você não sabe quantas pessoas te procuram e não fecham. Esse é o ponto de partida, e vem antes de qualquer outro.';
  } else {
    abertura.textContent = 'Abaixo, o que as suas respostas mostraram.';
  }

  const lista = el('diag-lista');
  lista.innerHTML = '';
  if (achados.length === 0) {
    const li = document.createElement('li');
    li.className = 'vazamento';
    li.innerHTML = '<h3>Nada crítico apareceu aqui</h3><p>Suas respostas não acusaram vazamento óbvio. Nesse caso a conversa é outra: como crescer sem que o atendimento vire gargalo de novo.</p>';
    lista.appendChild(li);
  }
  achados.forEach((k, i) => {
    const v = quizAtual().dores[k];
    const li = document.createElement('li');
    li.className = 'vazamento';
    li.innerHTML = `<span class="vaz-n">${i + 1}</span><div><h3></h3><p></p></div>`;
    li.querySelector('h3').textContent = aplicarVocabulario(v.titulo, prof);
    li.querySelector('p').textContent = aplicarVocabulario(v.texto, prof);
    lista.appendChild(li);
  });

  el('diag-codigo').textContent = estado.codigo;

  const profLabel = acharProfissao(prof).label;
  const msg = `Quero agendar a reunião da CHAMA 360. Sou ${profLabel} e fiz o diagnóstico no site. Código: ${estado.codigo}`;
  const href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  document.querySelectorAll('[data-whatsapp]').forEach((a) => { a.href = href; });

  // O player entra só agora, quando o diagnóstico aparece: não faz sentido carregar vídeo
  // para quem abandona no meio do quiz, e isso é a maioria. `prof` decide qual vídeo, título
  // e legenda: o do nicho quando ele tem gravação própria, o default enquanto não tem.
  montarVsl(el('player-vsl'), medir, prof);

  mostrar('diagnostico');
  medir('quiz_diagnostico_visto', {
    vazamentos: vazamentosReais,
    codigo: estado.codigo,
  });
}

async function enviar(e) {
  e.preventDefault();
  if (estado.enviando) return;

  const nome = el('campo-nome').value.trim();
  const whatsappBruto = el('campo-whatsapp').value.trim();
  const erro = el('captura-erro');

  if (nome.length < 2) {
    erro.textContent = 'Escreve seu nome pra gente saber com quem está falando.';
    erro.hidden = false;
    el('campo-nome').focus();
    return;
  }
  const whatsapp = normalizarWhatsapp(whatsappBruto);
  if (!whatsapp) {
    erro.textContent = 'Confere o WhatsApp: precisa ter DDD, como em 11 98167 0838.';
    erro.hidden = false;
    el('campo-whatsapp').focus();
    return;
  }
  erro.hidden = true;

  estado.enviando = true;
  const botao = el('captura-enviar');
  const textoOriginal = botao.textContent;
  botao.disabled = true;
  botao.textContent = 'Montando seu diagnóstico...';

  const payload = {
    nome,
    whatsapp,
    codigo: estado.codigo,
    respostas: estado.respostas,
    rotulos: estado.rotulos,
    variantes: estado.variantes,
    // A ordem real em que as perguntas foram feitas. Com quiz por nicho, os ids deixam de ser os
    // mesmos para todo mundo, então a planilha não pode mais montar as colunas procurando id
    // conhecido: ela monta pela posição, e é esta lista que diz qual é a posição de quem.
    ordem: estado.caminho.slice(),
    nicho: quizAtual() === QUIZ_POR_NICHO.default ? 'default' : estado.respostas.profissao,
    vazamentos: calcularDiagnostico(),
    utm: Object.fromEntries(new URLSearchParams(location.search).entries()),
    pagina: location.pathname,
    // Origem persistida, não só a da URL atual: quem entrou pelo anúncio, saiu e voltou dias
    // depois para responder o quiz chegaria aqui sem UTM nenhum na barra de endereço.
    atribuicao: lerAtribuicao(),
  };

  // Deixa o último envio visível para a verificação automatizada conferir de qual ponto de
  // entrada o lead veio. É o que sustenta a comparação entre o funil dedicado e o embutido.
  window.__ultimoEnvio = payload;

  try {
    await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    medir('quiz_lead_gravado', { codigo: estado.codigo });
    // `Lead` é o evento PADRÃO da Meta, e vai ao lado do personalizado, não dentro do medir():
    // o helper só faz trackCustom, e mover o track para dentro dele transformaria os sete
    // eventos do quiz em conversão padrão. É por este evento que a campanha otimiza: um
    // trackCustom não serve de objetivo de conjunto sem virar conversão personalizada.
    try { if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { codigo: estado.codigo }); } catch (e) { /* medição nunca derruba o funil */ }
  } catch (err) {
    // A gravação falhou, mas o lead já fez a parte dele. Mostrar o diagnóstico assim mesmo é
    // melhor que travar a página: ele ainda pode clicar no WhatsApp, que é o objetivo real.
    medir('quiz_lead_falhou');
  }

  estado.enviando = false;
  botao.disabled = false;
  botao.textContent = textoOriginal;
  renderDiagnostico();
}

function mostrar(tela) {
  ['quiz', 'captura', 'diagnostico'].forEach((t) => {
    const n = el(`tela-${t}`);
    if (n) n.hidden = t !== tela;
  });
  // Rola até o cartão, e não até o topo do hero: depois de responder, o lead precisa ver o
  // resultado, não a headline que o convenceu a começar.
  const alvo = document.querySelector('.quiz-cartao');
  if (alvo && tela !== 'quiz') alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function iniciar() {
  // Antes de tudo: registrar de onde esta visita veio, mesmo que a pessoa não responda nada.
  registrarVisita();

  el('quiz-avancar').addEventListener('click', avancar);
  el('quiz-voltar').addEventListener('click', voltar);
  el('form-captura').addEventListener('submit', enviar);
  document.querySelectorAll('[data-whatsapp]').forEach((a) => {
    a.addEventListener('click', () => medir('clique_whatsapp', { codigo: estado.codigo || 'sem_quiz' }));
  });
  renderPergunta();
}

// Exportado só para o teste conseguir exercitar a árvore sem browser.
export const _interno = { normalizarWhatsapp, calcularDiagnostico, estado, gerarCodigo, medir };
