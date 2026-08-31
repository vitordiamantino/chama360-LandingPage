// Verificação de verdade: abre a página num navegador, percorre o quiz inteiro clicando,
// e captura o que aparece. Contar elemento no HTML não prova nada, a lição já custou caro antes.
//
// Uso: node verificar-visual.mjs [http://localhost:8899]

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
// Importado, e não cravado: a contagem de profissões muda toda vez que uma praça nova entra, e
// número cravado aqui falha na próxima adição em vez de na hora em que a tela estiver errada.
import { PROFISSOES } from './quiz-dados.js';

const BASE = process.argv[2] || 'http://localhost:8899';
const SAIDA = process.env.SAIDA || './_capturas';
mkdirSync(SAIDA, { recursive: true });

const problemas = [];
function conferir(condicao, mensagem) {
  if (!condicao) problemas.push(mensagem);
  console.log(`  ${condicao ? 'ok  ' : 'FALHA'} ${mensagem}`);
}

// Escolhe a opção pelo texto que ela mostra, que é o que o lead faz.
async function responder(page, textoParcial) {
  const botao = page.locator('#quiz-opcoes .opcao', { hasText: textoParcial }).first();
  await botao.waitFor({ state: 'visible', timeout: 5000 });
  await botao.click();
  await page.locator('#quiz-avancar').click();
  await page.waitForTimeout(120);
}

// textContent, e não innerText, de propósito: innerText devolve o texto já com o
// text-transform do CSS aplicado, e um seletor em maiúsculas faria a comparação falhar
// mesmo com a página certa na tela.
async function textoDe(page, sel) {
  const t = await page.locator(sel).first().textContent();
  return String(t || '').replace(/\s+/g, ' ').trim();
}

// Usa o Edge que já está instalado na máquina, em vez de baixar um Chromium só para isto.
const navegador = await chromium.launch({ channel: 'msedge' }).catch(() => chromium.launch());

// ---------- desktop, caminho de quem atende sozinho e responde tarde ----------
console.log('\ndesktop, caminho "sozinho e devagar"');
const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errosConsole = [];
page.on('pageerror', (e) => errosConsole.push(String(e)));
// O servidor estático de teste não implementa POST, então o 501 em /api/quiz é esperado aqui
// e não é defeito da página. A gravação de verdade só dá para exercitar com credencial.
page.on('console', (m) => {
  const t = m.text();
  const esperado = t.includes('api/quiz') || t.includes('501') || t.includes('Failed to load resource');
  if (m.type() === 'error' && !esperado) errosConsole.push(t);
});

await page.goto(`${BASE}/index.html?utm_source=ig&utm_campaign=dentista-dor`, { waitUntil: 'networkidle' });
// A fonte precisa ter carregado antes de medir qualquer coisa de layout.
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(250);

conferir((await textoDe(page, '#quiz-passo')).includes('1 de 7'), 'abre na pergunta 1 de 7');
conferir((await textoDe(page, '#quiz-pergunta')).length > 10, 'a pergunta 1 tem texto');
conferir(await page.locator('#quiz-opcoes .opcao').count() === PROFISSOES.length, `a pergunta 1 mostra as ${PROFISSOES.length} profissões`);
conferir(await page.locator('#quiz-voltar').isHidden(), 'o botão voltar não aparece na primeira pergunta');

// Quem cai aqui e quer conhecer o produto antes de responder precisa achar a porta sem procurar.
const linkTopo = page.locator('.topo a.link');
conferir(await linkTopo.isVisible(), 'o acesso à plataforma aparece no topo, sem precisar rolar');
conferir((await linkTopo.getAttribute('href')) === '/sobre', 'o link do topo aponta para o institucional em /sobre');
conferir(await page.locator('#quiz-avancar').isDisabled(), 'continuar começa desabilitado, sem resposta escolhida');

// O quiz precisa estar visível sem rolar. Se a primeira pergunta ficar abaixo da dobra,
// o funil inteiro perde gente antes de começar.
const dobra = await page.locator('#quiz-opcoes').boundingBox();
conferir(dobra && dobra.y < 900, `a primeira pergunta aparece sem rolar a página (y=${Math.round(dobra?.y ?? -1)})`);

await page.screenshot({ path: `${SAIDA}/01-desktop-abertura.png`, fullPage: true });

