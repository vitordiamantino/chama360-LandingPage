// Confere se a planilha do funil está pronta para receber lead.
//
// Rodar SEMPRE depois de um deploy, e sempre que mexer nas colunas. Site no ar não significa
// planilha gravando: a lição veio da Meu Banco Não, onde os dois já andaram separados.
//
// Uso:  node verificar-planilha.mjs
// Exige GOOGLE_SERVICE_ACCOUNT_JSON e SHEET_ID no ambiente.

import { google } from 'googleapis';
import { QUIZ_POR_NICHO } from './quiz-dados.js';
import { abaDoNicho, cabecalhoNicho } from './api/quiz.js';

// A ordem aqui tem que bater com a de montarLinha, em api/quiz.js. Se as duas divergirem,
// a planilha enche de dado trocado de coluna sem nenhum erro aparecer.
const CABECALHO = [
  'Data e hora', 'Nome', 'WhatsApp', 'Código', 'P1 Profissão', 'P2 Quem responde',
  'P3 Resposta', 'P3 Variante', 'P4 Resposta', 'P4 Variante', 'P5 Quantos escapam',
  'P6 Resposta', 'P6 Variante', 'P7 Ferramenta atual', 'Vazamentos',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'Página', 'Profissão (código)',
  'Origem atribuída', 'Criativo atribuído', 'Campanha atribuída', 'Página de entrada',
  // AA e AB entraram no W2, quiz por nicho. Coluna nova sempre no FIM.
  'Respostas (JSON)', 'Quiz respondido',
];

// String.fromCharCode(65 + i) só vale até Z: no índice 26 devolveria "[". Com 28 colunas a
// mensagem de erro apontaria uma coluna que não existe, e mandaria conferir o lugar errado.
function letraDaColuna(i) {
  let n = i, letra = '';
  do { letra = String.fromCharCode(65 + (n % 26)) + letra; n = Math.floor(n / 26) - 1; } while (n >= 0);
  return letra;
}

const problemas = [];
function conferir(condicao, mensagem) {
  if (!condicao) problemas.push(mensagem);
  console.log(`  ${condicao ? 'ok  ' : 'FALHA'} ${mensagem}`);
}

const raw = (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '').trim();
const id = (process.env.SHEET_ID || '').trim();
if (!raw || !id) {
  console.error('Faltam GOOGLE_SERVICE_ACCOUNT_JSON e/ou SHEET_ID no ambiente.');
  process.exit(2);
}

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(raw),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

console.log('\nplanilha do funil CHAMA 360');

const meta = await sheets.spreadsheets.get({ spreadsheetId: id });
const abas = meta.data.sheets.map((s) => s.properties.title);
console.log(`  abas: ${abas.join(' | ')}`);
conferir(abas.length >= 1, 'a planilha tem ao menos uma aba');

// ---------- aba mestre ----------
// A rota grava com prefixo de aba explícito: prefere 'Leads', cai na primeira se ela ainda
// não existir. Confere o cabeçalho no mesmo lugar.
const abaMestre = abas.includes('Leads') ? 'Leads' : abas[0];
conferir(abaMestre === 'Leads', "a aba mestre se chama 'Leads' (senão a rota está caindo na primeira aba por índice)");

const ultimaLetra = letraDaColuna(CABECALHO.length - 1);
const { data: dMestre } = await sheets.spreadsheets.values.get({
  spreadsheetId: id, range: `${abaMestre}!A1:${ultimaLetra}1`,
});
const linha = (dMestre.values && dMestre.values[0]) || [];

conferir(linha.length === CABECALHO.length,
  `a aba mestre tem ${linha.length} colunas de cabeçalho, esperado ${CABECALHO.length}`);

const trocadas = CABECALHO
  .map((esperado, i) => ({ letra: letraDaColuna(i), esperado, veio: (linha[i] || '').trim() }))
  .filter((c) => c.veio !== c.esperado);
conferir(trocadas.length === 0, 'o cabeçalho da mestre está na ordem que a rota grava');
trocadas.forEach((c) => console.log(`        coluna ${c.letra}: esperado "${c.esperado}", veio "${c.veio}"`));

const tudo = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `${abaMestre}!A:A` });
const leads = Math.max(0, ((tudo.data.values || []).length - 1));
console.log(`  leads gravados até agora: ${leads}`);

// ---------- abas por nicho (W4) ----------
// Só existem para a camada 1, e são criadas sozinhas no primeiro lead daquele nicho. Aqui a
// checagem é: se a aba existe, o cabeçalho dela bate com o que a rota escreveria hoje.
const nichos = Object.keys(QUIZ_POR_NICHO).filter((n) => n !== 'default');
for (const nicho of nichos) {
  const titulo = abaDoNicho(nicho);
  if (!abas.includes(titulo)) {
    console.log(`  aba do nicho "${titulo}" ainda não existe (nasce no primeiro lead do nicho)`);
    continue;
  }
  const esperado = cabecalhoNicho(nicho);
  const fim = letraDaColuna(esperado.length - 1);
  const { data } = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `${titulo}!A1:${fim}1` });
  const cab = (data.values && data.values[0]) || [];
  const divergentes = esperado
    .map((exp, i) => ({ letra: letraDaColuna(i), exp, veio: (cab[i] || '').trim() }))
    .filter((c) => c.veio !== c.exp);
  conferir(cab.length === esperado.length && divergentes.length === 0,
    `a aba "${titulo}" tem o cabeçalho que a rota escreve (${esperado.length} colunas)`);
  divergentes.forEach((c) => console.log(`        coluna ${c.letra}: esperado "${c.exp}", veio "${c.veio}"`));
}

console.log(`\n${problemas.length === 0 ? 'PLANILHA OK' : 'PLANILHA COM PROBLEMA:'}`);
problemas.forEach((p) => console.log('  - ' + p));
process.exitCode = problemas.length ? 1 : 0;
