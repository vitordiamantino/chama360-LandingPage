# Diagnóstico como documento, Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o fim do quiz `/diagnostico` de uma lista de vazamentos para um documento de diagnóstico por regra, que vende a CHAMA e leva à call, e reformular as 7 perguntas do quiz para bater na dor de controle.

**Architecture:** Tudo por regra, sem função nova na Vercel, sem dependência nova. Um módulo `plano.js` monta as seções do diagnóstico a partir das respostas. Um renderizador único `relatorio.js` desenha o documento, usado pela tela do quiz e por uma página nova `/relatorio` (aberta por link com os dados no fragmento, com botão "salvar PDF" via `window.print()`). `api/quiz.js` ganha uma terceira escrita, na aba `Diagnósticos`.

**Tech Stack:** HTML estático, JavaScript ES modules, sem framework. Testes em `test-quiz.mjs` com `node:assert/strict` e o helper `teste(nome, fn)`, rodados por `npm test`. `googleapis` para a planilha (já instalado).

**Specs:**
- `docs/superpowers/specs/2026-09-08-diagnostico-documento-e-fonte-home-design.md`
- `docs/superpowers/specs/2026-09-08-reformulacao-quiz-diagnostico.md`
- `docs/superpowers/specs/2026-09-08-texto-do-diagnostico-por-nicho.md`

**Fora deste plano:** item 1 (fonte da home) e item 2 (travessões). Saem numa leva depois, plano próprio.

**Branch:** `feat/diagnostico-documento`. Nada de merge na `main` (push na `main` publica). Revisão do Vitor é no localhost (`abrir-site.bat`).

---

## Estrutura de arquivos

| Arquivo | Responsabilidade | Ação |
|---|---|---|
| `quiz-dados.js` | árvore do quiz, dores, vocabulário | Modificar: `quemResponde` sai, `perdeCliente` entra, roteamento do genérico |
| `abordagem.js` | mensagem pronta para a planilha | Modificar: `QUEM_RESPONDE` vira `PERDE_CLIENTE` |
| `plano.js` | monta as seções do diagnóstico por regra | Criar |
| `relatorio.js` | renderiza o documento (DOM) a partir do objeto do `plano.js` | Criar |
| `relatorio.html` | página `/relatorio`, lê `#d=`, renderiza, botão salvar PDF | Criar |
| `diagnostico.html` | tela do quiz | Modificar: subhead, novo `#tela-diagnostico` |
| `quiz.js` | motor do quiz na página | Modificar: chama `relatorio.js`, monta `#d=`, `?text=` novo |
| `api/quiz.js` | grava o lead | Modificar: terceira escrita na aba `Diagnósticos` |
| `test-quiz.mjs` | checagens, `npm test` | Modificar: árvore nova, `plano.js`, roundtrip do `#d=` |
| `verificar-visual.mjs` | percorre o quiz no Edge | Modificar: percurso até o documento e o `/relatorio` |

---

## Fase 1 — Quiz reformulado

Objetivo da fase: o Vitor abre o localhost e vê as 7 perguntas novas rodando, no genérico e nos nichos.

### Task 1: Branch e baseline verde

**Files:** nenhum

- [ ] **Step 1: Criar a branch**

Run: `cd /c/Users/Vitor/Documents/chama360-site && git checkout -b feat/diagnostico-documento`
Expected: `Switched to a new branch 'feat/diagnostico-documento'`

- [ ] **Step 2: Baseline dos testes**

Run: `npm test`
Expected: PASS, todas as checagens (hoje 73). Anotar o número.

### Task 2: `perdeCliente` no quiz genérico

**Files:**
- Modify: `quiz-dados.js` (o objeto `PERGUNTAS`)
- Test: `test-quiz.mjs`

- [ ] **Step 1: Escrever o teste que falha**

Adicionar em `test-quiz.mjs`, perto dos testes de árvore:

```js
teste('pergunta 2 é perdeCliente e roteia por motivo', () => {
  assert.equal(PERGUNTAS.profissao.proxima(), 'perdeCliente');
  const p = PERGUNTAS.perdeCliente;
  assert.ok(p, 'perdeCliente não existe');
  assert.equal(p.numero, 2);
  assert.ok(p.opcoes.length >= 3 && p.opcoes.length <= 5, 'perdeCliente deve ter de 3 a 5 respostas');
  // roteamento: cada resposta leva a uma pergunta que existe
  for (const o of p.opcoes) {
    const destino = p.proxima({ perdeCliente: o.valor });
    assert.ok(PERGUNTAS[destino], `perdeCliente -> ${o.valor} aponta para ${destino}, que não existe`);
  }
  // quemResponde não existe mais no genérico
  assert.equal(PERGUNTAS.quemResponde, undefined, 'quemResponde deveria ter saído do genérico');
});
```

