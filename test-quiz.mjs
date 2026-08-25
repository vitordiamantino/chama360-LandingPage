// Checagem do quiz. Roda com `npm test`, sem framework.
//
// O que ela protege, que é onde o bug moraria de verdade:
//   1. A árvore. Escrita à mão, ramifica em três pontos, e um `proxima` apontando para pergunta
//      que não existe deixaria o lead numa tela vazia sem erro nenhum no console.
//   2. A promessa de sempre 7 respostas. É o que mantém a planilha com colunas fixas.
//   3. A ordem das colunas de montarLinha. Trocar duas de lugar não quebra nada visível, e
//      contamina a planilha em silêncio até alguém ler.
//   4. A normalização do WhatsApp, que decide se o wa.me abre ou não.

import assert from 'node:assert/strict';
import { PERGUNTAS, PRIMEIRA_PERGUNTA, PROFISSOES, VAZAMENTOS, aplicarVocabulario } from './quiz-dados.js';
import { montarLinha } from './api/quiz.js';
import { extrairParametros, decidirAtribuicao, registrarVisita, lerAtribuicao } from './atribuicao.js';

const TOTAL = 7;
let ok = 0;
function teste(nome, fn) {
  try { fn(); ok++; console.log('  ok  ', nome); }
  catch (e) { console.error('  FALHOU', nome, '\n      ', e.message); process.exitCode = 1; }
}

// Percorre a árvore escolhendo, em cada pergunta, a opção de índice `escolha`.
// Devolve o caminho e as respostas, do jeito que o motor faria.
function percorrer(escolher) {
  const respostas = {};
  const caminho = [];
  const numeros = [];
  let atual = PRIMEIRA_PERGUNTA;
  let guarda = 0;

  while (atual) {
    if (++guarda > 20) throw new Error('a árvore não terminou: possível ciclo em ' + atual);
    const p = PERGUNTAS[atual];
    assert.ok(p, `pergunta inexistente no caminho: ${atual}`);
    const opcao = p.opcoes[escolher(p) % p.opcoes.length];
    assert.ok(opcao, `pergunta ${p.id} sem opção escolhível`);
    respostas[p.id] = opcao.valor;
    caminho.push(p.id);
    numeros.push(p.numero);
    atual = p.proxima(respostas);
  }
  return { respostas, caminho, numeros };
}

console.log('\nárvore do quiz');

teste('toda combinação de respostas termina com 7 perguntas, numeradas de 1 a 7', () => {
  // Varre escolhendo sistematicamente índices diferentes, o que cobre os três pontos de
  // ramificação em todas as direções.
  for (let i = 0; i < 6; i++) {
    const r = percorrer(() => i);
    assert.equal(r.caminho.length, TOTAL, `caminho com ${r.caminho.length} perguntas escolhendo sempre a opção ${i}: ${r.caminho.join(' > ')}`);
    assert.deepEqual(r.numeros, [1, 2, 3, 4, 5, 6, 7], `numeração fora de ordem: ${r.numeros.join(',')}`);
    assert.equal(new Set(r.caminho).size, TOTAL, 'pergunta repetida no mesmo caminho');
  }
});

teste('escolhas aleatórias também sempre fecham em 7', () => {
  for (let i = 0; i < 300; i++) {
    const r = percorrer((p) => Math.floor(Math.random() * p.opcoes.length));
    assert.equal(r.caminho.length, TOTAL, `caminho quebrado: ${r.caminho.join(' > ')}`);
  }
});

teste('os três pontos de ramificação são realmente alcançados', () => {
  const vistos = new Set();
  for (let i = 0; i < 400; i++) {
    percorrer((p) => Math.floor(Math.random() * p.opcoes.length)).caminho.forEach((id) => vistos.add(id));
  }
  ['tempoResposta', 'divisao', 'esquecimento', 'atropelo', 'depoisQue', 'cegueira', 'retomada']
    .forEach((id) => assert.ok(vistos.has(id), `a variante ${id} nunca é alcançada: virou código morto`));
});

teste('toda pergunta com variante declara a letra, e o número casa', () => {
  Object.values(PERGUNTAS).forEach((p) => {
    const numerosQueRamificam = [3, 4, 6];
    if (numerosQueRamificam.includes(p.numero)) {
      assert.ok(p.variante, `pergunta ${p.id} é de um número que ramifica e não declara variante`);
    } else {
      assert.ok(!p.variante, `pergunta ${p.id} declara variante mas não está num número que ramifica`);
    }
  });
});

console.log('\nvocabulário e diagnóstico');

teste('nenhum placeholder sobra sem tradução, em nenhuma das 9 profissões', () => {
  const textos = [];
  Object.values(PERGUNTAS).forEach((p) => {
    textos.push(p.texto, p.ajuda || '');
    p.opcoes.forEach((o) => textos.push(o.label));
  });
  Object.values(VAZAMENTOS).forEach((v) => textos.push(v.titulo, v.texto));

  PROFISSOES.forEach((prof) => {
    textos.forEach((t) => {
      const saida = aplicarVocabulario(t, prof.id);
      assert.ok(!saida.includes('{'), `placeholder não traduzido para ${prof.id}: "${saida}"`);
    });
  });
});

