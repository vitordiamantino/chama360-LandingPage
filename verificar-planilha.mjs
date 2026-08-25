// Confere se a planilha do funil está pronta para receber lead.
//
// Rodar SEMPRE depois de um deploy, e sempre que mexer nas colunas. Site no ar não significa
// planilha gravando: a lição veio da Meu Banco Não, onde os dois já andaram separados.
//
// Uso:  node verificar-planilha.mjs
// Exige GOOGLE_SERVICE_ACCOUNT_JSON e SHEET_ID no ambiente.

import { google } from 'googleapis';

// A ordem aqui tem que bater com a de montarLinha, em api/quiz.js. Se as duas divergirem,
// a planilha enche de dado trocado de coluna sem nenhum erro aparecer.
const CABECALHO = [
  'Data e hora', 'Nome', 'WhatsApp', 'Código', 'P1 Profissão', 'P2 Quem responde',
  'P3 Resposta', 'P3 Variante', 'P4 Resposta', 'P4 Variante', 'P5 Quantos escapam',
  'P6 Resposta', 'P6 Variante', 'P7 Ferramenta atual', 'Vazamentos',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'Página', 'Profissão (código)',
  'Origem atribuída', 'Criativo atribuído', 'Campanha atribuída', 'Página de entrada',
];

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

// A rota grava na primeira aba, sem citar nome. Se alguém criar uma aba antes desta, o lead
// passa a cair no lugar errado, e é exatamente isso que esta checagem pega.
const { data } = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: 'A1:Z1' });
const linha = (data.values && data.values[0]) || [];

conferir(linha.length === CABECALHO.length, `a primeira aba tem ${linha.length} colunas de cabeçalho, esperado ${CABECALHO.length}`);

const trocadas = CABECALHO
  .map((esperado, i) => ({ letra: String.fromCharCode(65 + i), esperado, veio: (linha[i] || '').trim() }))
  .filter((c) => c.veio !== c.esperado);
conferir(trocadas.length === 0, 'o cabeçalho está na ordem que a rota grava');
trocadas.forEach((c) => console.log(`        coluna ${c.letra}: esperado "${c.esperado}", veio "${c.veio}"`));

const tudo = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: 'A:A' });
const leads = Math.max(0, ((tudo.data.values || []).length - 1));
console.log(`  leads gravados até agora: ${leads}`);

console.log(`\n${problemas.length === 0 ? 'PLANILHA OK' : 'PLANILHA COM PROBLEMA:'}`);
problemas.forEach((p) => console.log('  - ' + p));
process.exitCode = problemas.length ? 1 : 0;