- [ ] **Step 2: Rodar, ver falhar**

Run: `npm test`
Expected: FALHOU 'pergunta 2 é perdeCliente...' (perdeCliente não existe)

- [ ] **Step 3: Implementar `perdeCliente` e remover `quemResponde`**

Em `quiz-dados.js`, dentro de `PERGUNTAS`: apagar a entrada `quemResponde`. Trocar
`profissao.proxima` para `() => 'perdeCliente'`. Adicionar:

```js
  perdeCliente: {
    id: 'perdeCliente',
    numero: 2,
    texto: 'Você perde {cliente} no WhatsApp sem nem perceber?',
    opcoes: [
      { valor: 'nao',         label: 'Não, dou conta de responder todo mundo' },
      { valor: 'demora',      label: 'Demoro pra responder e a pessoa já foi', peso: ['demora'] },
      { valor: 'sem_dono',    label: 'Somos vários e a conversa acaba sem dono', peso: ['sem_dono'] },
      { valor: 'sem_retoma',  label: 'A pessoa some depois do orçamento e eu não puxo', peso: ['sem_retomada'] },
      { valor: 'nao_sei',     label: 'Não sei dizer, nunca contei', peso: ['cegueira'] },
    ],
    proxima: (r) => {
      if (r.perdeCliente === 'sem_dono') return 'divisao';
      if (r.perdeCliente === 'sem_retoma') return 'depoisQue';
      return 'tempoResposta';
    },
  },
```

Ajustar `tempoResposta.proxima` e `divisao.proxima` se hoje elas dependiam de `quemResponde`
(hoje não dependem, decidem por `esquecimento`/`atropelo` a partir da própria resposta).
Conferir que `esquecimento`, `atropelo`, `depoisQue`, `quantos` seguem alcançáveis.

- [ ] **Step 4: Rodar, ver passar**

Run: `npm test`
Expected: PASS. Se algum teste antigo de árvore quebrar por citar `quemResponde`, ajustar o teste (o `quemResponde` genérico deixou de existir de propósito).

- [ ] **Step 5: Commit**

```bash
git add quiz-dados.js test-quiz.mjs
git commit -m "Quiz generico: quemResponde sai, perdeCliente entra e roteia por motivo"
```

### Task 3: A dor `sem_dono` continua alcançável no genérico

**Files:**
- Modify: `quiz-dados.js` (se preciso), `test-quiz.mjs`

- [ ] **Step 1: Teste**

```js
teste('genérico: toda dor continua alcançável por algum caminho', () => {
  const alvo = new Set(QUIZ_POR_NICHO.default.ordemDores); // cegueira, demora, sem_dono, sem_retomada
  const marcadas = new Set();
  // varre todas as opções de todas as perguntas do genérico
  for (const p of Object.values(PERGUNTAS)) {
    for (const o of p.opcoes || []) (o.peso || []).forEach((w) => marcadas.add(w));
  }
  for (const d of alvo) assert.ok(marcadas.has(d), `a dor "${d}" ficou sem nenhuma resposta que a marque`);
});
```

- [ ] **Step 2: Rodar**

Run: `npm test`
Expected: PASS já (a `perdeCliente` marca `sem_dono` via a opção "somos vários", e a `divisao` continua no ramo). Se falhar, garantir a marcação em `perdeCliente` ou `divisao`.

- [ ] **Step 3: Commit**

```bash
git add test-quiz.mjs quiz-dados.js
git commit -m "Guard: toda dor do generico continua alcançável"
```

### Task 4: `perdeCliente` nos 6 nichos

**Files:**
- Modify: `quiz-dados.js` (cada `QUIZ_POR_NICHO.<nicho>.perguntas` via `listaLinear`)
- Test: `test-quiz.mjs`

- [ ] **Step 1: Teste**

```js
teste('cada nicho troca quemResponde por perdeCliente, mantendo 7 e as dores', () => {
  for (const [nome, quiz] of Object.entries(QUIZ_POR_NICHO)) {
    if (nome === 'default') continue;
    const ids = Object.keys(quiz.perguntas);
    assert.ok(!ids.includes('quemResponde'), `${nome} ainda tem quemResponde`);
    assert.ok(ids.includes('perdeCliente'), `${nome} não tem perdeCliente`);
    assert.equal(quiz.total, 7);
    // toda dor do nicho é marcada por alguma resposta
    const marcadas = new Set();
    for (const p of Object.values(quiz.perguntas)) for (const o of p.opcoes) (o.peso||[]).forEach((w)=>marcadas.add(w));
    for (const d of Object.keys(quiz.dores)) {
      assert.ok(marcadas.has(d) || d === 'cegueira', `${nome}: dor "${d}" sem resposta que a marque`);
    }
    // no máximo 5 respostas por pergunta
    for (const p of Object.values(quiz.perguntas)) {
      assert.ok(p.opcoes.length <= 5, `${nome}/${p.id} tem mais de 5 respostas`);
    }
  }
});
```