await responder(page, 'Dentista');
conferir((await textoDe(page, '#quiz-passo')).includes('2 de 7'), 'avança para a pergunta 2');
conferir(!(await page.locator('#quiz-voltar').isHidden()), 'o botão voltar aparece a partir da pergunta 2');

await responder(page, 'Só eu');
const p3 = await textoDe(page, '#quiz-pergunta');
conferir((await textoDe(page, '#quiz-passo')).includes('3 de 7'), 'chega na pergunta 3');
conferir(p3.includes('orçamento') || p3.includes('quanto tempo'), `a pergunta 3 usa o vocabulário do dentista: "${p3}"`);
conferir(!p3.includes('{'), 'nenhum placeholder cru sobrou na tela');
await page.screenshot({ path: `${SAIDA}/02-desktop-pergunta3.png`, fullPage: true });

// Voltar precisa funcionar de verdade, e não só existir.
await page.locator('#quiz-voltar').click();
await page.waitForTimeout(150);
conferir((await textoDe(page, '#quiz-passo')).includes('2 de 7'), 'voltar leva de fato para a pergunta anterior');
conferir(await page.locator('#quiz-avancar').isDisabled(), 'ao voltar, continuar volta a ficar desabilitado');
await responder(page, 'Só eu');

// Daqui em diante o dentista percorre o quiz PRÓPRIO dele, do W2: nenhuma dessas perguntas
// existe no quiz genérico. Se o motor tivesse caído no default, nenhum destes textos apareceria.
await responder(page, 'brecha');
conferir((await textoDe(page, '#quiz-passo')).includes('4 de 7'), 'chega na pergunta 4');
await responder(page, 'Mando o valor pelo WhatsApp mesmo');
conferir((await textoDe(page, '#quiz-passo')).includes('5 de 7'), 'chega na pergunta 5');
await responder(page, 'Fica por isso mesmo');
conferir((await textoDe(page, '#quiz-passo')).includes('6 de 7'), 'chega na pergunta 6');
const p6Dentista = await textoDe(page, '#quiz-pergunta');
conferir(p6Dentista.includes('faltam sem avisar'), `a pergunta 6 é a de faltas, do dentista: "${p6Dentista}"`);
await responder(page, 'é o meu maior problema');
conferir((await textoDe(page, '#quiz-passo')).includes('7 de 7'), 'chega na pergunta 7');
await responder(page, 'Só se ele procurar');

// ---------- captura ----------
console.log('\ntela de captura');
conferir(await page.locator('#tela-captura').isVisible(), 'a captura aparece depois das 7 perguntas');
conferir(await page.locator('#tela-quiz').isHidden(), 'as perguntas somem quando a captura aparece');
await page.screenshot({ path: `${SAIDA}/03-desktop-captura.png`, fullPage: true });

// Validação: o formulário não pode deixar passar lixo.
await page.locator('#captura-enviar').click();
await page.waitForTimeout(120);
conferir(await page.locator('#captura-erro').isVisible(), 'enviar vazio mostra erro em vez de seguir');

await page.locator('#campo-nome').fill('Ana Paula');
await page.locator('#campo-whatsapp').fill('123');
await page.locator('#captura-enviar').click();
await page.waitForTimeout(120);
const erroTel = await textoDe(page, '#captura-erro');
conferir(erroTel.includes('WhatsApp'), `telefone curto é barrado: "${erroTel}"`);

await page.locator('#campo-whatsapp').fill('(11) 98167-0838');
await page.locator('#captura-enviar').click();
// A rota /api/quiz não existe no servidor estático. O diagnóstico precisa aparecer assim mesmo:
// falha de gravação não pode travar o lead.
await page.waitForSelector('#tela-diagnostico:not([hidden])', { timeout: 8000 });

// ---------- diagnóstico ----------
console.log('\ndiagnóstico');
const titulo = await textoDe(page, '#diag-titulo');
const abertura = await textoDe(page, '#diag-abertura');
const vazamentos = await page.locator('#diag-lista .vazamento').count();
conferir(titulo.includes('vazamento'), `o título nomeia os vazamentos: "${titulo}"`);
conferir(vazamentos >= 2, `mostra ${vazamentos} vazamentos, esperado ao menos 2 nesse caminho`);
conferir(!abertura.includes('{') && !titulo.includes('{'), 'nenhum placeholder cru no diagnóstico');

