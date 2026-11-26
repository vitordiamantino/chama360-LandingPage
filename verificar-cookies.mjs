// Confere o aviso de cookies (issue #1): o Clarity só carrega depois do "Aceitar".
// Uso: node verificar-cookies.mjs [http://localhost:8899]   (sai com código 1 se alguma regra falhar)
// Toda requisição de medição é bloqueada na saída: a verificação não suja Clarity, GA nem Pixel.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:8899';
const MEDICAO = /clarity\.ms|google-analytics|analytics\.google|googletagmanager|connect\.facebook\.net|facebook\.com\/tr/;
const navegador = await chromium.launch({ channel: 'msedge' }).catch(() => chromium.launch());

async function novaVisita() {
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const clarity = [];
  await ctx.route('**/*', (r) => {
    const url = r.request().url();
    if (!MEDICAO.test(url)) return r.continue();
    if (url.includes('clarity.ms')) clarity.push(url);
    return r.abort();
  });
  return { ctx, page: await ctx.newPage(), clarity };
}
const aviso = (page) => page.locator('.ck-aviso');

// 1. Primeira visita: aviso na tela, nada gravando; Recusar some com o aviso e continua sem gravar, inclusive ao voltar.
{
  const { ctx, page, clarity } = await novaVisita();
  await page.goto(BASE + '/');
  await aviso(page).waitFor();
  await page.waitForTimeout(1500);
  assert.equal(clarity.length, 0, 'Clarity carregou antes do aceite');
  const [r, a] = await Promise.all([page.locator('.ck-recusar').boundingBox(), page.locator('.ck-aceitar').boundingBox()]);
  assert.ok(Math.abs(r.width - a.width) < 2 && Math.abs(r.height - a.height) < 2, 'Recusar e Aceitar têm de ter o mesmo tamanho');
  assert.ok(r.height >= 44, 'botão pequeno demais para o dedo');
  await page.locator('.ck-recusar').click();
  await aviso(page).waitFor({ state: 'detached' });
  await page.reload();
  await page.waitForTimeout(1500);
  assert.equal(await aviso(page).count(), 0, 'o aviso voltou depois de recusar');
  assert.equal(clarity.length, 0, 'Clarity carregou depois de recusar');
  // a Política permite perguntar de novo
  await page.goto(BASE + '/privacidade.html');
  await page.locator('#ck-mudar').click();
  await page.goto(BASE + '/');
  await aviso(page).waitFor();
  await ctx.close();
}

// 2. Aceitar liga o Clarity na hora e nas próximas páginas, sem mostrar o aviso de novo.
{
  const { ctx, page, clarity } = await novaVisita();
  await page.goto(BASE + '/');
  await page.locator('.ck-aceitar').click();
  await page.waitForTimeout(800);
  assert.equal(clarity.length, 1, 'Clarity não carregou depois de aceitar');
  await page.reload();
  await page.waitForTimeout(1500);
  assert.equal(await aviso(page).count(), 0, 'o aviso voltou depois de aceitar');
  assert.equal(clarity.length, 2, 'Clarity não carregou na volta de quem aceitou');
  await page.screenshot({ path: '_capturas/aviso-cookies-aceito.png' });
  await ctx.close();
}

// 3. Captura do aviso aberto no celular, para conferir com os olhos.
{
  const { ctx, page } = await novaVisita();
  await page.goto(BASE + '/');
  await aviso(page).waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: '_capturas/aviso-cookies.png' });
  await ctx.close();
}

await navegador.close();
console.log('aviso de cookies: ok');