- [ ] **Step 2: Rodar, ver falhar**

Run: `npm test`
Expected: FALHOU (nichos ainda com `quemResponde`)

- [ ] **Step 3: Implementar por nicho**

Em cada `listaLinear([...])` dos 6 nichos, trocar o primeiro item (`quemResponde`) pela
`perdeCliente` do nicho. Texto e opções conforme
`2026-09-08-reformulacao-quiz-diagnostico.md` (Personal e Corretor estão escritos ali;
Dentista, Seguros, Veterinário e Oficina seguem o padrão: opção 1 sem peso, as outras
marcando as dores do nicho, `nao_sei` marcando `cegueira`). Nicho é lista linear: a
`perdeCliente` do nicho não precisa de `proxima` customizado, o `listaLinear` liga.

- [ ] **Step 4: Rodar, ver passar**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add quiz-dados.js test-quiz.mjs
git commit -m "Nichos: perdeCliente no lugar de quemResponde, dores mantidas"
```

### Task 5: `abordagem.js` acompanha

**Files:**
- Modify: `abordagem.js`
- Test: `test-quiz.mjs`

- [ ] **Step 1: Teste**

```js
teste('abordagem cita o motivo da perda em vez do tamanho da equipe', () => {
  const corpo = {
    nome: 'Ana', codigo: 'C-0809-1234',
    respostas: { profissao: 'dentista', perdeCliente: 'demora', quantos: '6a15' },
    vazamentos: ['demora'], nicho: 'dentista',
  };
  const msg = montarAbordagem(corpo);
  assert.ok(!/quemResponde|só você respondendo/i.test(msg), 'ainda fala do QUEM_RESPONDE antigo');
  assert.ok(msg.includes('Ana'));
  assert.ok(msg.length > 0);
});
```

- [ ] **Step 2: Rodar, ver falhar**

Run: `npm test`
Expected: FALHOU (referência a `QUEM_RESPONDE`)

- [ ] **Step 3: Implementar**

Em `abordagem.js`: trocar `QUEM_RESPONDE` por `PERDE_CLIENTE`, mapeado pelos valores de
`perdeCliente` (`nao`, `demora`, `sem_dono`, `sem_retoma`, `nao_sei`), cada um uma frase
curta no tom ("você marcou que demora pra responder e a pessoa já foi"). Em `montarAbordagem`,
trocar a leitura de `r.quemResponde` por `r.perdeCliente`.

- [ ] **Step 4: Rodar, ver passar**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add abordagem.js test-quiz.mjs
git commit -m "abordagem.js: PERDE_CLIENTE no lugar de QUEM_RESPONDE"
```

### Task 6: `api/quiz.js` continua alinhado

**Files:**
- Modify: `api/quiz.js` (só se `cabecalhoNicho`/`montarLinha` citarem `quemResponde`)
- Test: `test-quiz.mjs` (rodar os testes existentes de coluna)

- [ ] **Step 1: Rodar os testes de planilha existentes**

Run: `npm test`
Expected: PASS. `montarLinha` é posicional por `corpo.ordem`, não cita `quemResponde` por id
(usa `pos(1, 'quemResponde')` como fallback antigo). Trocar o fallback para
`pos(1, 'perdeCliente', 'quemResponde')` para o payload novo e o antigo funcionarem.

- [ ] **Step 2: Commit**

```bash
git add api/quiz.js
git commit -m "api/quiz.js: fallback posicional aceita perdeCliente"
```

### Task 7: Ver rodando no localhost

- [ ] **Step 1: Subir**

Run: `abrir-site.bat` (na raiz do repo) ou `npx serve` / `python -m http.server 8080`
Abrir `http://localhost:8080/diagnostico`

- [ ] **Step 2: Conferir manualmente**

Percorrer o quiz genérico e um nicho (Personal). Confirmar: pergunta 2 é a de perda, o
roteamento leva a telas que existem, chega no diagnóstico atual (ainda o antigo, a Fase 3
troca isso).

- [ ] **Step 3: Checkpoint com o Vitor.** Ele revisa as perguntas. Ajustes de redação
entram aqui antes de seguir.

