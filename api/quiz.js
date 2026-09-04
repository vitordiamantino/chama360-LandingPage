// Grava um lead do quiz na planilha do funil.
//
// Rota pública, como todo formulário de site. O que ela aceita é validado aqui, e não no
// navegador: validação de front é experiência, não segurança.
//
// Mesmo padrão de credencial já usado na Meu Banco Não: o JSON inteiro da conta de serviço
// vive na variável de ambiente GOOGLE_SERVICE_ACCOUNT_JSON, do lado do servidor. Nenhuma chave
// aparece no HTML.
//
// W4 — duas escritas por lead:
//   1. Aba mestre 'Leads': todo lead, 28 colunas fixas (montarLinha). Fonte de verdade.
//   2. Aba do nicho ('Personal Trainer', 'Corretor de Imóveis', 'Dentista'): só os leads
//      daquele nicho, uma coluna por pergunta do formulário dele, legível sem abrir o JSON.
//      Criada sozinha na primeira vez (garantirAba). Nicho de camada 2 e quiz genérico não
//      geram aba.
// A escrita na aba do nicho nunca derruba a requisição: se ela falhar, o lead já está na
// mestre, que é o que importa.

import { google } from 'googleapis';
import { QUIZ_POR_NICHO, PERGUNTAS, acharProfissao } from '../quiz-dados.js';
import { montarAbordagem } from '../abordagem.js';

const COLUNAS_MESTRE = 'A:AB';   // AA e AB entraram no W2: respostas_json e a lista de perguntas
const UMA_HORA = 60 * 60 * 1000;

// Limitador em memória da instância, no espírito do api/_lib/limiteEnvio.js da MBN. Não é
// distribuído e não pretende ser: segura a rajada barata vinda de poucas origens, que é o caso
// real. Contra IP rotativo não segura, e a planilha já corria esse risco antes.
const eventos = [];
function permitir(chave, agora = Date.now(), maxPorChave = 8, maxGlobal = 120) {
  const limite = agora - UMA_HORA;
  while (eventos.length && eventos[0].em <= limite) eventos.shift();
  if (eventos.length >= maxGlobal) return false;
  if (eventos.filter((e) => e.chave === chave).length >= maxPorChave) return false;
  eventos.push({ chave, em: agora });
  return true;
}

// Sheets interpreta USER_ENTERED começando com =, +, -, @ como fórmula. A rota é pública: um
// POST forjado (bypassando o formulário) pode plantar fórmula em qualquer campo de texto, e ela
// roda quando alguém abrir a planilha. Mesmo truque que o WhatsApp já usa aqui embaixo (aspa
// simples força texto), generalizado para todo campo que passa por limparTexto.
function protegerFormula(v) {
  return /^[=+\-@]/.test(v) ? `'${v}` : v;
}

function limparTexto(v, max) {
  const limpo = String(v == null ? '' : v).replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
  return protegerFormula(limpo);
}

// Mesma regra do front, repetida aqui de propósito. O front pode ser contornado.
function normalizarWhatsapp(bruto) {
  const d = String(bruto || '').replace(/\D/g, '');
  if (d.length < 10 || d.length > 13) return null;
  const sem55 = d.startsWith('55') && d.length > 11 ? d.slice(2) : d;
  if (sem55.length < 10 || sem55.length > 11) return null;
  return `55${sem55}`;
}

