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
import fs from 'node:fs';
import {
  PERGUNTAS, PRIMEIRA_PERGUNTA, PROFISSOES, VAZAMENTOS, aplicarVocabulario,
  QUIZ_POR_NICHO, resolverQuiz,
} from './quiz-dados.js';
import { montarLinha, abaDoNicho, cabecalhoNicho, montarLinhaNicho } from './api/quiz.js';
import { extrairParametros, decidirAtribuicao, registrarVisita, lerAtribuicao } from './atribuicao.js';
import { _interno } from './quiz.js';
import { VSL_POR_PROFISSAO, resolverVsl } from './vsl.js';

const TOTAL = 7;
let ok = 0;
let falhas = 0;
function teste(nome, fn) {
  try { fn(); ok++; console.log('  ok  ', nome); }
  catch (e) { falhas++; console.error('  FALHOU', nome, '\n      ', e.message); process.exitCode = 1; }
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

teste('nenhum placeholder sobra sem tradução, em nenhuma das profissões da lista', () => {
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

// ---------------------------------------------------------------------------------------
// W2 — quiz por nicho. O que quebraria em silêncio aqui: uma lista que não termina (tela
// vazia sem erro no console), um `peso` apontando dor que não existe naquele nicho (achado
// some do diagnóstico), ou um nicho de camada 2 deixando de cair no genérico.
// ---------------------------------------------------------------------------------------

console.log('\nquiz por nicho');

const NICHOS_PROPRIOS = Object.keys(QUIZ_POR_NICHO).filter((k) => k !== 'default');

// Percorre a lista de um nicho como o motor faria, a partir da segunda pergunta.
function percorrerNicho(nicho, escolher) {
  const quiz = QUIZ_POR_NICHO[nicho];
  const respostas = { profissao: nicho };
  const caminho = [];
  const numeros = [];
  let atual = PERGUNTAS.profissao.proxima(respostas);
  let guarda = 0;
  while (atual) {
    if (++guarda > 20) throw new Error(`a lista de ${nicho} não terminou: ciclo em ${atual}`);
    const p = quiz.perguntas[atual];
    assert.ok(p, `${nicho}: pergunta inexistente no caminho: ${atual}`);
    const opcao = p.opcoes[escolher(p) % p.opcoes.length];
    respostas[p.id] = opcao.valor;
    caminho.push(p.id);
    numeros.push(p.numero);
    atual = p.proxima(respostas);
  }
  return { respostas, caminho, numeros };
}

teste('a camada 1 tem exatamente os nichos decididos', () => {
  // Guarda de decisão, não de implementação: camada 1 custa revisão de dores pelo Orlando e uma
  // aba nova na planilha por nicho. Mexer aqui sem o gate é o que este teste existe para pegar.
  //
  // 28/08: Personal, Corretor e Dentista.
  // 31/08: entram Corretor de Seguros, Veterinário e Oficina Mecânica — as três primeiras do
  //        ranking da pesquisa de profissões, e as três cuja dor não tem equivalente no
  //        genérico (renovação de apólice, retorno de vacina, box travado).
  //        ✅ CONFIRMADO PELO VITOR em 31/08: "com o quiz mudado está perfeito, é bom a gente
  //        pegar todas as profissões ali".
  //
  // Camada 1 de QUIZ não obriga camada 1 de VSL: `resolverVsl` cai no `default` para quem não
  // tem `vturbId`, então isto não acrescenta gravação nenhuma à fila do Orlando.
  assert.deepEqual(NICHOS_PROPRIOS.sort(),
    ['corretor', 'corretor_seguros', 'dentista', 'oficina', 'personal', 'veterinario'],
    'a camada 1 mudou sem o gate');
});

teste('todo nicho termina, com o número de perguntas que promete', () => {
  NICHOS_PROPRIOS.forEach((nicho) => {
    for (let i = 0; i < 5; i++) {
      const r = percorrerNicho(nicho, () => i);
      // +1 porque a pergunta de profissão vive fora da lista do nicho.
      assert.equal(r.caminho.length + 1, QUIZ_POR_NICHO[nicho].total,
        `${nicho}: percorreu ${r.caminho.length + 1} perguntas, prometeu ${QUIZ_POR_NICHO[nicho].total}`);
      assert.equal(new Set(r.caminho).size, r.caminho.length, `${nicho}: pergunta repetida no caminho`);
      assert.deepEqual(r.numeros, [2, 3, 4, 5, 6, 7], `${nicho}: numeração fora de ordem: ${r.numeros.join(',')}`);
    }
  });
});

teste('nenhum nicho ficou mais longo que o genérico sem o gate', () => {
  // A decisão de 28/08 foi manter 7. Subir para 8-10 é permitido pelo plano, mas é decisão do
  // Vitor: se alguém alongar sem passar por ele, o abandono sobe junto e ninguém liga uma coisa
  // à outra.
  NICHOS_PROPRIOS.forEach((nicho) => {
    assert.equal(QUIZ_POR_NICHO[nicho].total, 7,
      `${nicho} tem ${QUIZ_POR_NICHO[nicho].total} perguntas: o combinado é 7`);
  });
});

teste('toda resposta aponta dor que existe no próprio nicho', () => {
  NICHOS_PROPRIOS.forEach((nicho) => {
    const quiz = QUIZ_POR_NICHO[nicho];
    Object.values(quiz.perguntas).forEach((p) => {
      p.opcoes.forEach((o) => (o.peso || []).forEach((w) => {
        assert.ok(quiz.dores[w], `${nicho}: a resposta "${o.label}" aponta a dor "${w}", que não existe nesse nicho`);
      }));
    });
  });
});

teste('toda dor de nicho é alcançável por alguma resposta', () => {
  NICHOS_PROPRIOS.forEach((nicho) => {
    const quiz = QUIZ_POR_NICHO[nicho];
    const apontadas = new Set();
    Object.values(quiz.perguntas).forEach((p) => {
      p.opcoes.forEach((o) => (o.peso || []).forEach((w) => apontadas.add(w)));
    });
    Object.keys(quiz.dores).forEach((k) => {
      assert.ok(apontadas.has(k), `${nicho}: a dor "${k}" existe no texto mas nenhuma resposta a marca: nunca apareceria`);
    });
  });
});

teste('a ordem de exibição cobre exatamente as dores do nicho, com cegueira na frente', () => {
  Object.entries(QUIZ_POR_NICHO).forEach(([nicho, quiz]) => {
    assert.deepEqual([...quiz.ordemDores].sort(), Object.keys(quiz.dores).sort(),
      `${nicho}: ordemDores e dores divergem, então alguma dor calculada nunca seria exibida`);
    assert.equal(quiz.ordemDores[0], 'cegueira',
      `${nicho}: a cegueira precisa vir primeiro — não adianta falar de vazamento com quem não mede nenhum`);
  });
});

teste('nicho de camada 2 e profissão desconhecida caem no genérico', () => {
  ['esteticista', 'nutri', 'advogado', 'psicologo', 'fisio', 'cabeleireiro', 'medico',
   'barbearia', 'pilates', 'arquiteto', 'contador', 'outra']
    .forEach((id) => {
      assert.equal(resolverQuiz(id), QUIZ_POR_NICHO.default, `${id} deveria cair no quiz genérico`);
    });
  assert.equal(resolverQuiz('profissao_que_nao_existe'), QUIZ_POR_NICHO.default);
  assert.equal(resolverQuiz(undefined), QUIZ_POR_NICHO.default, 'antes da pergunta 1 o quiz é o genérico');
});

teste('as profissões acrescentadas depois dos criativos continuam na lista', () => {
  const ids = PROFISSOES.map((p) => p.id);
  // 28/08, W8
  ['cabeleireiro', 'medico'].forEach((id) =>
    assert.ok(ids.includes(id), `${id} entrou na camada 2 pela decisão de 28/08`));
  // 31/08, pesquisa de profissões que mais dependem de WhatsApp
  ['corretor_seguros', 'veterinario', 'oficina', 'barbearia', 'pilates', 'arquiteto', 'contador']
    .forEach((id) => assert.ok(ids.includes(id), `${id} entrou pela pesquisa de 31/08`));
  assert.equal(ids[ids.length - 1], 'outra', '"outra profissão" precisa continuar sendo a última opção da lista');
  assert.equal(new Set(ids).size, ids.length, 'id de profissão repetido: o quiz resolveria o nicho errado');
});

teste('o texto curto do botão nunca vaza para a planilha nem para o nome da aba', () => {
  // O botão da pergunta 1 mostra "Veterinário"; a planilha precisa continuar recebendo
  // "Veterinário ou Clínica Veterinária". Se alguém apagar o `rotulo` da opção, a coluna
  // Profissão passa a gravar o texto curto e o histórico fica partido em dois nomes, sem
  // erro nenhum. A aba do nicho também mudaria de nome e nasceria duplicada.
  const porId = Object.fromEntries(PROFISSOES.map((p) => [p.id, p]));
  PERGUNTAS.profissao.opcoes.forEach((o) => {
    const p = porId[o.valor];
    assert.equal(o.rotulo, p.label, `${o.valor}: a opção precisa gravar o label completo`);
    assert.equal(o.label, p.curto || p.label, `${o.valor}: o botão precisa mostrar o texto curto`);
  });
  // A aba do nicho lê PROFISSOES.label direto, então tem que seguir com o nome completo.
  [['personal', 'Personal Trainer'], ['corretor', 'Corretor de Imóveis'], ['dentista', 'Dentista'],
   ['veterinario', 'Veterinário ou Clínica Veterinária']]
    .forEach(([id, nome]) => assert.equal(abaDoNicho(id), nome, `a aba de ${id} mudou de nome`));
});

teste('nenhum placeholder sobra nos textos de nicho', () => {
  NICHOS_PROPRIOS.forEach((nicho) => {
    const quiz = QUIZ_POR_NICHO[nicho];
    const textos = [];
    Object.values(quiz.perguntas).forEach((p) => {
      textos.push(p.texto, p.ajuda || '');
      p.opcoes.forEach((o) => textos.push(o.label));
    });
    Object.values(quiz.dores).forEach((d) => textos.push(d.titulo, d.texto));
    textos.forEach((t) => {
      assert.ok(!aplicarVocabulario(t, nicho).includes('{'), `${nicho}: placeholder não traduzido em "${t}"`);
    });
  });
});

// ---------------------------------------------------------------------------------------
// W1 — vídeo por nicho no diagnóstico. O que quebraria em silêncio: uma profissão que
// resolve para um objeto sem `titulo` (o bloco do player aparece sem chamada e ninguém dá
// play), ou um nicho de camada 1 sem entrada própria (o Orlando grava e não tem onde colar
// o id sem mexer no motor).
// ---------------------------------------------------------------------------------------

console.log('\nvídeo por nicho');

teste('o default tem título e legenda, sempre', () => {
  assert.ok(VSL_POR_PROFISSAO.default, 'sem entrada default, nicho sem vídeo fica sem player');
  assert.ok(VSL_POR_PROFISSAO.default.titulo, 'default sem título: o bloco do vídeo aparece mudo');
  assert.ok(VSL_POR_PROFISSAO.default.legenda, 'default sem legenda');
});

teste('toda profissão da lista resolve para um vídeo com título e legenda, sem lançar', () => {
  PROFISSOES.forEach((p) => {
    let vsl;
    assert.doesNotThrow(() => { vsl = resolverVsl(p.id); }, `resolverVsl('${p.id}') lançou`);
    assert.ok(vsl && vsl.titulo, `${p.id} resolveu para algo sem título`);
    assert.ok(vsl && vsl.legenda, `${p.id} resolveu para algo sem legenda`);
  });
});

teste('profissão desconhecida e ausente caem no default', () => {
  assert.equal(resolverVsl('profissao_que_nao_existe'), VSL_POR_PROFISSAO.default);
  assert.equal(resolverVsl(undefined), VSL_POR_PROFISSAO.default, 'antes da pergunta 1 o vídeo é o default');
});

teste('entrada sem vídeo cai no default; com vturbId ou arquivo, vence', () => {
  // Enquanto o Orlando não grava, personal/corretor/dentista existem com título próprio mas sem
  // vturbId, e o lead vê o vídeo default. Assim que o id entra, a entrada do nicho passa a valer.
  Object.entries(VSL_POR_PROFISSAO).forEach(([id, e]) => {
    if (id === 'default') return;
    if (e.vturbId || e.arquivo) {
      assert.equal(resolverVsl(id), e, `${id} tem vídeo próprio e deveria vencer o default`);
    } else {
      assert.equal(resolverVsl(id), VSL_POR_PROFISSAO.default, `${id} sem vídeo deveria cair no default`);
    }
  });
});

teste('os três nichos da camada 1 têm entrada própria, prontos para receber o vturbId', () => {
  ['personal', 'corretor', 'dentista'].forEach((id) => {
    const e = VSL_POR_PROFISSAO[id];
    assert.ok(e, `${id} precisa de entrada própria para o Orlando só colar o id, sem abrir o motor`);
    assert.ok(e.titulo && e.legenda, `${id} sem título/legenda sob medida: a entrada própria não serve pra nada`);
    assert.ok('vturbId' in e, `${id} sem campo vturbId: não dá pra publicar sem editar a forma do objeto`);
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

teste('monta 28 colunas, na ordem combinada', () => {
  const l = montarLinha(CORPO, '2026-08-25T14:00:00.000Z');
  assert.equal(l.length, 28, `esperava 28 colunas, veio ${l.length}`);
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

teste('o lead de um nicho preenche as mesmas colunas, com os ids dele', () => {
  // O dentista responde `quemOrcamento` onde o genérico responde `tempoResposta`. Sem a ordem,
  // montarLinha procuraria um id que não existe e gravaria a linha com buracos, sem erro nenhum.
  const corpoNicho = {
    ...CORPO,
    respostas: { profissao: 'dentista', faltas: 'bastante' },
    rotulos: {
      profissao: 'Dentista',
      quemResponde: 'Eu e mais uma pessoa',
      quemOrcamento: 'A recepção responde quando dá uma brecha',
      comoPassaValor: 'Mando o valor pelo WhatsApp mesmo',
      orcamentoParado: 'Fica por isso mesmo',
      faltas: 'Bastante, é o meu maior problema',
      manutencao: 'Só se ele procurar',
    },
    ordem: ['profissao', 'quemResponde', 'quemOrcamento', 'comoPassaValor', 'orcamentoParado', 'faltas', 'manutencao'],
    nicho: 'dentista',
    variantes: {},
  };
  const l = montarLinha(corpoNicho, 'x');
  assert.equal(l.length, 28);
  assert.equal(l[4], 'Dentista', 'E continua sendo a profissão');
  assert.equal(l[5], 'Eu e mais uma pessoa', 'F continua sendo a P2');
  assert.equal(l[6], 'A recepção responde quando dá uma brecha', 'G precisa trazer a P3 do dentista');
  assert.equal(l[8], 'Mando o valor pelo WhatsApp mesmo', 'I precisa trazer a P4 do dentista');
  assert.equal(l[10], 'Fica por isso mesmo', 'K precisa trazer a P5 do dentista');
  assert.equal(l[11], 'Bastante, é o meu maior problema', 'L precisa trazer a P6 do dentista');
  assert.equal(l[13], 'Só se ele procurar', 'N precisa trazer a P7 do dentista');
  assert.equal(l[27], 'dentista', 'AB precisa dizer qual quiz o lead respondeu');
});

teste('o respostas_json da coluna AA volta inteiro', () => {
  const l = montarLinha({ ...CORPO, ordem: ['profissao', 'quemResponde'], nicho: 'default' }, 'x');
  const json = JSON.parse(l[26]);
  assert.deepEqual(json.respostas, CORPO.respostas, 'as respostas precisam sobreviver ao round-trip');
  assert.equal(json.rotulos.profissao, 'Dentista');
  assert.deepEqual(json.ordem, ['profissao', 'quemResponde'], 'a ordem é o que permite ler a linha depois');
});

teste('payload sem ordem ainda grava, pelo mapeamento antigo', () => {
  // Aba aberta antes do deploy continua enviando o formato velho. Se isso gravasse linha vazia,
  // o lead sumiria em silêncio justamente na janela do deploy.
  const { ordem, ...semOrdem } = { ...CORPO, ordem: undefined };
  const l = montarLinha(semOrdem, 'x');
  assert.equal(l[5], 'Só eu', 'F precisa continuar vindo pelo id conhecido');
  assert.equal(l[6], 'Só quando eu paro, geralmente à noite', 'G precisa continuar vindo pelo id conhecido');
  assert.equal(l[13], 'WhatsApp Business', 'N precisa continuar vindo pelo id conhecido');
});

teste('o cabeçalho do verificador tem o mesmo tamanho da linha que a rota grava', () => {
  // Os dois arquivos descrevem a mesma planilha e não se enxergam. Divergir aqui só apareceria
  // no dia em que alguém rodasse o verificador contra a planilha real.
  const fonte = fs.readFileSync('verificar-planilha.mjs', 'utf8');
  const bloco = fonte.match(/const CABECALHO = \[([\s\S]*?)\];/)[1]
    .replace(/\/\/.*$/gm, '');  // comentário com vírgula dentro engoliria a coluna seguinte
  const colunas = bloco.match(/'[^']*'/g) || [];
  assert.equal(colunas.length, montarLinha(CORPO, 'x').length,
    `o verificador espera ${colunas.length} colunas e a rota grava ${montarLinha(CORPO, 'x').length}`);
});

teste('acento e pontuação sobrevivem à limpeza de texto', () => {
  const l = montarLinha({ ...CORPO, nome: "João D'Ávila, Jr." }, 'x');
  assert.equal(l[1], "João D'Ávila, Jr.", 'a limpeza não pode comer acento nem pontuação');
});

teste('WhatsApp fora do formato não vira linha silenciosa', () => {
  const l = montarLinha({ ...CORPO, whatsapp: '123' }, 'x');
  assert.equal(l[2], "'null", 'número inválido precisa ficar visível na planilha, e a rota já barra antes disso');
});

// ---------------------------------------------------------------------------------------
// W4 — aba por nicho. A aba mestre 'Leads' recebe todo lead (montarLinha, 28 colunas). Cada
// nicho de camada 1 ganha uma aba própria, com uma coluna por pergunta daquele nicho, legível
// sem abrir o JSON. O que quebra em silêncio: cabeçalho e linha da aba do nicho com tamanhos
// diferentes (dado entra torto e ninguém vê até abrir a aba), ou um nicho de camada 2 ganhando
// aba à toa.
// ---------------------------------------------------------------------------------------

console.log('\naba por nicho (W4)');

const CORPO_DENTISTA_NICHO = {
  nome: 'Marina Alves',
  whatsapp: '(11) 98167-0838',
  codigo: 'D-7781',
  respostas: { profissao: 'dentista', faltas: 'bastante' },
  rotulos: {
    profissao: 'Dentista',
    quemResponde: 'Eu e mais uma pessoa',
    quemOrcamento: 'A recepção responde quando dá uma brecha',
    comoPassaValor: 'Mando o valor pelo WhatsApp mesmo',
    orcamentoParado: 'Fica por isso mesmo',
    faltas: 'Bastante, é o meu maior problema',
    manutencao: 'Só se ele procurar',
  },
  ordem: ['profissao', 'quemResponde', 'quemOrcamento', 'comoPassaValor', 'orcamentoParado', 'faltas', 'manutencao'],
  nicho: 'dentista',
  pagina: '/',
  atribuicao: { origem: 'ig', criativo: 'dentista-dor-v2', campanha: 'chama-dentista', paginaEntrada: '/' },
};

teste('a aba do nicho existe só para a camada 1', () => {
  assert.equal(abaDoNicho('personal'), 'Personal Trainer');
  assert.equal(abaDoNicho('corretor'), 'Corretor de Imóveis');
  assert.equal(abaDoNicho('dentista'), 'Dentista');
  assert.equal(abaDoNicho('advogado'), null, 'camada 2 não ganha aba própria');
  assert.equal(abaDoNicho('default'), null);
  assert.equal(abaDoNicho(undefined), null, 'lead do quiz genérico não tem aba de nicho');
});

teste('o cabeçalho da aba do nicho tem uma coluna por pergunta, na ordem, mais a reserva do W3', () => {
  NICHOS_PROPRIOS.forEach((nicho) => {
    const cab = cabecalhoNicho(nicho);
    assert.ok(Array.isArray(cab), `${nicho} sem cabeçalho de aba`);
    assert.deepEqual(cab.slice(0, 4), ['Data e hora', 'Nome', 'WhatsApp', 'Código'],
      `${nicho}: as 4 primeiras colunas são de identificação`);
    const perguntas = cab.slice(4, 4 + QUIZ_POR_NICHO[nicho].total);
    assert.equal(perguntas.length, QUIZ_POR_NICHO[nicho].total, `${nicho}: faltou coluna de pergunta`);
    assert.ok(perguntas.every((t) => typeof t === 'string' && t.length > 5), `${nicho}: coluna de pergunta sem texto`);
    assert.equal(cab[cab.length - 1], 'Diagnóstico completo', `${nicho}: a última coluna fica reservada pro W3`);
  });
});

teste('cabeçalho e linha da aba do nicho têm o mesmo tamanho', () => {
  // Montados em lugares diferentes de api/quiz.js e não se enxergam. Divergir aqui grava dado
  // torto na aba do nicho sem erro nenhum.
  const linha = montarLinhaNicho(CORPO_DENTISTA_NICHO, '2026-08-28T12:00:00.000Z');
  assert.equal(linha.length, cabecalhoNicho('dentista').length,
    `linha com ${linha.length} colunas, cabeçalho com ${cabecalhoNicho('dentista').length}`);
});

teste('a linha da aba do nicho traz identidade, respostas na ordem e a coluna do W3 vazia', () => {
  const l = montarLinhaNicho(CORPO_DENTISTA_NICHO, '2026-08-28T12:00:00.000Z');
  assert.equal(l[0], '2026-08-28T12:00:00.000Z');
  assert.equal(l[1], 'Marina Alves');
  assert.equal(l[2], "'5511981670838");
  assert.equal(l[3], 'D-7781');
  assert.equal(l[4], 'Dentista', 'a 5ª coluna é a resposta da P1 (profissão)');
  assert.equal(l[5], 'Eu e mais uma pessoa', 'a 6ª é a P2 do dentista');
  assert.equal(l[6], 'A recepção responde quando dá uma brecha', 'a 7ª é a P3 do dentista');
  assert.equal(l[9], 'Bastante, é o meu maior problema', 'a P6 do dentista (faltas) cai na coluna certa');
  assert.equal(l[10], 'Só se ele procurar', 'a P7 do dentista (manutenção) é a última de pergunta');
  assert.equal(l[l.length - 1], '', 'a coluna de diagnóstico do W3 vai vazia por enquanto');
});

teste('nicho de camada 2 e quiz genérico não geram cabeçalho de aba', () => {
  assert.equal(cabecalhoNicho('advogado'), null);
  assert.equal(cabecalhoNicho('default'), null);
  assert.equal(cabecalhoNicho(undefined), null);
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
  assert.equal(l.length, 28, `esperava 28 colunas depois da atribuição, veio ${l.length}`);
  assert.equal(l[22], 'ig', 'W deveria ser a origem atribuída');
  assert.equal(l[23], 'dentista-dor-v2', 'X deveria ser o criativo atribuído');
  assert.equal(l[24], 'chama-dentista', 'Y deveria ser a campanha atribuída');
  assert.equal(l[25], '/', 'Z deveria ser a página de entrada');
});

teste('lead sem atribuição nenhuma não quebra a linha', () => {
  const l = montarLinha(CORPO, 'x');
  assert.equal(l.length, 28, 'a linha tem sempre o mesmo tamanho, com ou sem atribuição');
  assert.deepEqual(l.slice(22, 26), ['', '', '', ''], 'W a Z vazias, nunca undefined');
});

// ---------------------------------------------------------------------------------------
// Medição por nicho. `profissao` é a dimensão que decide qual nicho sobe de camada, e ela é
// injetada dentro de medir(), não em cada chamada. Um evento novo que nasça sem ela não
// quebra nada visível: só produz relatório incompleto, que é pior, porque parece completo.
// ---------------------------------------------------------------------------------------

function espionarMedicao(fn) {
  const eventos = [];
  const janelaAntiga = globalThis.window;
  globalThis.window = { gtag: (_tipo, nome, dados) => eventos.push({ nome, dados }) };
  try { fn(); } finally { globalThis.window = janelaAntiga; }
  return eventos;
}

teste('todo evento medido carrega a profissão junto', () => {
  _interno.estado.respostas.profissao = 'dentista';
  const eventos = espionarMedicao(() => {
    _interno.medir('quiz_pergunta_vista', { numero: 3 });
    _interno.medir('clique_whatsapp');
    _interno.medir('quiz_lead_gravado', { codigo: 'D-1234' });
  });
  assert.equal(eventos.length, 3, 'os três eventos deveriam ter chegado ao gtag');
  eventos.forEach((e) => {
    assert.equal(e.dados.profissao, 'dentista', `${e.nome} foi medido sem profissão`);
  });
  assert.equal(eventos[0].dados.numero, 3, 'a injeção não pode engolir o dado próprio do evento');
  delete _interno.estado.respostas.profissao;
});

teste('antes da pergunta 1 a profissão vai preenchida, não vazia', () => {
  delete _interno.estado.respostas.profissao;
  const [e] = espionarMedicao(() => _interno.medir('quiz_pergunta_vista', { numero: 1 }));
  // Campo ausente some do relatório do GA4 e o nicho "ainda não respondeu" vira buraco em vez
  // de linha. Um valor explícito mantém a soma por nicho fechando com o total de eventos.
  assert.equal(e.dados.profissao, 'nao_informada');
});

teste('medição não derruba o funil quando não existe tag nenhuma', () => {
  const janelaAntiga = globalThis.window;
  globalThis.window = {};
  try {
    assert.doesNotThrow(() => _interno.medir('quiz_resposta', { numero: 1 }));
  } finally { globalThis.window = janelaAntiga; }
});

// ---------------------------------------------------------------------------------------
// Arquivos de SEO. Sitemap apontando para rota que não existe é erro de cobertura no Search
// Console, e é exatamente o risco quando /diagnostico entrar no W7: alguém acrescenta a URL
// aqui antes de o arquivo existir e ninguém percebe até o Google reclamar.
// ---------------------------------------------------------------------------------------

const ROTA_PARA_ARQUIVO = { '/': 'index.html' };

teste('toda URL do sitemap corresponde a uma página que existe', () => {
  const xml = fs.readFileSync('sitemap.xml', 'utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(urls.length > 0, 'sitemap sem nenhuma URL');
  urls.forEach((url) => {
    const rota = new URL(url).pathname;
    const arquivo = ROTA_PARA_ARQUIVO[rota] || `${rota.replace(/^\//, '')}.html`;
    assert.ok(fs.existsSync(arquivo), `sitemap promete ${rota}, mas ${arquivo} não existe no repo`);
  });
});

teste('robots.txt aponta para o sitemap e não bloqueia o site', () => {
  const robots = fs.readFileSync('robots.txt', 'utf8');
  assert.match(robots, /^Sitemap: https:\/\/\S+\/sitemap\.xml$/m, 'robots.txt sem linha Sitemap');
  assert.doesNotMatch(robots, /^Disallow: \/$/m, 'Disallow: / tira o site inteiro do Google');
});

teste('vercel.json serve /diagnostico com o funil do quiz (W7 passo 1)', () => {
  // Enquanto o cutover do W7 não chega, /diagnostico não é arquivo próprio: é um rewrite para
  // o index.html, para os anúncios já poderem apontar para a rota nova. Se alguém tirar o
  // rewrite antes de existir um diagnostico.html, a URL dos anúncios passa a 404 calada.
  const cfg = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  const temArquivo = fs.existsSync('diagnostico.html');
  const regra = (cfg.rewrites || []).find((r) => r.source === '/diagnostico');
  const destinoFunil = regra && (regra.destination === '/' || regra.destination === '/index.html');
  assert.ok(
    temArquivo || destinoFunil,
    '/diagnostico não resolve: sem diagnostico.html e sem rewrite para o funil no vercel.json',
  );
});

teste('o JSON-LD de toda página parseia', () => {
  ['index.html', 'sobre.html'].forEach((f) => {
    const blocos = [...fs.readFileSync(f, 'utf8')
      .matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.ok(blocos.length > 0, `${f} sem JSON-LD`);
    blocos.forEach((b) => {
      // Um JSON-LD quebrado não aparece no console do navegador nem derruba a página: o
      // Google simplesmente ignora, e a página perde o rich result em silêncio.
      assert.doesNotThrow(() => JSON.parse(b[1]), `JSON-LD de ${f} não parseia`);
    });
  });
});

teste('o FAQ estruturado promete as mesmas perguntas que a página mostra', () => {
  const html = fs.readFileSync('sobre.html', 'utf8');
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const faq = ld['@graph'].find((n) => n['@type'] === 'FAQPage');
  const visiveis = [...html.matchAll(/<button class="faq-q">([^<]+)</g)].map((m) => m[1].trim());
  assert.equal(faq.mainEntity.length, visiveis.length,
    `${faq.mainEntity.length} perguntas no JSON-LD contra ${visiveis.length} na página`);
  faq.mainEntity.forEach((q) => {
    assert.ok(visiveis.includes(q.name), `"${q.name}" está no JSON-LD mas não aparece na página`);
  });
});

teste('a verificação do Search Console sobrevive à troca de páginas', () => {
  // A tag está nas quatro páginas de propósito, e não só na home. O W7 vai trocar qual arquivo
  // serve a "/", e uma verificação que morasse só no index cairia calada nessa migração: o
  // Search Console desverifica a propriedade sem avisar, e o sitemap para de ser lido.
  ['index.html', 'sobre.html', 'privacidade.html', 'termos.html'].forEach((f) => {
    assert.match(fs.readFileSync(f, 'utf8'), /name="google-site-verification" content="[^"]+"/,
      `${f} sem a meta de verificação do Search Console`);
  });
});

teste('os três planos do site batem com a estrutura oficial', () => {
  // O Fogo ficou dois meses no site a R$ 2.487 depois de ter sido reajustado para R$ 2.500 no
  // doc-fonte, e ninguém viu. Preço divergente no site é o erro mais caro que uma página de
  // planos comete: o lead entra na reunião com um número que a proposta não confirma.
  const html = fs.readFileSync('sobre.html', 'utf8');
  const planos = [
    { nome: 'Brasa', preco: '447' },
    { nome: 'Chama', preco: '747' },
    { nome: 'Fogo',  preco: '2.500' },
  ];
  // Lê o texto de cada card em vez de adivinhar a marcação: o emoji vive dentro de um <span>
  // próprio, e uma regex que assume a estrutura quebra ao primeiro ajuste de layout.
  const nomesNoSite = [...html.matchAll(/class="plan-name"[^>]*>([\s\S]*?)<\/div>/g)]
    .map((m) => m[1].replace(/<[^>]*>/g, '').trim());
  planos.forEach(({ nome, preco }) => {
    assert.ok(nomesNoSite.some((n) => n.includes(nome)),
      `o card do plano ${nome} sumiu da página. Achei: ${nomesNoSite.join(', ')}`);
    assert.ok(html.includes(`>${preco}<`), `o preço de ${preco} não aparece: o plano ${nome} está com valor divergente`);
  });
  assert.ok(html.includes('Somente contrato anual'),
    'o Brasa só existe em contrato anual, e isso precisa estar visível no card, não em letra miúda');
});

teste('nenhuma página aponta para imagem que não existe', () => {
  ['index.html', 'sobre.html', 'privacidade.html', 'termos.html'].forEach((f) => {
    const refs = [...fs.readFileSync(f, 'utf8').matchAll(/(?:src|href)="(assets\/[^"]+)"/g)];
    refs.forEach((m) => {
      assert.ok(fs.existsSync(m[1]), `${f} aponta para ${m[1]}, que não existe`);
    });
  });
});

// A linha final precisa dizer que houve falha. Antes ela imprimia só o número de passes, então
// `npm test | tail` mostrava "56 checagens passaram" com uma quebrada no meio e exit 1 — verde
// aos olhos de quem lê o fim da saída. É o mesmo modo de falha já documentado no cofre.
if (falhas) {
  console.error(`\n${falhas} FALHA(S) e ${ok} checagens passaram — a suíte está VERMELHA\n`);
} else {
  console.log(`\n${ok} checagens passaram\n`);
}