---

## Fase 2 — Motor do diagnóstico (`plano.js`)

### Task 8: Esqueleto e o objeto de saída

**Files:**
- Create: `plano.js`
- Test: `test-quiz.mjs`

- [ ] **Step 1: Teste**

```js
import { montarPlano } from './plano.js';

teste('montarPlano devolve as seções esperadas', () => {
  const corpo = {
    nome: 'Ana Paula', codigo: 'D-0809-1234',
    respostas: { profissao: 'dentista', perdeCliente: 'demora', quantos: '6a15', ferramenta: 'crm_hoje' },
    rotulos: {}, nicho: 'dentista',
    vazamentos: ['orcamento_parado', 'preco_sem_conversa'],
  };
  const p = montarPlano(corpo);
  assert.equal(typeof p.titulo, 'string');
  assert.ok(Array.isArray(p.espelho) && p.espelho.length >= 1);
  assert.ok(Array.isArray(p.dores) && p.dores.length === 2);
  assert.ok(Array.isArray(p.fases) && p.fases.length === 3);
  assert.ok(Array.isArray(p.evidencia) && p.evidencia.length <= 3);
  assert.equal(typeof p.meta, 'string');
  assert.equal(typeof p.call, 'string');
  // cada fase diz quais dores do lead ela fecha
  const fechadas = p.fases.flatMap((f) => f.fecha);
  for (const d of corpo.vazamentos) assert.ok(fechadas.includes(d), `dor ${d} não aparece em nenhuma fase`);
});
```

- [ ] **Step 2: Rodar, ver falhar**

Run: `npm test`
Expected: FALHOU (`plano.js` não existe)

- [ ] **Step 3: Implementar `plano.js`**

Estrutura, no padrão do `abordagem.js`:

```js
import { QUIZ_POR_NICHO, FAIXAS, aplicarVocabulario, acharProfissao } from './quiz-dados.js';

// dor -> fase (1, 2 ou 3). Cobre as 34 dores. Ver o doc de texto.
const FASE_DA_DOR = {
  // Fase 1 Centralizar
  sem_dono: 1, agenda_no_zap: 1, sem_funil: 1, lead_sem_triagem: 1, recepcao_afogada: 1,
  cadeira_vazia: 1, box_travado: 1, status_repetido: 1, agenda_banho: 1,
  // Fase 2 Automatizar
  demora: 2, timing_direct: 2, corrida_do_primeiro: 2, plano_sem_fechar: 2, orcamento_parado: 2,
  preco_sem_conversa: 2, cotacao_parada: 2, sinistro_lento: 2, orcamento_sem_resposta: 2,
  orcamento_exame: 2, aprovacao_demorada: 2, visita_furada: 2, emergencia_sem_resposta: 2,
  // Fase 3 Reativar e medir
  cegueira: 3, sem_retomada: 3, sem_origem: 3, renovacao_cega: 3, sem_retorno: 3,
  renovacao_perdida: 3, carteira_fria: 3, uma_apolice_so: 3, imovel_errado_fim: 3,
  retorno_vacina: 3, tutor_some: 3, revisao_esquecida: 3,
};

const FASES = [
  { n: 1, titulo: 'Dias 1 a 30 · Centralizar', texto: '...' }, // texto do doc
  { n: 2, titulo: 'Dias 31 a 60 · Automatizar', texto: '...' },
  { n: 3, titulo: 'Dias 61 a 90 · Reativar e medir', texto: '...' },
];

// custo+desejo por dor, por nicho. Chaves = ids de dor. Ver o doc de texto.
const DOR_TEXTO = { default: { demora: '...', sem_dono: '...', /* ... */ }, personal: {/*...*/}, /* ... */ };

const EVIDENCIA = [ /* 6 itens {chave, titulo, texto}; chave liga a fase */ ];

export function montarPlano(corpo) { /* monta o objeto */ }
```

Copiar os textos de `2026-09-08-texto-do-diagnostico-por-nicho.md` verbatim. Regras:
- `espelho`: frases condicionais (perda declarada, faixa, síntese) conforme o doc.
- `dores`: `corpo.vazamentos` mapeadas para `{ id, titulo, texto }` com `DOR_TEXTO[nicho]`
  ou `DOR_TEXTO.default`, `aplicarVocabulario` aplicado.
- `fases`: as 3, cada uma com `fecha = corpo.vazamentos.filter(d => FASE_DA_DOR[d] === n)`.
- `evidencia`: itens cujas fases entraram no plano, no máximo 3.
- `meta`: com `FAIXAS[respostas.quantos]` quando existe, senão a versão "ter o número".
- `call`: texto fixo do movimento 6, com a linha da faixa quando existe.
- Nunca interpola número que o lead não deu.

