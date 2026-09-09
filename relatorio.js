// Renderizador único do documento de diagnóstico. Usado pela tela do quiz (quiz.js) e pela
// página /relatorio (relatorio.html), para as duas nunca divergirem.
//
// Também empacota/desempacota os dados do lead no fragmento da URL (#d=...), que é como o
// /relatorio recebe o caso e como o link vai para a planilha e para a mensagem do WhatsApp.
// O fragmento nunca chega ao servidor: é lido só no navegador.

import { montarPlano } from './plano.js';

// ------------------------------------------------------------------------------------------
// Empacotar / desempacotar. base64url do JSON, para caber num fragmento de URL sem escapar.
// ------------------------------------------------------------------------------------------

function b64encode(str) {
  if (typeof Buffer !== 'undefined') return Buffer.from(str, 'utf8').toString('base64');
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
}

function b64decode(b64) {
  if (typeof Buffer !== 'undefined') return Buffer.from(b64, 'base64').toString('utf8');
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

const CAMPOS = ['profissao', 'respostas', 'rotulos', 'nome', 'codigo', 'data'];

export function empacotar(dados) {
  const enxuto = {};
  CAMPOS.forEach((k) => { if (dados && dados[k] != null) enxuto[k] = dados[k]; });
  const b64 = b64encode(JSON.stringify(enxuto));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function desempacotar(fragmento) {
  try {
    let s = String(fragmento || '').replace(/^#/, '');
    s = s.replace(/^d=/, '');
    if (!s) return null;
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const obj = JSON.parse(b64decode(s));
    if (!obj || typeof obj !== 'object') return null;
    return obj;
  } catch (e) {
    return null;
  }
}

// ------------------------------------------------------------------------------------------
// Render
// ------------------------------------------------------------------------------------------

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// esc primeiro; os ** do texto de origem não são escapados e viram <strong>.
function rico(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

// Monta o HTML do documento. `opts.whatsappHref` e `opts.pdfHref`, quando dados, ligam os
// botões do fechamento. Sem eles, o fechamento sai sem os links (caso do teste).
export function htmlDoDiagnostico(plano, opts = {}) {
  const p = plano || {};
  const zap = opts.whatsappHref ? esc(opts.whatsappHref) : '';
  const pdf = opts.pdfHref ? esc(opts.pdfHref) : '';

  const espelho = (p.espelho || []).map((t) => `<p>${esc(t)}</p>`).join('');

  const pontoForte = (p.pontoForte || []).length
    ? `<div class="diag-secao ponto-forte">
         <h3>O que você já tem</h3>
         ${p.pontoForte.map((t) => `<p>${esc(t)}</p>`).join('')}
       </div>`
    : '';

  const dores = (p.dores || []).map((d) => `
    <li class="vazamento">
      <div><h4>${esc(d.titulo)}</h4><p>${rico(d.texto).replace(/^<strong>.+?<\/strong>\s*/, '')}</p></div>
    </li>`).join('');

  const fases = (p.fases || []).map((f) => `
    <div class="diag-fase">
      <h4>${esc(f.titulo)}</h4>
      <p>${esc(f.texto)}</p>
      ${(f.fecha || []).length ? `<p class="diag-fecha">No seu caso, isso fecha: ${f.fecha.map(esc).join(', ')}.</p>` : ''}
    </div>`).join('');

  const evidencia = (p.evidencia || []).map((t) => `<li>${rico(t)}</li>`).join('');

  const pr = p.planoRecomendado;
  const planoRec = pr
    ? `<div class="diag-secao diag-plano">
         <h3>O plano que resolve o seu caso</h3>
         <p class="diag-plano-nome"><strong>${esc(pr.nome)}</strong><span>${esc(pr.preco)}</span></p>
         <p>${esc(pr.porque)}</p>
       </div>`
    : '';

  const fechamento = `
    <div class="fechamento">
      <h3>O próximo passo</h3>
      <p>${esc(p.call)}</p>
      ${zap ? `<a class="btn-quiz btn-zap" data-whatsapp href="${zap}" target="_blank" rel="noopener">Agendar 20 minutos pelo WhatsApp</a>` : ''}
      ${pdf ? `<a class="btn-quiz btn-texto" id="diag-baixar-pdf" href="${pdf}" target="_blank" rel="noopener">Baixar este diagnóstico em PDF</a>` : ''}
      <p class="garantia">A conversa é sem compromisso, e quem contrata pode cancelar livremente nos primeiros 30 dias.</p>
      <a class="saida" href="/">
        <span class="saida-t">Prefere conhecer a plataforma antes de conversar?</span>
        <span class="saida-s">Ver a CHAMA 360 por dentro: telas, recursos e como funciona</span>
      </a>
    </div>`;

  return `
    <div class="diag-topo">
      <p class="diag-cab">Diagnóstico do seu atendimento no WhatsApp<br>
        <span>${esc(p.nome)} · ${esc(p.profissao)} · ${esc(p.databr)} · código ${esc(p.codigo)}</span>
      </p>
      <h2 id="diag-titulo">${esc(p.titulo)}</h2>
    </div>
    <div class="quiz-cartao-corpo diag-doc">
      <div class="diag-secao diag-espelho">${espelho}</div>
      ${pontoForte}
      <div class="diag-secao">
        <h3>Onde vaza cliente</h3>
        <ul class="vazamentos">${dores}</ul>
      </div>
      <div class="diag-secao diag-fases">
        <h3>Seu plano de 90 dias com a CHAMA</h3>
        ${fases}
      </div>
      ${planoRec}
      <div class="diag-secao diag-evidencia">
        <h3>Por que isso se resolve com a CHAMA e não com disciplina</h3>
        ${p.evidenciaIntro ? `<p class="diag-evid-intro">${esc(p.evidenciaIntro)}</p>` : ''}
        <ul>${evidencia}</ul>
      </div>
      <div class="diag-secao diag-meta">
        <h3>Meta dos 90 dias</h3>
        <p>${esc(p.meta)}</p>
      </div>
      <div class="codigo">
        <span>Código do seu diagnóstico:</span>
        <b id="diag-codigo">${esc(p.codigo)}</b>
        <span>guarde, ele abre a conversa no ponto certo</span>
      </div>
      ${fechamento}
    </div>`;
}

// Injeta o documento em `alvo`. `dadosOuPlano` pode ser o objeto empacotado (com `respostas`)
// ou um plano já montado. `opts` liga os botões.
export function renderDiagnostico(alvo, dadosOuPlano, opts = {}) {
  if (!alvo) return;
  const plano = dadosOuPlano && dadosOuPlano.respostas ? montarPlano(dadosOuPlano) : dadosOuPlano;
  alvo.innerHTML = htmlDoDiagnostico(plano, opts);
}
