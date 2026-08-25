// De onde o lead veio: origem, campanha, criativo e página de entrada.
//
// Mesmo desenho já em produção na Meu Banco Não (src/utils/atribuicao.js, 13/08/2026). O motivo
// de existir é o mesmo: sem carregar a origem até a planilha, a Meta mostra que houve conversão
// e ninguém consegue ligar o lead ao anúncio que o gerou. As perguntas que ficam sem resposta
// são as que decidem dinheiro: qual criativo traz quem fecha, e não só quem preenche.
//
// ÚLTIMO CLIQUE VENCE, janela de 30 dias. Quem chega por um anúncio, sai, e volta dias depois
// por outro, é atribuído ao segundo. É a convenção da própria Meta.
//
// SEM UTM TAMBÉM É INFORMAÇÃO. Quem chega direto ou por link da bio não tem campanha, mas tem
// página de entrada. A visita é registrada mesmo assim, desde que não haja registro válido.
//
// NADA AQUI PODE DERRUBAR O LEAD. Todo acesso a storage é protegido. Navegador com storage
// bloqueado (modo privado do iOS, WebView do Instagram) é caso comum no tráfego real: falhar
// aqui significa perder a atribuição de um lead, nunca o lead.

const CHAVE = 'chama_atribuicao';
const JANELA_MS = 30 * 24 * 60 * 60 * 1000;
const LIMITE = 200;

function limpar(valor) {
  if (typeof valor !== 'string') return '';
  // Quebra de linha vira linha nova dentro da célula e desalinha a planilha inteira.
  return valor.replace(/[\r\n\t]+/g, ' ').trim().slice(0, LIMITE);
}

function lerStorage(storage) {
  try {
    const cru = storage && storage.getItem(CHAVE);
    if (!cru) return null;
    const dado = JSON.parse(cru);
    return dado && typeof dado === 'object' ? dado : null;
  } catch {
    return null; // JSON corrompido ou storage bloqueado: trata como vazio
  }
}

function gravarStorage(storage, dado) {
  try {
    storage.setItem(CHAVE, JSON.stringify(dado));
    return true;
  } catch {
    return false; // cota estourada ou storage bloqueado: a visita segue sem atribuição
  }
}

/**
 * Extrai os parâmetros de campanha de uma query string. Função pura, é aqui que mora a regra
 * de qual parâmetro importa.
 *
 * `fbclid` entra como origem quando não há `utm_source`, porque anúncio publicado sem UTM ainda
 * carrega esse parâmetro, e saber "veio do Facebook" é melhor que não saber nada.
 *
 * O criativo aceita `utm_content` e, na falta dele, o `ad_id` que a Meta anexa: os dois
 * respondem a mesma pergunta, que é qual peça trouxe esta pessoa.
 */
export function extrairParametros(busca) {
  let p;
  try {
    p = new URLSearchParams(busca || '');
  } catch {
    return { origem: '', campanha: '', criativo: '' };
  }
  return {
    origem: limpar(p.get('utm_source') || (p.get('fbclid') ? 'facebook' : '')),
    campanha: limpar(p.get('utm_campaign') || p.get('campaign_id') || ''),
    criativo: limpar(p.get('utm_content') || p.get('ad_id') || ''),
  };
}

/**
 * Decide o que fica guardado, dado o que já existe e a visita atual. Função pura de propósito:
 * é a regra inteira, e é o que o teste exercita sem navegador.
 *
 *   - visita COM campanha sempre sobrescreve, porque último clique vence;
 *   - visita SEM campanha só grava se não houver registro válido, e serve para registrar a
 *     página de entrada do tráfego direto ou orgânico;
 *   - registro além da janela é tratado como inexistente.
 */
export function decidirAtribuicao(guardado, visita) {
  const { origem, campanha, criativo, paginaEntrada, agora } = visita;
  const temCampanha = Boolean(origem || campanha || criativo);
  const validoGuardado = guardado
    && typeof guardado.quando === 'number'
    && agora - guardado.quando < JANELA_MS;

  if (!temCampanha && validoGuardado) return null;

  return {
    origem: origem || '',
    campanha: campanha || '',
    criativo: criativo || '',
    paginaEntrada: limpar(paginaEntrada) || '/',
    quando: agora,
  };
}

/** Registra a visita atual. Chamada uma vez, quando a página abre. */
export function registrarVisita(ambiente) {
  const a = ambiente || {};
  const busca = a.busca !== undefined ? a.busca : (typeof window === 'undefined' ? '' : window.location.search);
  const caminho = a.caminho !== undefined ? a.caminho : (typeof window === 'undefined' ? '/' : window.location.pathname);
  const storage = a.storage !== undefined ? a.storage : (typeof window === 'undefined' ? null : window.localStorage);
  const agora = a.agora !== undefined ? a.agora : Date.now();

  const { origem, campanha, criativo } = extrairParametros(busca);
  const novo = decidirAtribuicao(lerStorage(storage), { origem, campanha, criativo, paginaEntrada: caminho, agora });
  if (!novo) return null;
  gravarStorage(storage, novo);
  return novo;
}

/**
 * Lê a atribuição para mandar junto do lead. Devolve sempre as quatro chaves, mesmo vazias,
 * para a linha da planilha nascer com o mesmo formato sempre.
 */
export function lerAtribuicao(ambiente) {
  const a = ambiente || {};
  const storage = a.storage !== undefined ? a.storage : (typeof window === 'undefined' ? null : window.localStorage);
  const agora = a.agora !== undefined ? a.agora : Date.now();

  const guardado = lerStorage(storage);
  const valido = guardado && typeof guardado.quando === 'number' && agora - guardado.quando < JANELA_MS;
  if (!valido) return { origem: '', campanha: '', criativo: '', paginaEntrada: '' };

  return {
    origem: guardado.origem || '',
    campanha: guardado.campanha || '',
    criativo: guardado.criativo || '',
    paginaEntrada: guardado.paginaEntrada || '',
  };
}