// A prova de que o diagnóstico é o do nicho, e não o genérico: estes títulos só existem nas
// dores do dentista. Se o motor tivesse caído no default, viriam "demora" e "sem_dono".
const doresNaTela = await textoDe(page, '#diag-lista');
conferir(doresNaTela.includes('Falta sem aviso'), 'o diagnóstico traz a cadeira vazia, que é dor do dentista');
conferir(doresNaTela.includes('Orçamento passado'), 'o diagnóstico traz o orçamento parado, que é dor do dentista');
conferir(!doresNaTela.includes('Nenhuma conversa tem dono'), 'nenhuma dor genérica pode vazar para um nicho com quiz próprio');

const codigo = await textoDe(page, '#diag-codigo');
conferir(/^D-\d{4}$/.test(codigo), `o código começa com a letra da profissão: "${codigo}"`);

const href = await page.locator('a[data-whatsapp]').first().getAttribute('href');
conferir(href.includes('wa.me/5511981670838'), 'o botão aponta para o WhatsApp certo');
conferir(decodeURIComponent(href).includes(codigo), 'a mensagem do WhatsApp leva o código do diagnóstico');
conferir(decodeURIComponent(href).includes('Dentista'), 'a mensagem do WhatsApp leva a profissão');
conferir(!decodeURIComponent(href).includes('Ana Paula'), 'a mensagem não usa o nome do lead, conforme a regra de primeiro contato');

const player = await page.locator('#player-vsl').boundingBox();
conferir(player && player.height > 150, `o bloco da VSL está montado e com altura real (${Math.round(player?.height ?? 0)}px)`);

// Quem terminou o quiz e ainda não quer falar com ninguém precisa de uma saída. Sem ela, a
// única porta depois do diagnóstico é o WhatsApp, e quem não está pronto fecha a aba.
const saida = page.locator('.saida');
conferir(await saida.isVisible(), 'existe uma saída para a plataforma depois do diagnóstico');
conferir((await saida.getAttribute('href')) === '/sobre', 'a saída aponta para o institucional em /sobre');
const caixaSaida = await saida.boundingBox();
const caixaZap = await page.locator('a[data-whatsapp]').first().boundingBox();
conferir(caixaSaida && caixaZap && caixaSaida.y > caixaZap.y, 'a saída fica depois do botão do WhatsApp, não concorrendo com ele');

// A atribuição precisa ter sido guardada na entrada, e não só lida no envio.
const guardado = await page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem('chama_atribuicao') || 'null'); } catch { return null; }
});
conferir(guardado && guardado.origem === 'ig', `a origem da visita foi guardada no navegador: ${JSON.stringify(guardado)}`);
conferir(guardado && guardado.campanha === 'dentista-dor', 'a campanha da URL foi guardada junto');

await page.screenshot({ path: `${SAIDA}/04-desktop-diagnostico.png`, fullPage: true });

// ---------- mobile, outro caminho: equipe sem regra ----------
console.log('\nmobile, caminho "equipe sem regra"');
const ctxM = await navegador.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const m = await ctxM.newPage();
m.on('pageerror', (e) => errosConsole.push('mobile: ' + String(e)));
await m.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });
await m.evaluate(() => document.fonts.ready);
await m.waitForTimeout(250);

const dobraM = await m.locator('#quiz-opcoes').boundingBox();
conferir(dobraM && dobraM.y < 844, `no celular a primeira pergunta também aparece sem rolar (y=${Math.round(dobraM?.y ?? -1)})`);
await m.screenshot({ path: `${SAIDA}/05-mobile-abertura.png`, fullPage: true });

// Personal Trainer é o nicho com prova de carteira, e desde o W2 tem quiz próprio. Este caminho
// escolhe de propósito as respostas que acusam cegueira, para conferir que ela aparece primeiro
// no diagnóstico mesmo tendo sido a última pergunta respondida.
await responder(m, 'Personal Trainer');
await responder(m, 'Uma equipe');
const p3m = await textoDe(m, '#quiz-pergunta');
conferir(p3m.includes('fechar um plano'), `a pergunta 3 é a de plano, do personal: "${p3m}"`);
await responder(m, 'geralmente à noite');
const p4m = await textoDe(m, '#quiz-pergunta');
conferir(p4m.includes('aluno pagante'), `a pergunta 4 separa aluno de interessado: "${p4m}"`);
conferir(p4m.includes('aluno'), `o vocabulário do personal trainer aparece: "${p4m}"`);
await m.screenshot({ path: `${SAIDA}/06-mobile-nicho-personal.png`, fullPage: true });