teste('todo vazamento do diagnóstico tem ao menos uma resposta que o aponta', () => {
  const apontados = new Set();
  Object.values(PERGUNTAS).forEach((p) => {
    p.opcoes.forEach((o) => (o.peso || []).forEach((w) => apontados.add(w)));
  });
  Object.keys(VAZAMENTOS).forEach((k) => {
    assert.ok(apontados.has(k), `o vazamento "${k}" existe no texto mas nenhuma resposta o marca: nunca apareceria`);
  });
  apontados.forEach((k) => {
    assert.ok(VAZAMENTOS[k], `a resposta marca o peso "${k}", que não existe em VAZAMENTOS: o diagnóstico quebraria`);
  });
});

console.log('\ngravação na planilha');

const CORPO = {
  nome: '  Ana Paula  ',
  whatsapp: '(11) 98167-0838',
  codigo: 'D-4821',
  respostas: { profissao: 'dentista', quantos: '6a15' },
  rotulos: {
    profissao: 'Dentista', quemResponde: 'Só eu', tempoResposta: 'Só quando eu paro, geralmente à noite',
    esquecimento: 'Toda semana', quantos: 'De 6 a 15', retomada: 'Nada, fica por isso mesmo',
    ferramenta: 'WhatsApp Business',
  },
  variantes: { 3: 'A', 4: 'A', 6: 'B' },
  vazamentos: ['demora', 'sem_retomada'],
  utm: { utm_source: 'ig', utm_campaign: 'dentista-dor' },
  pagina: '/',
};

teste('monta 26 colunas, na ordem combinada', () => {
  const l = montarLinha(CORPO, '2026-08-25T14:00:00.000Z');
  assert.equal(l.length, 26, `esperava 26 colunas, veio ${l.length}`);
  assert.equal(l[0], '2026-08-25T14:00:00.000Z', 'A deveria ser a data');
  assert.equal(l[1], 'Ana Paula', 'B deveria ser o nome, sem espaço nas pontas');
  assert.equal(l[2], "'5511981670838", 'C deveria ser o WhatsApp normalizado com aspa à frente');
  assert.equal(l[3], 'D-4821', 'D deveria ser o código');
  assert.equal(l[4], 'Dentista', 'E deveria ser a profissão');
  assert.equal(l[7], 'A', 'H deveria ser a variante da pergunta 3');
  assert.equal(l[14], 'demora, sem_retomada', 'O deveria listar os vazamentos');
  assert.equal(l[21], 'dentista', 'V deveria ser a profissão em código');
});

teste('a resposta da pergunta 3 cai na mesma coluna, venha de qual ramo vier', () => {
  const ramoA = montarLinha(CORPO, 'x');
  const ramoB = montarLinha({ ...CORPO, rotulos: { ...CORPO.rotulos, tempoResposta: undefined, divisao: 'Quem vê primeiro responde' } }, 'x');
  assert.equal(ramoA[6], 'Só quando eu paro, geralmente à noite');
  assert.equal(ramoB[6], 'Quem vê primeiro responde', 'o ramo B da pergunta 3 precisa cair na coluna G igual ao ramo A');
});

teste('acento e pontuação sobrevivem à limpeza de texto', () => {
  const l = montarLinha({ ...CORPO, nome: "João D'Ávila, Jr." }, 'x');
  assert.equal(l[1], "João D'Ávila, Jr.", 'a limpeza não pode comer acento nem pontuação');
});

teste('WhatsApp fora do formato não vira linha silenciosa', () => {
  const l = montarLinha({ ...CORPO, whatsapp: '123' }, 'x');
  assert.equal(l[2], "'null", 'número inválido precisa ficar visível na planilha, e a rota já barra antes disso');
});

console.log('\natribuição de criativo');

// Storage de mentira, para exercitar a regra sem navegador.
function storageFake(inicial) {
  let v = inicial === undefined ? null : JSON.stringify(inicial);
  return {
    getItem: () => v,
    setItem: (_, novo) => { v = novo; },
    get atual() { return v ? JSON.parse(v) : null; },
  };
}
const AGORA = 1_700_000_000_000;
const DIA = 24 * 60 * 60 * 1000;

teste('fbclid sozinho já identifica que veio do Facebook', () => {
  const p = extrairParametros('?fbclid=IwAR123abc');
  assert.equal(p.origem, 'facebook', 'anúncio publicado sem UTM ainda carrega fbclid, e isso é melhor que não saber nada');
});

teste('utm_source vence o fbclid quando os dois vêm juntos', () => {
  assert.equal(extrairParametros('?utm_source=ig&fbclid=x').origem, 'ig');
});

teste('o criativo aceita utm_content e cai para ad_id na falta dele', () => {
  assert.equal(extrairParametros('?utm_content=dentista-dor-v2').criativo, 'dentista-dor-v2');
  assert.equal(extrairParametros('?ad_id=120210000000').criativo, '120210000000', 'sem utm_content, o ad_id da Meta responde a mesma pergunta');
});