- [ ] **Step 4: Rodar, ver passar**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add plano.js test-quiz.mjs
git commit -m "plano.js: monta as secoes do diagnostico por regra"
```

### Task 9: Guard de cobertura e de número inventado

**Files:**
- Test: `test-quiz.mjs`

- [ ] **Step 1: Testes**

```js
import { _plano } from './plano.js'; // exportar FASE_DA_DOR e DOR_TEXTO para o teste

teste('toda dor de todo nicho tem fase', () => {
  const todas = new Set(['cegueira','demora','sem_dono','sem_retomada']);
  for (const q of Object.values(QUIZ_POR_NICHO)) Object.keys(q.dores || {}).forEach((d) => todas.add(d));
  for (const d of todas) assert.ok(_plano.FASE_DA_DOR[d], `dor "${d}" sem fase em plano.js`);
});

teste('toda dor de todo nicho tem texto de custo e desejo', () => {
  for (const [nome, q] of Object.entries(QUIZ_POR_NICHO)) {
    const tabela = _plano.DOR_TEXTO[nome === 'default' ? 'default' : nome] || _plano.DOR_TEXTO.default;
    for (const d of Object.keys(q.dores || {})) {
      const t = tabela[d] || _plano.DOR_TEXTO.default[d];
      assert.ok(t && t.length > 20, `${nome}: dor "${d}" sem texto em plano.js`);
    }
  }
});

teste('sem faixa, a meta não cita número', () => {
  const p = montarPlano({ respostas: { profissao: 'personal', quantos: 'nao_sei' }, vazamentos: ['cegueira'], nicho: 'default', codigo: 'x', nome: 'x' });
  assert.ok(!/\d/.test(p.meta.replace(/90|30|60/g, '')), 'meta inventou número sem o lead dar');
});
```

- [ ] **Step 2: Rodar**

Run: `npm test`
Expected: PASS (ajustar `DOR_TEXTO` se algum nicho ficou sem uma chave)

- [ ] **Step 3: Commit**

```bash
git add plano.js test-quiz.mjs
git commit -m "Guards do plano.js: cobertura de fase e texto, sem numero inventado"
```

---

## Fase 3 — Documento na tela

### Task 10: `relatorio.js`, o renderizador

**Files:**
- Create: `relatorio.js`
- Test: `test-quiz.mjs` (render em string, sem DOM real, com um `document` fake mínimo, ou testar a função pura que monta o HTML)

- [ ] **Step 1: Decisão de forma.** `relatorio.js` exporta `renderDiagnostico(alvo, plano)` que
recebe um elemento e o objeto do `plano.js`, e injeta o DOM. Para testar sem browser, extrair
`htmlDoDiagnostico(plano)` que devolve string, e `renderDiagnostico` só faz
`alvo.innerHTML = htmlDoDiagnostico(plano)` mais os handlers.

- [ ] **Step 2: Teste**

```js
import { htmlDoDiagnostico } from './relatorio.js';

teste('htmlDoDiagnostico traz as seções e escapa texto', () => {
  const plano = montarPlano({
    nome: 'Ana <b>x</b>', codigo: 'D-1', nicho: 'dentista',
    respostas: { profissao: 'dentista', perdeCliente: 'demora', quantos: '6a15' },
    vazamentos: ['orcamento_parado'],
  });
  const html = htmlDoDiagnostico(plano);
  assert.ok(html.includes('Diagnóstico do seu atendimento'));
  assert.ok(html.includes('Dias 1 a 30'));
  assert.ok(html.includes('O próximo passo'));
  assert.ok(!html.includes('<b>x</b>'), 'não escapou o nome');
});
```

- [ ] **Step 3: Implementar `relatorio.js`**

`htmlDoDiagnostico(plano)` monta: cabeçalho, espelho, ponto forte, lista de dores (máx 3),
as 3 fases com a lista "no seu caso fecha", evidência (máx 3), meta, bloco da call com o
botão `[data-whatsapp]` e o link do PDF, e a saída para `/`. Escapar todo texto vindo do
lead (`nome`). Classes reaproveitando `quiz.css` (`.diag-topo`, `.vazamentos`, `.fechamento`,
`.codigo`) e classes novas para as seções.

- [ ] **Step 4: Rodar, ver passar**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add relatorio.js test-quiz.mjs
git commit -m "relatorio.js: renderizador unico do documento de diagnostico"
```

### Task 11: `diagnostico.html` usa o renderizador novo

