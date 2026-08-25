// Grava um lead do quiz na planilha do funil.
//
// Rota pública, como todo formulário de site. O que ela aceita é validado aqui, e não no
// navegador: validação de front é experiência, não segurança.
//
// Mesmo padrão de credencial já usado na Meu Banco Não: o JSON inteiro da conta de serviço
// vive na variável de ambiente GOOGLE_SERVICE_ACCOUNT_JSON, do lado do servidor. Nenhuma chave
// aparece no HTML.

import { google } from 'googleapis';

// Sem nome de aba de propósito: a planilha foi criada por conversão de CSV, e nesse caminho
// o Google escolhe o nome da aba sozinho. Um range sem prefixo grava na primeira aba, o que
// é estável. A contrapartida é que criar uma aba ANTES desta redireciona a gravação, e é por
// isso que verificar-planilha.mjs confere o cabeçalho da primeira aba.
const FAIXA = 'A:Z';
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

function limparTexto(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
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
  const raw = (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '').replace(/^﻿/, '').trim();
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON ausente');
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(raw),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// A ordem aqui é a ordem das colunas da planilha, e mexer nela quebra tudo que veio antes.
// Coluna nova entra no FIM, nunca no meio.
export function montarLinha(corpo, agoraISO) {
  const r = corpo.respostas || {};
  const rot = corpo.rotulos || {};
  const v = corpo.variantes || {};
  const utm = corpo.utm || {};
  const atr = corpo.atribuicao || {};
  return [
    agoraISO,                                  // A  Data e hora
    limparTexto(corpo.nome, 80),               // B  Nome
    `'${normalizarWhatsapp(corpo.whatsapp)}`,  // C  WhatsApp (aspa simples para o Sheets não comer o zero)
    limparTexto(corpo.codigo, 12),             // D  Código do diagnóstico
    limparTexto(rot.profissao, 60),            // E  P1 Profissão
    limparTexto(rot.quemResponde, 90),         // F  P2 Quem responde
    limparTexto(rot.tempoResposta || rot.divisao, 90),                 // G  P3 resposta
    v[3] || '',                                                        // H  P3 variante
    limparTexto(rot.esquecimento || rot.atropelo || rot.depoisQue, 90),// I  P4 resposta
    v[4] || '',                                                        // J  P4 variante
    limparTexto(rot.quantos, 40),              // K  P5 Quantos escapam
    limparTexto(rot.cegueira || rot.retomada, 90),                     // L  P6 resposta
    v[6] || '',                                                        // M  P6 variante
    limparTexto(rot.ferramenta, 60),           // N  P7 Ferramenta atual
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
  ];
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
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: FAIXA,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [montarLinha(corpo, new Date().toISOString())] },
    });
    return res.status(200).json({ ok: true, codigo: limparTexto(corpo.codigo, 12) });
  } catch (e) {
    // O lead já respondeu tudo. Falhar aqui não pode apagar o diagnóstico da tela dele, então
    // o front segue mesmo com erro. O log fica para reconciliação.
    console.error('[quiz] falha ao gravar:', e && e.message);
    return res.status(502).json({ erro: 'gravacao_falhou' });
  }
}
