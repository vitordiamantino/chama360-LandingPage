// Medição da CHAMA 360: GA4, Meta Pixel e Microsoft Clarity (o Clarity só depois do aceite no aviso de cookies).
//
// PREENCHER OS TRÊS IDs ABAIXO e as duas páginas passam a medir sozinhas. É o único lugar:
// tanto o funil (index.html) quanto o institucional com o quiz embutido (sobre.html) carregam
// este arquivo, então não existe risco de uma página estar medindo e a outra não.
//
// Enquanto os IDs estiverem vazios, nenhum script de terceiro é carregado. A página não quebra
// e não fica com tag pela metade, que é pior que não ter tag nenhuma: instalado não é o mesmo
// que medindo, e uma tag incompleta faz o número parecer real sem ser.

window.MEDICAO = {
  ga4: 'G-PD9HENWP60',  // property CHAMA 360 | Site
  pixel: '5511785592379405',  // conjunto de dados CHAMA 360 - Site
  clarity: 'y8gz8epb71',  // projeto CHAMA 360 no Microsoft Clarity
};

(function () {
  var m = window.MEDICAO || {};

  if (m.ga4) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + m.ga4;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', m.ga4);
  }

  if (m.pixel) {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', m.pixel);
    window.fbq('track', 'PageView');
  }

  // Clarity grava a navegação: só liga DEPOIS do "Aceitar" no aviso (issue #1, parecer do jurídico de 04/11/2026).
  // A escolha fica no navegador ('sim' ou 'nao'), sem dado pessoal. Sem escolha ainda, mostra o aviso e não grava nada.
  if (m.clarity) {
    var escolha = lerEscolha();
    if (escolha === 'sim') ligarClarity(m.clarity);
    else if (escolha !== 'nao') {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { mostrarAviso(m.clarity); });
      else mostrarAviso(m.clarity);
    }
  }
})();

function lerEscolha() {
  try { return localStorage.getItem('chama-gravacao'); } catch (e) { return null; }
}

function ligarClarity(id) {
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', id);
}

// Aviso no rodapé: "Recusar" e "Aceitar" do mesmo tamanho (o jurídico pede recusa tão visível quanto o aceite).
function mostrarAviso(id) {
  var css = document.createElement('style');
  css.textContent =
    '.ck-aviso{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:9999;' +
    'max-width:560px;margin:0 auto;padding:18px 18px 16px;border-radius:18px;background:#14100B;color:#FAF7F2;' +
    'font:400 16px/1.45 Geist,-apple-system,"Segoe UI",Arial,sans-serif;box-shadow:0 18px 50px rgba(0,0,0,.35);' +
    'border:1px solid rgba(250,247,242,.10);opacity:0;transform:translateY(16px);' +
    'transition:opacity 240ms cubic-bezier(.2,.8,.2,1),transform 240ms cubic-bezier(.2,.8,.2,1)}' +
    '.ck-aviso.ck-dentro{opacity:1;transform:none}' +
    '.ck-aviso p{margin:0 0 14px}.ck-aviso a{color:#F5A623;text-underline-offset:3px}' +
    '.ck-botoes{display:flex;gap:10px}' +
    '.ck-botoes button{flex:1;min-height:48px;border:0;border-radius:12px;font:600 16px/1 Geist,-apple-system,"Segoe UI",Arial,sans-serif;' +
    'cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;transition:transform 120ms ease-out}' +
    '.ck-botoes button:active{transform:scale(.97)}' +
    '.ck-botoes button:focus-visible{outline:3px solid #F5A623;outline-offset:2px}' +
    '.ck-recusar{background:#FAF7F2;color:#0E0B08}.ck-aceitar{background:#E8590C;color:#fff}' +
    '@media (hover:hover) and (pointer:fine){.ck-recusar:hover{background:#F3EEE5}.ck-aceitar:hover{background:#C43C08}}' +
    '@media (prefers-reduced-motion:reduce){.ck-aviso,.ck-botoes button{transition:none}}';
  document.head.appendChild(css);

  var aviso = document.createElement('section');
  aviso.className = 'ck-aviso';
  aviso.setAttribute('role', 'region');
  aviso.setAttribute('aria-label', 'Aviso de cookies');
  aviso.innerHTML =
    '<p>Podemos gravar sua navegação aqui? Usamos o Microsoft Clarity para ver cliques e rolagem e entender onde a página ' +
    'confunde. Só ligamos se você aceitar. <a href="/privacidade">Política de Privacidade</a></p>' +
    '<div class="ck-botoes"><button type="button" class="ck-recusar">Recusar</button>' +
    '<button type="button" class="ck-aceitar">Aceitar</button></div>';
  document.body.appendChild(aviso);
  requestAnimationFrame(function () { requestAnimationFrame(function () { aviso.classList.add('ck-dentro'); }); });

  function escolher(v) {
    try { localStorage.setItem('chama-gravacao', v); } catch (e) { /* navegador sem armazenamento: vale só nesta página */ }
    if (v === 'sim') ligarClarity(id);
    aviso.classList.remove('ck-dentro');
    setTimeout(function () { aviso.remove(); }, 260);
  }
  aviso.querySelector('.ck-recusar').addEventListener('click', function () { escolher('nao'); });
  aviso.querySelector('.ck-aceitar').addEventListener('click', function () { escolher('sim'); });
}