**Files:**
- Modify: `diagnostico.html` (o `#tela-diagnostico`, a subhead linha 177, `quiz.css` se precisar de classe nova)
- Modify: `quiz.js` (`renderDiagnostico` passa a chamar `relatorio.js`)

- [ ] **Step 1: Subhead**

Trocar [diagnostico.html:177] pelo texto aprovado (primária ou curta, ver spec).

- [ ] **Step 2: Estrutura do `#tela-diagnostico`**

Deixar só um container (`<div id="diag-doc"></div>`) mais o `.fechamento` existente (ou mover
o fechamento para dentro do render). Remover a montagem manual de `#diag-titulo`,
`#diag-lista`, `#diag-codigo` — passa a vir do `relatorio.js`.

- [ ] **Step 3: `quiz.js`**

Em `renderDiagnostico`, trocar a montagem manual por:

```js
import { renderDiagnostico as renderDoc } from './relatorio.js';
import { montarPlano } from './plano.js';
// ...
const plano = montarPlano({
  nome: estado.nomeLead, codigo: estado.codigo, nicho: ...,
  respostas: estado.respostas, rotulos: estado.rotulos,
  vazamentos: calcularDiagnostico(),
});
renderDoc(el('diag-doc'), plano);
```

Guardar `estado.nomeLead` no `enviar()` (hoje o nome não fica no estado). Manter os `medir(...)`
existentes (`quiz_diagnostico_visto` etc.) — a campanha otimiza por eles.

- [ ] **Step 4: `npm test` + `npm run verificar:visual`**

Run: `npm test` — Expected: PASS
Run: `npm run verificar:visual` — Expected: verde, capturas em `_capturas/` mostram o documento

- [ ] **Step 5: Commit**

```bash
git add diagnostico.html quiz.js quiz.css
git commit -m "diagnostico.html: documento novo no lugar da lista de vazamentos"
```

---

## Fase 4 — PDF e `/relatorio`

### Task 12: Empacotar e desempacotar `#d=`

**Files:**
- Create: helper em `relatorio.js` (`empacotar(dados)`, `desempacotar(fragmento)`)
- Test: `test-quiz.mjs`

- [ ] **Step 1: Teste (roundtrip)**

```js
import { empacotar, desempacotar } from './relatorio.js';

teste('empacotar/desempacotar preserva os dados do diagnóstico', () => {
  const dados = { profissao: 'corretor', respostas: { profissao: 'corretor', perdeCliente: 'demora', quantos: '6a15' }, rotulos: { profissao: 'Corretor de Imóveis' }, nome: 'João', codigo: 'C-0809-9999' };
  const frag = empacotar(dados);
  assert.ok(typeof frag === 'string' && frag.length < 1500);
  assert.deepEqual(desempacotar(frag), dados);
});

teste('desempacotar aguenta lixo sem quebrar', () => {
  assert.equal(desempacotar('#d=@@@'), null);
  assert.equal(desempacotar(''), null);
});
```

- [ ] **Step 2: Rodar, ver falhar** — Run: `npm test` — Expected: FALHOU

- [ ] **Step 3: Implementar**

`empacotar`: `JSON.stringify` -> `encodeURIComponent` -> `btoa` (base64). `desempacotar`: o
inverso, dentro de try/catch, devolve `null` em qualquer erro. Aceitar tanto `#d=xxx` quanto
`xxx`. Em Node o teste usa `Buffer` como fallback de `btoa/atob` — usar
`globalThis.btoa ?? (s) => Buffer.from(s,'binary').toString('base64')`.

- [ ] **Step 4: Rodar, ver passar** — Run: `npm test` — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add relatorio.js test-quiz.mjs
git commit -m "relatorio.js: empacota o diagnostico no fragmento da URL"
```

### Task 13: `relatorio.html`

**Files:**
- Create: `relatorio.html`
- Test: `test-quiz.mjs` (checar `<meta name="robots" content="noindex`), `verificar-visual.mjs`

- [ ] **Step 1: Teste**

```js
teste('relatorio.html é noindex e não carrega medição', () => {
  const h = fs.readFileSync('relatorio.html', 'utf8');
  assert.match(h, /<meta name="robots" content="noindex/i);
  assert.ok(!h.includes('medicao.js'), 'relatorio não deve medir');
  assert.ok(h.includes('relatorio.js'));
});
```

- [ ] **Step 2: Rodar, ver falhar** — Run: `npm test` — Expected: FALHOU

- [ ] **Step 3: Implementar `relatorio.html`**