await responder(m, 'Tá tudo junto no WhatsApp');
await responder(m, 'Fica por isso mesmo');
const p6m = await textoDe(m, '#quiz-pergunta');
conferir(p6m.includes('parou de treinar'), `a pergunta 6 é a de evasão, do personal: "${p6m}"`);
await responder(m, 'Quando o pagamento não entra');
await responder(m, 'Não tenho ideia');

await m.locator('#campo-nome').fill('Bruno');
await m.locator('#campo-whatsapp').fill('11981670838');
await m.locator('#captura-enviar').click();
await m.waitForSelector('#tela-diagnostico:not([hidden])', { timeout: 8000 });

// O título e a lista precisam contar a mesma história: dizer "1 vazamento" com dois itens
// na tela é o tipo de incoerência que só aparece olhando a captura.
const tituloM = await textoDe(m, '#diag-titulo');
const itensM = await m.locator('#diag-lista .vazamento').count();
const numeroNoTitulo = (tituloM.match(/\d+/) || [null])[0];
const declarados = (numeroNoTitulo ? Number(numeroNoTitulo) : 0) + (tituloM.includes('ponto cego') ? 1 : 0);
conferir(declarados === itensM, `o título declara ${declarados} e a lista mostra ${itensM}: "${tituloM}"`);

const primeiroVaz = await textoDe(m, '#diag-lista .vazamento h3');
conferir(primeiroVaz.includes('número'), `quem não tem número vê a cegueira em primeiro lugar: "${primeiroVaz}"`);
const aberturaM = await textoDe(m, '#diag-abertura');
conferir(!aberturaM.includes('undefined') && !aberturaM.includes('NaN'), `a abertura sem faixa não vaza undefined: "${aberturaM}"`);
await m.screenshot({ path: `${SAIDA}/07-mobile-diagnostico.png`, fullPage: true });

