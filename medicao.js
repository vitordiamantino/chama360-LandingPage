// Medição da CHAMA 360: GA4, Meta Pixel e Microsoft Clarity.
//
// PREENCHER OS TRÊS IDs ABAIXO e as duas páginas passam a medir sozinhas. É o único lugar:
// tanto o funil (index.html) quanto o institucional com o quiz embutido (sobre.html) carregam
// este arquivo, então não existe risco de uma página estar medindo e a outra não.
//
// Enquanto os IDs estiverem vazios, nenhum script de terceiro é carregado. A página não quebra
// e não fica com tag pela metade, que é pior que não ter tag nenhuma: instalado não é o mesmo
// que medindo, e uma tag incompleta faz o número parecer real sem ser.

window.MEDICAO = {
  ga4: '',      // ex.: G-XXXXXXXXXX
  pixel: '',    // ex.: 123456789012345
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

  if (m.clarity) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', m.clarity);
  }
})();