Head mínimo: `charset`, `viewport`, `<title>Seu diagnóstico CHAMA 360</title>`,
`<meta name="robots" content="noindex, nofollow">`, favicon `assets/icone-chama360.png`,
`<link rel="stylesheet" href="quiz.css">`. Body: um `<main id="doc">`, um botão fixo
"Salvar em PDF" (`onclick="window.print()"`), e:

```html
<script type="module">
  import { desempacotar, renderDiagnostico } from './relatorio.js';
  import { montarPlano } from './plano.js';
  const dados = desempacotar(location.hash);
  const alvo = document.getElementById('doc');
  if (!dados) { alvo.textContent = 'Link inválido ou expirado.'; }
  else { renderDiagnostico(alvo, montarPlano(dados)); }
</script>
```

`@media print` no `<style>` da página: esconde o botão, tira sombra e fundo, margens de
impressão, `break-inside: avoid` nas seções.

- [ ] **Step 4: Rodar** — Run: `npm test` — Expected: PASS

- [ ] **Step 5: Conferir no browser**

Abrir `http://localhost:8080/relatorio#d=<cole um frag gerado no console com empacotar(...)>`.
Ver o documento. Ctrl+P, conferir o preview de PDF.

- [ ] **Step 6: Commit**

```bash
git add relatorio.html test-quiz.mjs
git commit -m "relatorio.html: pagina do diagnostico com salvar em PDF"
```

### Task 14: `quiz.js` monta o link e o `?text=` novo

**Files:**
- Modify: `quiz.js` (`renderDiagnostico`, o `[data-whatsapp]`)
- Test: `test-quiz.mjs`

- [ ] **Step 1: Teste**

```js
teste('a mensagem do WhatsApp é curta e leva o link do relatório', () => {
  const { montarTextoWhatsapp } = _interno; // exportar
  const texto = montarTextoWhatsapp({ profLabel: 'Dentista', codigo: 'D-1', titulo: 'Meu atendimento tem 2 vazamentos', linkRelatorio: 'https://chama360.com.br/relatorio#d=abc' });
  assert.ok(encodeURIComponent(texto).length < 1200, 'texto do WhatsApp longo demais');
  assert.ok(texto.includes('relatorio#d=abc'));
  assert.ok(texto.includes('D-1'));
});
```

- [ ] **Step 2: Rodar, ver falhar** — Run: `npm test` — Expected: FALHOU

- [ ] **Step 3: Implementar**

`montarTextoWhatsapp` no `quiz.js` (exportar em `_interno`), texto conforme o doc:

```
Oi, fiz o diagnóstico no site e queria agendar a conversa de 20 minutos.
Sou {profLabel}. {titulo}
Meu diagnóstico completo: {linkRelatorio}
Código {codigo}
```

Em `renderDiagnostico`: montar `linkRelatorio` com `empacotar` (base de produção fixa
`https://chama360.com.br/relatorio#d=` + frag), setar `href` de todo `[data-whatsapp]` para
`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, e o botão "Baixar PDF" aponta
para `linkRelatorio` (target `_blank`).

- [ ] **Step 4: Rodar** — Run: `npm test` — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add quiz.js test-quiz.mjs
git commit -m "quiz.js: WhatsApp curto com link do relatorio, botao baixar PDF"
```

---

## Fase 5 — Aba `Diagnósticos` na planilha

### Task 15: Terceira escrita no `api/quiz.js`

**Files:**
- Modify: `api/quiz.js`
- Test: `test-quiz.mjs`

- [ ] **Step 1: Teste**

```js
import { montarLinhaDiagnostico, CABECALHO_DIAGNOSTICO } from './api/quiz.js';

teste('a linha de Diagnósticos tem código, mensagem e link', () => {
  const corpo = {
    nome: 'Ana', whatsapp: '11999999999', codigo: 'D-0809-1234',
    respostas: { profissao: 'dentista', perdeCliente: 'demora', quantos: '6a15' },
    rotulos: { profissao: 'Dentista' }, nicho: 'dentista', vazamentos: ['orcamento_parado'],
  };
  const linha = montarLinhaDiagnostico(corpo, '2026-09-08T12:00:00.000Z');
  assert.equal(linha.length, CABECALHO_DIAGNOSTICO.length);
  assert.equal(linha[3], 'D-0809-1234');                 // Código
  assert.ok(String(linha[5]).length > 10);               // Mensagem pronta
  assert.match(String(linha[6]), /^https:\/\/chama360\.com\.br\/relatorio#d=/); // Link
});
```

- [ ] **Step 2: Rodar, ver falhar** — Run: `npm test` — Expected: FALHOU

- [ ] **Step 3: Implementar**

Em `api/quiz.js`:

```js
export const CABECALHO_DIAGNOSTICO = ['Data e hora', 'Nome', 'WhatsApp', 'Código', 'Profissão', 'Mensagem pronta', 'Link do relatório'];

export function montarLinhaDiagnostico(corpo, agoraISO) {
  const rot = corpo.rotulos || {};
  const frag = empacotarDados(corpo); // mesma lógica do relatorio.js, duplicada aqui (server não importa ES do front? importa: é ES module). Melhor: importar de relatorio.js.
  return [
    agoraISO,
    limparTexto(corpo.nome, 80),
    `'${normalizarWhatsapp(corpo.whatsapp)}`,
    limparTexto(corpo.codigo, 12),
    limparTexto(rot.profissao, 60),
    protegerFormula(montarAbordagem(corpo)),
    `https://chama360.com.br/relatorio#d=${frag}`,
  ];
}
```

Importar `empacotar` de `../relatorio.js` (é ES module, funciona no runtime da Vercel).
No `handler`, depois da escrita da aba de nicho, adicionar um terceiro bloco try/catch:
`garantirAba(sheets, spreadsheetId, 'Diagnósticos', CABECALHO_DIAGNOSTICO, abas)` e
`values.append` em `Diagnósticos!A:A`. Nunca derruba a requisição.

- [ ] **Step 4: Rodar** — Run: `npm test` — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/quiz.js test-quiz.mjs
git commit -m "api/quiz.js: grava aba Diagnosticos com mensagem pronta e link"
```

### Task 16: `verificar-visual.mjs` cobre o caminho novo

**Files:**
- Modify: `verificar-visual.mjs`

- [ ] **Step 1: Estender o percurso**

Depois de enviar o lead no fluxo local, conferir que `#doc` (ou `#diag-doc`) tem as seções
(`Dias 1 a 30`, `O próximo passo`), que o `[data-whatsapp]` tem `href` com `wa.me` e
`relatorio#d=`, e que o botão "Baixar PDF" aponta para `/relatorio#d=`. Abrir esse
`/relatorio#d=` e conferir que renderiza as mesmas seções.

- [ ] **Step 2: Rodar**

Run: `npm run verificar:visual`
Expected: verde, capturas novas em `_capturas/`

- [ ] **Step 3: Commit**

```bash
git add verificar-visual.mjs
git commit -m "verificar-visual: percorre o documento e o /relatorio"
```

### Task 17: Fechamento da branch

- [ ] **Step 1: Suite completa**

Run: `npm test && npm run verificar:visual`
Expected: tudo verde

- [ ] **Step 2: Checklist de páginas para `/relatorio`** (do `~/.claude/PAGINAS.md`): favicon
ok, meta tags mínimas ok, `noindex` ok, sem sitemap, sem tracking. Registrar no log.

- [ ] **Step 3: `npm audit`**

Run: `npm audit`
Expected: sem crítica/alta nova (nenhuma dependência foi adicionada)

- [ ] **Step 4: Deixar a branch pronta para o Vitor revisar no localhost.** Não fazer merge.
Escrever o log de produção em `03 - Projetos/CHAMA 360/` do cofre com o estado e o que falta
(redação final, decisões do gate, o item 1 e 2 que ficaram de fora).

---

## Self-review

- **Cobertura da spec:** quiz reformulado (Fase 1), motor por regra (Fase 2), documento na
  tela no lugar da VSL (Fase 3), PDF via `/relatorio` + `window.print()` (Fase 4), aba
  `Diagnósticos` (Fase 5), `?text=` curto com link (Task 14), subhead (Task 11), guards de
  cobertura e de número inventado (Task 9). Item 1 e 2 explicitamente fora, plano próprio.
- **Sem placeholder:** cada task tem o código ou o comando. Os textos longos (`DOR_TEXTO`,
  `FASES`, `EVIDENCIA`) vêm verbatim do doc `2026-09-08-texto-do-diagnostico-por-nicho.md`,
  citado em cada task que os usa.
- **Consistência de tipos:** `montarPlano(corpo)` devolve `{ titulo, espelho[], pontoForte?,
  dores[], fases[], evidencia[], meta, call }`, usado igual nas Tasks 8-14. `empacotar`/
  `desempacotar` (Task 12) usados nas Tasks 13-15. `montarTextoWhatsapp` (Task 14) em
  `_interno`. `CABECALHO_DIAGNOSTICO` e `montarLinhaDiagnostico` (Task 15) exportados de
  `api/quiz.js`.
- **Gate aberto:** a redação final das perguntas e do texto do diagnóstico. O plano usa os
  textos dos docs como estão; se o Vitor mudar, é editar `quiz-dados.js` / `plano.js`, sem
  mexer em estrutura.