// ---------- páginas de apoio ----------
console.log('\npáginas de apoio');
// ---------- o quiz embutido no institucional ----------
// Segundo ponto de entrada para o mesmo quiz. Precisa funcionar igual, e principalmente NÃO
// pode ter quebrado o institucional: quiz.css e o CSS desta página coexistem agora.
console.log('\nquiz embutido no institucional');
{
  const p = await ctx.newPage();
  const errosSobre = [];
  p.on('pageerror', (e) => errosSobre.push(String(e)));
  await p.goto(`${BASE}/sobre.html`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(250);

  conferir(await p.locator('#tela-quiz').isVisible(), 'o quiz aparece dentro do institucional');
  conferir((await textoDe(p, '#quiz-passo')).toLowerCase().includes('1 de 7'), 'começa na pergunta 1');
  conferir(await p.locator('#quiz-opcoes .opcao').count() === PROFISSOES.length, `mostra as ${PROFISSOES.length} profissões, igual ao funil`);

  // O bloco entra depois da seção que nomeia a dor, e antes da que apresenta a solução.
  const posQuiz = await p.locator('#diagnostico').boundingBox();
  const posDor = await p.locator('section.pain').boundingBox();
  const posSol = await p.locator('section.solution').boundingBox();
  conferir(posDor && posQuiz && posQuiz.y > posDor.y, 'o quiz vem depois da seção que nomeia a dor');
  conferir(posSol && posQuiz && posQuiz.y < posSol.y, 'e antes da seção que apresenta a solução');

  // O institucional não pode ter sido reescrito pelo CSS do quiz.
  const pilula = await p.locator('a.btn, button.btn').first().evaluate((n) => getComputedStyle(n).borderRadius);
  conferir(parseFloat(pilula) > 50, `os botões próprios do institucional continuam em pílula (border-radius ${pilula})`);
  const botaoQuiz = await p.locator('#quiz-avancar').evaluate((n) => getComputedStyle(n).borderRadius);
  conferir(parseFloat(botaoQuiz) < 20, `os botões do quiz usam o raio próprio (${botaoQuiz}), sem herdar a pílula`);

  // Terceiro caminho, e desde o W2 ele prova outra coisa: advogado é camada 2, então precisa
  // cair no quiz GENÉRICO, com a ramificação de sempre. Se um dia alguém der lista própria a ele
  // sem querer, é aqui que aparece.
  await responder(p, 'Advogado');
  await responder(p, 'Eu e mais uma pessoa');
  const p3adv = await textoDe(p, '#quiz-pergunta');
  conferir(p3adv.includes('dividem'), `nicho de camada 2 cai no quiz genérico: "${p3adv}"`);
  await responder(p, 'Tem uma divisão combinada');
  const p4 = await textoDe(p, '#quiz-pergunta');
  conferir(p4.includes('Depois que o cliente responde'), `o ramo organizado aparece: "${p4}"`);
  await responder(p, 'Mando valor ou proposta');
  await responder(p, 'Até 5');
  await responder(p, 'Chamo de novo');
  await responder(p, 'Já testei um CRM');

  await p.locator('#campo-nome').fill('Carla');
  await p.locator('#campo-whatsapp').fill('11 98167 0838');
  await p.locator('#captura-enviar').click();
  await p.waitForSelector('#tela-diagnostico:not([hidden])', { timeout: 8000 });

  const cod = await textoDe(p, '#diag-codigo');
  conferir(/^A-\d{4}$/.test(cod), `o código sai com a letra do advogado: "${cod}"`);
  const hrefSobre = await p.locator('a[data-whatsapp]').first().getAttribute('href');
  conferir(decodeURIComponent(hrefSobre).includes('Advogado'), 'a mensagem do WhatsApp leva a profissão daqui também');

  // A saída daqui não pode mandar para a própria página em que a pessoa já está.
  const saidaSobre = await p.locator('.saida').getAttribute('href');
  conferir(saidaSobre === '#planos', `a saída daqui vai para os planos, e não para /sobre de novo (veio "${saidaSobre}")`);

  // A comparação entre os dois pontos de entrada só existe se a planilha souber distinguir de
  // qual deles o lead veio. Sem isto, as duas versões viram um número só e o teste não decide nada.
  const enviadoSobre = await p.evaluate(() => window.__ultimoEnvio || null);
  conferir(enviadoSobre && enviadoSobre.pagina.includes('sobre'),
    `o envio daqui marca a página de origem como institucional (veio "${enviadoSobre?.pagina}")`);

  conferir(errosSobre.length === 0, `institucional sem erro de JavaScript${errosSobre.length ? ': ' + errosSobre.join(' | ') : ''}`);
  await p.screenshot({ path: `${SAIDA}/09-institucional-quiz.png`, fullPage: true });
  await p.close();
}

// O institucional precisa ter caminho de volta ao funil, senão vira beco sem saída.
{
  const p = await ctx.newPage();
  await p.goto(`${BASE}/sobre.html`, { waitUntil: 'domcontentloaded' });
  const logoHref = await p.locator('nav .logo').first().getAttribute('href');
  conferir(logoHref === '/', `a logo do institucional volta para a home, não para "#" (veio "${logoHref}")`);
  const volta = p.locator('nav .nav-links a[href="/"]');
  conferir(await volta.count() > 0, 'o menu do institucional tem caminho de volta para o diagnóstico');
  const zap = await p.locator('a[href*="wa.me"]').first().getAttribute('href');
  conferir(zap && zap.includes('5511981670838'), 'o institucional aponta para o mesmo WhatsApp do funil');
  await p.close();
}

for (const [rota, marcador] of [['privacidade.html', 'Política de Privacidade'], ['termos.html', 'Termos de Uso'], ['sobre.html', 'CHAMA']]) {
  const p = await ctx.newPage();
  const r = await p.goto(`${BASE}/${rota}`, { waitUntil: 'domcontentloaded' });
  const conteudo = await p.content();
  conferir(r.status() === 200 && conteudo.includes(marcador), `${rota} responde e contém "${marcador}"`);
  if (rota !== 'sobre.html') await p.screenshot({ path: `${SAIDA}/08-${rota.replace('.html', '')}.png`, fullPage: true });
  await p.close();
}

// ---------- console limpo ----------
conferir(errosConsole.length === 0, `nenhum erro de JavaScript no console${errosConsole.length ? ': ' + errosConsole.join(' | ') : ''}`);

await navegador.close();

console.log(`\n${problemas.length === 0 ? 'tudo passou' : problemas.length + ' PROBLEMA(S):'}`);
problemas.forEach((p) => console.log('  - ' + p));
console.log(`capturas em ${SAIDA}\n`);
process.exitCode = problemas.length ? 1 : 0;
