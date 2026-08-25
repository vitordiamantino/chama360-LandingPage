// A VSL: um lugar só para trocar o vídeo.
//
// O bloco do player existe em duas páginas (o funil dedicado e o quiz embutido no institucional).
// Sem este arquivo, trocar o vídeo exigiria editar os dois HTMLs, e esquecer um deixaria metade
// do tráfego vendo o espaço vazio sem ninguém perceber.
//
// COMO PUBLICAR O VÍDEO, quando ele estiver gravado:
//
//   VTurb ......... cole o id do vídeo em `vturbId`. É o que aparece no painel deles, no embed.
//                   Só a VTurb mede o que o método pede: play rate, retenção do lead e o ponto
//                   exato em que a audiência cai. Nenhum outro campo precisa mudar.
//
//   Arquivo MP4 ... deixe `vturbId` vazio e ponha a URL em `arquivo`. Serve para revisão interna
//                   e para o dia em que o vídeo existir antes do plano da VTurb estar ativo.
//                   Não mede retenção, só o play.
//
// Com os dois vazios, o bloco continua mostrando o espaço reservado, que é o estado de hoje.

export const VSL = {
  vturbId: '',   // ex.: '68a1f...'  (preferido: é o que mede retenção)
  arquivo: '',   // ex.: '/assets/vsl-chama-v1.mp4'
  poster: '',    // ex.: '/assets/vsl-capa.jpg'  (primeira imagem, antes do play)

  titulo: 'O que fazer com isso, em 2 minutos',
  legenda: 'Orlando, sócio da ORL360, explica por que isso acontece e como a gente resolve.',
  espacoReservado: 'O vídeo entra aqui assim que for gravado. O bloco já está no lugar certo e na medida certa.',
};

/**
 * Preenche o bloco do player conforme o que estiver configurado acima.
 * Chamado pelo quiz.js quando o diagnóstico aparece, nas duas páginas.
 *
 * @param {HTMLElement} caixa  o elemento #player-vsl
 * @param {function} medir     a função de medição do quiz, para registrar o play
 */
export function montarVsl(caixa, medir) {
  if (!caixa) return;

  if (VSL.vturbId) {
    // O embed da VTurb é um script que se injeta sozinho no div de id correspondente.
    caixa.innerHTML = `<div id="vid_${VSL.vturbId}" style="position:absolute;inset:0;"></div>`;
    const s = document.createElement('script');
    s.src = `https://scripts.converteai.net/${VSL.vturbId}/player.js`;
    s.async = true;
    caixa.appendChild(s);
    if (medir) medir('vsl_player_carregado', { player: 'vturb' });
    return;
  }

  if (VSL.arquivo) {
    const v = document.createElement('video');
    v.src = VSL.arquivo;
    v.controls = true;
    v.playsInline = true;          // no iPhone, sem isto o vídeo abre em tela cheia sozinho
    v.preload = 'metadata';        // não baixa o vídeo inteiro de quem nem vai dar play
    if (VSL.poster) v.poster = VSL.poster;
    v.addEventListener('play', () => medir && medir('vsl_play', { player: 'arquivo' }), { once: true });
    caixa.innerHTML = '';
    caixa.appendChild(v);
    return;
  }

  // Nada configurado ainda: o espaço reservado continua, com a medida certa do vídeo final.
}