async function abrirPlanilha() {
  const raw = (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '').replace(/^\uFEFF/, '').trim();
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON ausente');
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(raw),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// A ordem aqui é a ordem das colunas da aba mestre, e mexer nela quebra tudo que veio antes.
// Coluna nova entra no FIM, nunca no meio.
// Com quiz por nicho, os ids das perguntas deixaram de ser os mesmos para todo mundo: a P3 do
// dentista não se chama como a P3 do genérico. Então as colunas de resposta são montadas pela
// POSIÇÃO em que a pergunta foi feita, e não procurando id conhecido.
//
// Para o quiz genérico o resultado é idêntico ao de antes, porque a ordem dele já era essa. Se
// `ordem` não vier — payload de uma aba aberta antes do deploy —, cai no mapeamento por id
// antigo, senão o lead entraria com as colunas vazias.
function respostaNaPosicao(corpo, i, idsAntigos) {
  const rot = corpo.rotulos || {};
  const ordem = Array.isArray(corpo.ordem) ? corpo.ordem : null;
  if (ordem) return rot[ordem[i]];
  for (const id of idsAntigos) if (rot[id]) return rot[id];
  return '';
}

export function montarLinha(corpo, agoraISO) {
  const r = corpo.respostas || {};
  const rot = corpo.rotulos || {};
  const v = corpo.variantes || {};
  const utm = corpo.utm || {};
  const atr = corpo.atribuicao || {};
  const pos = (i, ...ids) => limparTexto(respostaNaPosicao(corpo, i, ids), 90);
  return [
    agoraISO,                                  // A  Data e hora
    limparTexto(corpo.nome, 80),               // B  Nome
    `'${normalizarWhatsapp(corpo.whatsapp)}`,  // C  WhatsApp (aspa simples para o Sheets não comer o zero)
    limparTexto(corpo.codigo, 12),             // D  Código do diagnóstico
    limparTexto(rot.profissao, 60),            // E  P1 Profissão
    pos(1, 'quemResponde'),                    // F  P2 resposta
    pos(2, 'tempoResposta', 'divisao'),        // G  P3 resposta
    v[3] || '',                                // H  P3 variante
    pos(3, 'esquecimento', 'atropelo', 'depoisQue'), // I  P4 resposta
    v[4] || '',                                // J  P4 variante
    pos(4, 'quantos'),                         // K  P5 resposta
    pos(5, 'cegueira', 'retomada'),            // L  P6 resposta
    v[6] || '',                                // M  P6 variante
    pos(6, 'ferramenta'),                      // N  P7 resposta
    (corpo.vazamentos || []).join(', '),       // O  Vazamentos apontados
    limparTexto(utm.utm_source, 60),           // P
    limparTexto(utm.utm_medium, 60),           // Q
    limparTexto(utm.utm_campaign, 90),         // R
    limparTexto(utm.utm_content, 90),          // S
    limparTexto(utm.utm_term, 90),             // T
    limparTexto(corpo.pagina, 90),             // U  Página de origem
    limparTexto(r.profissao, 20),              // V  Profissão em código, para filtro
    // W a Z: a atribuição guardada no navegador, e não só o que estava na URL na hora de enviar.
    // É o que responde qual criativo trouxe quem realmente fecha, e não só quem preenche. Quem
    // entrou pelo anúncio, saiu e voltou dias depois chegaria aqui sem UTM nenhum na barra.
    // Mesmo desenho já em produção na Meu Banco Não.
    limparTexto(atr.origem, 60),               // W  Origem atribuída (utm_source, ou facebook via fbclid)
    limparTexto(atr.criativo, 200),            // X  Criativo atribuído (utm_content, ou ad_id)
    limparTexto(atr.campanha, 200),            // Y  Campanha atribuída
    limparTexto(atr.paginaEntrada, 90),        // Z  Página em que a pessoa entrou no site
    // AA e AB entram no FIM, nunca no meio: o site grava por letra fixa e inserir coluna no meio
    // desalinha a planilha inteira em silêncio.
    //
    // AA guardava o JSON cru das respostas. Em 03/09 passou a guardar a mensagem pronta de
    // abordagem, a pedido do Vitor: JSON não se usa para atender ninguém, e as respostas seguem
    // legíveis nas colunas E a N, com a AB dizendo qual quiz foi respondido. As linhas gravadas
    // antes desta data continuam com JSON aqui.
    // montarAbordagem monta a partir do nome cru do lead e não passa por limparTexto: precisa
    // da mesma blindagem aplicada aqui na saída, não só nos campos de entrada.
    protegerFormula(montarAbordagem(corpo)),   // AA Abordagem (mensagem pronta pra mandar)
    limparTexto(corpo.nicho, 30),              // AB  Qual lista de perguntas o lead respondeu
  ];
}

// ------------------------------------------------------------------------------------------
// W4 — a aba por nicho
// ------------------------------------------------------------------------------------------

// Colunas de identificação e de rastreio, iguais em toda aba de nicho. Entre as duas ficam as
// perguntas daquele nicho, uma coluna cada. A última fica reservada para o W3 (diagnóstico
// escrito por IA), preenchida vazia por enquanto.
const IDENTIDADE_NICHO = ['Data e hora', 'Nome', 'WhatsApp', 'Código'];
const RASTREIO_NICHO = ['Página', 'Origem atribuída', 'Criativo atribuído', 'Campanha atribuída', 'Diagnóstico completo'];

// O quiz de um nicho tem tamanho fixo DENTRO do nicho, mesmo variando ENTRE nichos. É isso que
// deixa a aba do nicho ter colunas fixas. Nicho de camada 2 (cai no `default`) e quiz genérico
// não têm aba: seus leads vivem só na mestre, com o respostas_json.
function quizDoNicho(nichoId) {
  const quiz = QUIZ_POR_NICHO[nichoId];
  return quiz && quiz !== QUIZ_POR_NICHO.default ? quiz : null;
}

// Nome da aba daquele nicho, ou null se ele não tem aba própria. É o label da profissão, para
// a aba ser legível ("Dentista", "Corretor de Imóveis") em vez de um id.
export function abaDoNicho(nichoId) {
  return quizDoNicho(nichoId) ? acharProfissao(nichoId).label : null;
}

// Cabeçalho da aba do nicho: identidade + uma coluna por pergunta (a de profissão primeiro,
// depois as do nicho na ordem em que são feitas) + rastreio. null para quem não tem aba.
export function cabecalhoNicho(nichoId) {
  const quiz = quizDoNicho(nichoId);
  if (!quiz) return null;
  const doNicho = Object.values(quiz.perguntas).sort((a, b) => a.numero - b.numero);
  const perguntas = [PERGUNTAS.profissao, ...doNicho].map((p) => p.texto);
  return [...IDENTIDADE_NICHO, ...perguntas, ...RASTREIO_NICHO];
}

// Linha da aba do nicho, alinhada com cabecalhoNicho(corpo.nicho). As respostas entram na
// ordem real em que as perguntas foram feitas (corpo.ordem), que para um quiz linear de nicho
// é a mesma ordem do cabeçalho.
export function montarLinhaNicho(corpo, agoraISO) {
  const rot = corpo.rotulos || {};
  const atr = corpo.atribuicao || {};
  const ordem = Array.isArray(corpo.ordem) ? corpo.ordem : [];
  const respostas = ordem.map((id) => limparTexto(rot[id], 90));
  return [
    agoraISO,
    limparTexto(corpo.nome, 80),
    `'${normalizarWhatsapp(corpo.whatsapp)}`,
    limparTexto(corpo.codigo, 12),
    ...respostas,
    limparTexto(corpo.pagina, 90),
    limparTexto(atr.origem, 60),
    limparTexto(atr.criativo, 200),
    limparTexto(atr.campanha, 200),
    '',   // Diagnóstico completo, preenchido pelo W3
  ];
}

// Descobre em qual aba a mestre vive. Prefere a chamada 'Leads'; se ela ainda não existe (a
// planilha nasceu de um CSV, com a aba sem nome), cai na primeira por índice — que é o
// comportamento de hoje. Escrever com prefixo de aba explícito também mata a fragilidade
// antiga: criar aba nova não redireciona mais a gravação.
function nomeDaAbaMestre(meta) {
  const abas = (meta.data.sheets || [])
    .map((s) => s.properties)
    .sort((a, b) => (a.index || 0) - (b.index || 0));
  const leads = abas.find((p) => p.title === 'Leads');
  return (leads || abas[0] || {}).title || null;
}

// Cria a aba do nicho com o cabeçalho, se ela ainda não existir. addSheet entra no fim, então
// a aba mestre continua sendo a primeira.
async function garantirAba(sheets, spreadsheetId, titulo, cabecalho, abasExistentes) {
  if (abasExistentes.includes(titulo)) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: titulo } } }] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${titulo}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [cabecalho] },
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ erro: 'metodo_nao_permitido' });
  }

  const corpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  const nome = limparTexto(corpo.nome, 80);
  const whatsapp = normalizarWhatsapp(corpo.whatsapp);
  if (nome.length < 2) return res.status(400).json({ erro: 'nome_invalido' });
  if (!whatsapp) return res.status(400).json({ erro: 'whatsapp_invalido' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'sem_ip';
  if (!permitir(ip)) return res.status(429).json({ erro: 'muitas_tentativas' });

  try {
    const sheets = await abrirPlanilha();
    const spreadsheetId = process.env.SHEET_ID;
    const agoraISO = new Date().toISOString();

    const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties(title,index)' });
    const abas = (meta.data.sheets || []).map((s) => s.properties.title);
    const abaMestre = nomeDaAbaMestre(meta);

    // 1. A mestre sempre recebe o lead.
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${abaMestre}!${COLUNAS_MESTRE}`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [montarLinha(corpo, agoraISO)] },
    });

    // 2. Se for nicho de camada 1, grava também na aba dele. Nunca derruba a requisição: o
    //    lead já está na mestre.
    const aba = abaDoNicho(corpo.nicho);
    if (aba && Array.isArray(corpo.ordem)) {
      try {
        await garantirAba(sheets, spreadsheetId, aba, cabecalhoNicho(corpo.nicho), abas);
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${aba}!A:A`,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values: [montarLinhaNicho(corpo, agoraISO)] },
        });
      } catch (e2) {
        console.error('[quiz] aba do nicho falhou (lead já está na mestre):', e2 && e2.message);
      }
    }

    return res.status(200).json({ ok: true, codigo: limparTexto(corpo.codigo, 12) });
  } catch (e) {
    // O lead já respondeu tudo. Falhar aqui não pode apagar o diagnóstico da tela dele, então
    // o front segue mesmo com erro. O log fica para reconciliação.
    console.error('[quiz] falha ao gravar:', e && e.message);
    return res.status(502).json({ erro: 'gravacao_falhou' });
  }
}