teste('query quebrada não derruba nada', () => {
  const p = extrairParametros('?=&&%%%');
  assert.deepEqual(p, { origem: '', campanha: '', criativo: '' });
});

teste('quebra de linha na URL não vaza para a planilha', () => {
  const p = extrairParametros('?utm_campaign=' + encodeURIComponent('linha1\nlinha2'));
  assert.ok(!p.campanha.includes('\n'), 'quebra de linha vira linha nova dentro da célula e desalinha a leitura');
});

teste('último clique vence: anúncio novo sobrescreve o anterior', () => {
  const antigo = { origem: 'ig', campanha: 'camp-a', criativo: 'crit-a', paginaEntrada: '/', quando: AGORA - 2 * DIA };
  const novo = decidirAtribuicao(antigo, { origem: 'fb', campanha: 'camp-b', criativo: 'crit-b', paginaEntrada: '/', agora: AGORA });
  assert.equal(novo.criativo, 'crit-b', 'é a convenção da própria Meta');
});

teste('visita sem campanha não apaga a atribuição que já existe', () => {
  const antigo = { origem: 'ig', campanha: 'camp-a', criativo: 'crit-a', paginaEntrada: '/', quando: AGORA - 2 * DIA };
  const nada = decidirAtribuicao(antigo, { origem: '', campanha: '', criativo: '', paginaEntrada: '/', agora: AGORA });
  assert.equal(nada, null, 'quem volta digitando o endereço não pode zerar o criativo que o trouxe');
});

teste('passados 30 dias, o registro antigo é tratado como inexistente', () => {
  const velho = { origem: 'ig', campanha: 'c', criativo: 'x', paginaEntrada: '/', quando: AGORA - 31 * DIA };
  const novo = decidirAtribuicao(velho, { origem: '', campanha: '', criativo: '', paginaEntrada: '/quiz', agora: AGORA });
  assert.ok(novo, 'fora da janela, a visita direta volta a valer');
  assert.equal(novo.criativo, '');
  assert.equal(novo.paginaEntrada, '/quiz');
});

teste('sem campanha nenhuma, a página de entrada ainda é registrada', () => {
  const novo = decidirAtribuicao(null, { origem: '', campanha: '', criativo: '', paginaEntrada: '/sobre', agora: AGORA });
  assert.equal(novo.paginaEntrada, '/sobre', 'tráfego direto e orgânico também é informação');
});

teste('o lead que volta dias depois ainda leva o criativo junto', () => {
  // Entra pelo anúncio hoje, não responde. Volta em três dias digitando o endereço e responde.
  const st = storageFake();
  registrarVisita({ busca: '?utm_source=ig&utm_content=personal-dor-v1', caminho: '/', storage: st, agora: AGORA });
  registrarVisita({ busca: '', caminho: '/', storage: st, agora: AGORA + 3 * DIA });
  const lido = lerAtribuicao({ storage: st, agora: AGORA + 3 * DIA });
  assert.equal(lido.criativo, 'personal-dor-v1', 'é exatamente o caso que a leitura só da URL perderia');
  assert.equal(lido.origem, 'ig');
});

teste('storage bloqueado não derruba o lead', () => {
  const travado = {
    getItem: () => { throw new Error('modo privado'); },
    setItem: () => { throw new Error('modo privado'); },
  };
  assert.doesNotThrow(() => registrarVisita({ busca: '?utm_source=ig', caminho: '/', storage: travado, agora: AGORA }));
  assert.deepEqual(lerAtribuicao({ storage: travado, agora: AGORA }), { origem: '', campanha: '', criativo: '', paginaEntrada: '' },
    'WebView do Instagram bloqueia storage, e perder atribuição é aceitável, perder o lead não');
});

teste('a atribuição chega nas colunas W a Z', () => {
  const l = montarLinha({ ...CORPO, atribuicao: { origem: 'ig', criativo: 'dentista-dor-v2', campanha: 'chama-dentista', paginaEntrada: '/' } }, 'x');
  assert.equal(l.length, 26, `esperava 26 colunas depois da atribuição, veio ${l.length}`);
  assert.equal(l[22], 'ig', 'W deveria ser a origem atribuída');
  assert.equal(l[23], 'dentista-dor-v2', 'X deveria ser o criativo atribuído');
  assert.equal(l[24], 'chama-dentista', 'Y deveria ser a campanha atribuída');
  assert.equal(l[25], '/', 'Z deveria ser a página de entrada');
});

teste('lead sem atribuição nenhuma não quebra a linha', () => {
  const l = montarLinha(CORPO, 'x');
  assert.equal(l.length, 26, 'a linha tem sempre o mesmo tamanho, com ou sem atribuição');
  assert.deepEqual(l.slice(22), ['', '', '', ''], 'colunas vazias, nunca undefined');
});

console.log(`\n${ok} checagens passaram\n`);
