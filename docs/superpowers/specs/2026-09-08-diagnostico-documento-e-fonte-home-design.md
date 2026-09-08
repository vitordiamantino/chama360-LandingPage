# Diagnóstico como documento, aba na planilha e fonte da home

Data: 2026-09-08
Repo: chama360-site (github.com/vitordiamantino/chama360-LandingPage)
Estado: aprovado pelo Vitor, aguardando revisão da spec antes do plano de implementação.

## Contexto

Três ajustes pedidos numa tacada:

1. A home (`/`, `index.html`) passa a usar a família de fontes da Meu Banco Não.
2. Remover travessões (`—`) da cópia visível do site.
3. O fim do quiz `/diagnostico` deixa de mostrar só uma lista de vazamentos e passa a
   entregar um **documento de diagnóstico personalizado**, inspirado num vídeo de personal
   trainer que entrega "plano de ação / avaliação" ao aluno antes de fechar a venda. O
   documento é voltado para a estratégia da CHAMA: o plano de 90 dias É a adoção da
   plataforma.

O item 3 substitui, por enquanto, o bloco da VSL, que já está comentado em
`diagnostico.html` (linhas 229-249). `vsl.js` continua intacto para quando a gravação existir.

## Referência: estrutura do vídeo

Cabeçalho com nome e dados · "o que foi identificado" · pontos fortes · pontos de melhoria ·
plano de ação em fases nomeadas · fases quebradas em semanas · meta dos 90 dias · fechamento
com contato. Pitch: "ninguém faz isso, o cliente vai se surpreender".

---

## Item 1: fonte da home

### Escopo

Só `index.html` (a home institucional em `/`). `diagnostico.html`, `home-nova.html`,
`privacidade.html`, `termos.html` ficam como estão.

### Mudança

No `:root` de `index.html` (linhas 144-146) e no `<link>` do Google Fonts (linha 125):

| Token | Hoje | Novo |
|---|---|---|
| `--serif` | `'Instrument Serif', 'Times New Roman', serif` | `'Playfair Display', Georgia, serif` |
| `--sans` | `'Geist', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif` | `'Barlow', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif` |
| `--mono` | `'Geist Mono', ui-monospace, monospace` | `'Barlow Condensed', ui-sans-serif, sans-serif` |

Novo `<link>`:
`https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&display=swap`

Adicionar token `--num: 'Bebas Neue', 'Barlow Condensed', sans-serif` e aplicá-lo em
`.stat-num` e `.plan-price` (papel de "número grande", que é como a MBN usa Bebas Neue).
Somar `Bebas+Neue` ao `<link>`.

### Ajuste obrigatório de peso

Playfair Display não tem peso 400. Todo seletor que hoje combina `font-family: var(--serif)`
com `font-weight: 400` (ou sem declarar peso) sobe para `font-weight: 700`. Alvos conhecidos:
`h2`, `.pain-text`, `.benefit h4`, `.plan-name`, `.plan-price`, `.guarantee h3`, `.faq-q`,
`.ps` e a citação em itálico do bloco de garantia. Varredura completa na implementação: buscar
`var(--serif)` no arquivo e conferir cada uso renderizado.

### Verificação

Abrir `index.html` local (`abrir-site.bat`) e conferir hierarquia visual em desktop e mobile.
`verificar:visual` já percorre a home; a captura serve de antes/depois.

---

## Item 2: travessões

### Alvo

Cópia visível que vai ao ar. Não mexer em comentário de código.

- `index.html`: aproximadamente 20 ocorrências em texto visível. Trocar por vírgula, ponto,
  dois-pontos ou parênteses conforme a frase. As que estão em comentário de CSS
  (`/* Pain section — dark */`) ficam.
- `quiz-dados.js:354`: 1 em `DORES_DENTISTA.recepcao_afogada.texto` ("ganha certo — mas
  isso"), trocar por vírgula. As outras 5 do arquivo são comentário, ficam.
- `home-nova.html` (28 ocorrências): fora do escopo agora (é `noindex`, rascunho). Entra
  quando o arquivo virar a home.
- `vsl.js`, `quiz.js`: só comentário, não mexer.

### Guard

`test-quiz.mjs` ganha uma checagem que falha se `—` (U+2014) reaparecer em `quiz-dados.js`,
`abordagem.js` ou `plano.js`. Já existe regra equivalente para emoji nesses arquivos.

---

## Item 3: diagnóstico como documento

### Fluxo

Quiz (7 perguntas) → captura (nome + WhatsApp) → **documento de diagnóstico na tela** →
botão "Baixar PDF" + botão "Agendar pelo WhatsApp".

### Passada completa nas 7 perguntas (documento gated, antes do código)

O Vitor pediu uma revisão das 7 perguntas do quiz, alinhada à estratégia da CHAMA. Sai
primeiro como documento para o gate dele, depois vira código. Regras dadas:

Decisões travadas pelo Vitor em 08/09:

- **7 perguntas**, em todos os nichos. Não muda.
- **No máximo 5 respostas por pergunta.** A pergunta 1 (profissão) é exceção: seletor que
  roteia o nicho, mantém as 18 opções. Com o limite em 5, as perguntas de hoje já cabem
  (a maioria tem 4, `quantos` tem 5) e `FAIXAS` continua com as 4 faixas de hoje.
- **Nenhuma dor pode sumir.** Cada profissão continua com as perguntas dela, sob medida.
- **`quemResponde` sai** e abre a vaga para uma pergunta que bate direto na perda de cliente.
  É a pergunta mais barata de perder: das 4 respostas, só uma marca dor, e essa dor já é
  marcada por outra pergunta em todo quiz.
- **Consequência no quiz genérico:** era o `quemResponde` que roteava entre o caminho de
  tempo (dor `demora`) e o de dono da conversa (dor `sem_dono`). A pergunta nova passa a
  perguntar o **motivo** da perda, e o motivo escolhe o caminho. Mantém a árvore e as 4 dores
  do genérico de pé, e fica mais assertiva.
- **Nos nichos a troca é limpa:** uma pergunta sai, uma entra, as outras 5 não mudam, as 6
  dores continuam cobertas.
- `quiz-dados.js` é compartilhado pelas duas páginas que recebem anúncio, sem staging: cada
  mudança vale ao vivo na hora do deploy. Quando ligar o tráfego é decisão do Vitor, adiada.
- Impacto técnico a tratar no plano: `proxima()` do genérico passa a sair da pergunta nova;
  `abordagem.js` troca o mapa `QUEM_RESPONDE` por um `PERDE_CLIENTE`; cabeçalho das abas de
  nicho (texto da pergunta, criado uma vez por `garantirAba`) fica velho nas abas existentes,
  sem quebra de dado; colunas posicionais da mestre não mudam de contagem.

### Método do diagnóstico: 6 movimentos

O texto do diagnóstico segue este arco, montado por regra a partir das respostas. Um destino
só: marcar a call (o diagnóstico substitui a VSL neste momento).

1. **Espelho**: devolve a situação atual em 2 ou 3 frases com o que o lead respondeu. Só cita
   número que ele deu; faixa vazia vira "você não sabe quantos, e esse é o primeiro furo".
2. **Custo**: traduz a dor para a consequência do nicho, sem cifra inventada.
3. **Desejo**: pinta o "depois" concreto, ainda do nicho (conversa com dono, primeira
   resposta na hora, lista de quem sumiu).
4. **Ponte**: o plano de 90 dias, que É adotar a CHAMA. As 3 fases, cada uma amarrada a uma
   dor que o lead marcou.
5. **Evidência**: por que a CHAMA e não força de vontade. API Oficial homologada pela Meta,
   CRM por conversas, robô e agente de IA, campanha em massa, dashboard, garantia de 30 dias,
   com a marca do cliente. Evidência é capacidade real do produto + homologação + garantia,
   **nunca** resultado de cliente (não há depoimento ainda, mesmo bloqueio da home-nova).
6. **Próximo passo**: CTA único para a call, sem preço (o preço é na call). A saída
   "conhecer a plataforma" continua, discreta.

Por nicho: os movimentos 2, 3 e parte do 4 têm parágrafo escrito por nicho (6 + genérico),
no arquivo e estilo do `abordagem.js`. Os movimentos 1, 5 e 6 são quase iguais entre nichos,
variam só o vocabulário. Nicho novo custa 2 ou 3 parágrafos, não reprogramar.

Barra de qualidade: cada frase ou é fato que o lead deu, ou é capacidade real da CHAMA. Fala
a língua do nicho. O plano é nomeado como resultado ("conversa com dono"), não como feature
("módulo de CRM"). Termina em uma ação só. Cabe em uma tela mais o PDF.

### Motor: por regra, isolado para virar IA depois

Todo o texto derivado (espelho, custo, desejo, plano, objetivo, meta, pontos fortes) sai do
módulo novo `plano.js`, regra pura, custo zero, sem função nova na Vercel, nunca afirma
número que o lead não deu. A função de montagem (`montarPlano`) fica isolada para, no futuro,
virar chamada à Claude API (o W3 do programa do funil) sem mexer no renderizador, na rota nem
no front.

### O documento (`#tela-diagnostico` em `diagnostico.html`)

Layout na tela. O conteúdo de cada seção segue os 6 movimentos acima; a lista abaixo é a
ordem visual. Substitui o conteúdo entre `#diag-lista` e `.fechamento`. Seções:

1. **Cabeçalho**: nome, profissão, data, código do diagnóstico.
2. **O que identificamos**: 2 a 3 frases da situação atual do atendimento, montadas das
   respostas (quem responde o WhatsApp, tempo de resposta, faixa de perdas por semana,
   ferramenta atual).
3. **Pontos fortes**: só os que dispararem. Regras: respondeu rápido → "você responde
   rápido, isso já te separa da maioria"; `quemResponde = equipe` → "você já tem gente no
   atendimento"; `ferramenta` diferente de nenhuma → "você já usa uma ferramenta, a base
   existe". Se nenhum disparar, a seção não aparece.
4. **Onde vaza cliente**: os vazamentos que `calcularDiagnostico()` já produz
   (`quiz.js:192-205`), com o parágrafo de dor por nicho (mesma fonte de texto do
   `abordagem.js`).
5. **Objetivo**: derivado da profissão + as duas dores que mais pesam. Uma a duas frases.
   Ex.: "Parar de perder {plural} por demora na primeira resposta e por não ter lista de
   quem não fechou, e ter como medir isso."
6. **Plano de 90 dias com a CHAMA**: 3 fases fixas. Cada fase lista quais dores do lead ela
   fecha (personalização por inclusão, não por reescrever o texto da fase).
   - **Dias 1 a 30, Centralizar**: todo o WhatsApp num painel, cada conversa vira card com
     dono e etapa. Fecha dores de conversa sem dono, atropelo, esquecimento.
   - **Dias 31 a 60, Automatizar**: robô de primeira resposta e triagem; lista de quem pediu
     e não fechou. Fecha dores de demora, orçamento parado, sem retomada.
   - **Dias 61 a 90, Reativar e medir**: campanha para quem parou no meio; dashboard com o
     número que hoje é cego. Fecha dores de cegueira, base fria, sem origem.
   - O mapa `dor -> fase` cobre todas as dores de todos os nichos. Dor sem fase quebra o
     teste (mesmo desenho do "toda dor tem gancho" do `abordagem.js`).
7. **Meta dos 90 dias**: usa `FAIXAS[respostas.quantos]`. Com faixa: "Em 90 dias, recuperar
   parte das {faixa} que hoje te procuram e não fecham, com o atendimento rodando sem você
   ser o gargalo." Sem faixa (lead respondeu que não sabe): "Em 90 dias, ter o número de
   quantos {plural} escapam por semana e uma rotina que não depende de você lembrar." Nunca
   uma porcentagem inventada.
8. **Fechamento**: já existe (`.fechamento`), com garantia de 30 dias e a saída para `/`.

### Módulos novos

- **`plano.js`**: regra pura, no padrão do `abordagem.js`. Custo zero, nenhuma função nova na
  Vercel, nunca afirma número que o lead não deu. Contém: mapa `dor -> fase`, textos das 3
  fases, regras de "ponto forte", regra de "objetivo", regra de "meta 90 dias". Exporta uma
  função que recebe `{ respostas, rotulos, nicho, nome, codigo }` e devolve um objeto com as
  seções já resolvidas (strings e listas), pronto para o renderizador.
- **`relatorio.js`**: renderizador único do documento a partir do objeto que o `plano.js`
  devolve. Produz DOM. Usado pelo `quiz.js` (na página) e pelo `relatorio.html` (standalone).
  Um renderizador só, para as duas telas não divergirem (a armadilha que já pegou o quiz nas
  duas páginas em 03/09).

### PDF: o atendente devolve

- **Página nova `relatorio.html`**, servida em `/relatorio` (arquivo na raiz, `cleanUrls` já
  resolve). `<meta name="robots" content="noindex, nofollow">`. Sem GA4, Pixel ou Clarity: é
  página utilitária aberta pelo atendente e pelo lead, não conta como visita. Head mínimo com
  favicon (`assets/icone-chama360.png`) e `charset`/`viewport`.
- Lê os dados do lead do fragmento da URL: `/relatorio#d=<base64url(JSON)>`. O JSON carrega o
  mínimo para re-derivar: `{ profissao, respostas, rotulos, nome, codigo }`. **Não** carrega
  WhatsApp. `relatorio.html` decodifica, chama `plano.js` + `relatorio.js`, renderiza o mesmo
  documento com layout de impressão e um botão "Salvar em PDF" que chama `window.print()`.
- `@media print` no `relatorio.html`: esconde o botão, ajusta margens, força quebra entre
  seções grandes. Sem biblioteca de PDF.
  `ponytail: window.print() + @media print; trocar por html2pdf (cdnjs) só se a saída ficar
  feia no mobile.`
- O botão "Baixar PDF" na tela do `/diagnostico` abre `/relatorio#d=<...>` em nova aba. O
  link é montado no cliente pelo `quiz.js`, que já tem `estado.respostas` e `estado.rotulos`.

### Aba nova na planilha: `Diagnósticos`

Terceira escrita no `api/quiz.js`, depois da mestre e da aba de nicho. Em try/catch: se
falhar, o lead já está na mestre, a requisição não cai. Aba auto-criada no padrão do
`garantirAba`.

Colunas (cabeçalho na criação):

| Col | Conteúdo |
|---|---|
| A | Data e hora (ISO) |
| B | Nome |
| C | WhatsApp (com aspa simples, como na mestre) |
| D | Código |
| E | Profissão (label) |
| F | Mensagem pronta (`montarAbordagem(corpo)`, mesma da coluna AA; passa por `protegerFormula`) |
| G | Link do relatório (`https://chama360.com.br/relatorio#d=<base64url>`) |

O `api/quiz.js` monta o `#d=` a partir de `corpo` (`profissao` dentro de `respostas`,
`rotulos`, `nome`, `codigo`). O nicho não vai no payload: é função pura de `profissao`
(`resolverQuiz`), então `plano.js` e `relatorio.js` re-derivam. Base do domínio fixa em
produção (`https://chama360.com.br`); em ambiente local a função pode usar caminho relativo,
mas o valor gravado na planilha é sempre o de produção.

O atendente que recebe a mensagem do lead: filtra a aba `Diagnósticos` pelo código, copia a
mensagem pronta da coluna F, abre o link da coluna G, salva o PDF, e devolve os dois no
WhatsApp.

### Mensagem do WhatsApp (`?text=` em `quiz.js:255-257`)

Passa a levar o diagnóstico em texto, montado pelo `plano.js` no mesmo formato do documento:
título, objetivo, lista curta dos vazamentos, meta dos 90 dias, link do relatório
(`/relatorio#d=...`), código.

Trava de tamanho: se `encodeURIComponent(msg).length` passar de 1400, cai numa versão curta
(título + objetivo + meta + link + código). O documento completo está sempre na tela e no
`/relatorio`.

### Subhead do `/diagnostico`

`diagnostico.html:177`, hoje:

> Sete perguntas rápidas. No fim você vê onde o seu negócio está perdendo gente no WhatsApp,
> e o que dá pra fazer com isso.

Nova (primária):

> Sete perguntas rápidas. No fim, um diagnóstico personalizado do seu atendimento: onde vaza
> cliente, um plano de 90 dias pra resolver, e um documento que é seu pra guardar.

Alternativa mais curta:

> Sete perguntas rápidas. No fim, seu diagnóstico personalizado: onde vaza cliente e o plano
> de 90 dias pra resolver, num documento pra você guardar.

Gate: Vitor escolhe a redação antes de publicar.

### Testes (`test-quiz.mjs`, hoje 73 checagens)

- Toda dor de todo nicho tem fase atribuída em `plano.js`. Varre `todasAsDores()`, praça nova
  quebra a suíte.
- `relatorio.js` a partir do payload empacotado re-deriva o mesmo diagnóstico que o `quiz.js`
  mostra na tela (ida e volta: montar `#d=`, decodificar, comparar seções).
- Nenhuma fase nem a meta afirmam número quando `respostas.quantos` é a opção de "não sei".
- A mensagem do WhatsApp nunca passa de 1400 caracteres codificados; a versão curta cabe.
- Guard de travessão (item 2) cobre `plano.js`.
- `verificar-visual.mjs` ganha o percurso até o documento na tela e uma checagem do
  `/relatorio` renderizando a partir de um `#d=` de exemplo.

### Checklist de páginas (`~/.claude/PAGINAS.md`) para `/relatorio`

- Favicon: sim, `assets/icone-chama360.png`.
- Meta tags: `charset`, `viewport`, `title`, `robots: noindex, nofollow`. Sem Open Graph
  (página privada por lead, não circula como link público).
- Schema markup: não se aplica (documento privado).
- Sitemap: não entra. `robots.txt` já cobre; conferir que não há regra que force indexação.
- `llms.txt`: não se aplica.
- GA4 / Search Console / Clarity: fora de propósito nesta página.
- Imagens: só o logo, já em WebP.

### Checklist de segurança (`~/.claude/SECURITY.md`)

- Sem chave nova no front. `relatorio.html` é estático, `api/quiz.js` já guarda a credencial
  no servidor.
- Sem Supabase.
- Validação no servidor: `api/quiz.js` já valida nome e WhatsApp; a aba nova não muda
  entrada, só saída.
- `.env`: sem variável nova.
- Rate limit: `api/quiz.js` já tem `permitir(ip)`. `/relatorio` é estático, sem rota nova
  exposta.
- Dados no fragmento `#d=`: primeiro nome + profissão + respostas do quiz. Sem CPF, sem
  telefone, sem token. Fragmento não vai para log de servidor. Aceitável.
- Injeção de fórmula no Sheets: a coluna F usa `protegerFormula` (já existe); a coluna G é
  URL montada pelo servidor, não entrada do usuário.
- Auditoria de dependências: nenhuma dependência nova (`window.print()` em vez de lib de
  PDF). Rodar `npm audit` mesmo assim antes do deploy.

## Fora de escopo (ponytail)

- Bot que responde sozinho no WhatsApp. Projeto à parte, já descartado.
- PDF gerado no servidor. `window.print()` resolve, sem função nova nem teto da Vercel.
- Diagnóstico por IA agora. `montarPlano` fica isolado para virar IA depois (W3).
- Trocar a fonte de `/diagnostico`, `/home-nova`, `privacidade`, `termos`.
- Travessões de `home-nova.html`.

## Depende do Vitor (gate antes de publicar)

- **Redação final das perguntas do quiz**: o documento de reformulação (v2) já está aprovado
  no desenho; falta o Vitor passar o olho nas palavras das perguntas e respostas.
- **Redação dos 4 nichos restantes** (Dentista, Corretor de Seguros, Veterinário, Oficina),
  que saem depois que a redação do genérico, Personal e Corretor estiver fechada.
- Texto dos 6 movimentos do diagnóstico por nicho (mando pra revisar, como foi com W1 e W8).
- Redação final da subhead do `/diagnostico` (primária ou alternativa curta, ambas na spec).
- `Bebas Neue` nos números da home: manter ou cortar. Item de baixa prioridade.
- Quando ligar o tráfego pago para o `/diagnostico`. Decisão adiada por ele em 08/09.

## Prioridade e ordem de entrega

O Vitor pediu em 08/09: **o diagnóstico vem primeiro.** A fonte da home e os travessões são
o fim da fila, e podem sair numa leva separada depois.

1. **Quiz reformulado** (`quiz-dados.js`): a pergunta de perda entra, `quemResponde` sai,
   `abordagem.js` acompanha. Depende só da redação final.
2. **Motor do diagnóstico** (`plano.js`): os 6 movimentos por regra, texto por nicho. Gate do
   Vitor no texto.
3. **Documento na tela** (`diagnostico.html` + `relatorio.js`): substitui o bloco da VSL.
4. **PDF e aba na planilha** (`relatorio.html` + terceira escrita no `api/quiz.js`).
5. **Item 1 (fonte da home) e item 2 (travessões)**: leva separada, depois.

## Arquivos tocados

- `index.html` (fonte, travessões)
- `diagnostico.html` (subhead, documento no `#tela-diagnostico`)
- `quiz.js` (montar `#d=`, chamar `relatorio.js`, `?text=` novo)
- `quiz-dados.js` (`quemResponde` sai, pergunta de perda entra no genérico e nos 6 nichos;
  roteamento do genérico passa a sair da pergunta nova; `FAIXAS` intacto; 1 travessão)
- `abordagem.js` (mapa `QUEM_RESPONDE` vira `PERDE_CLIENTE`; export reaproveitado por
  `plano.js`)
- `api/quiz.js` (terceira escrita: aba `Diagnósticos`, montar link; conferir `montarLinha`
  posicional e `cabecalhoNicho` contra o quiz novo)
- `plano.js` (novo: os 6 movimentos por regra, `montarPlano` isolado)
- `relatorio.js` (novo: renderizador único)
- `relatorio.html` (novo: página `/relatorio`, `noindex`, botão salvar PDF)
- `test-quiz.mjs` (guards novos: árvore nova, no máximo 3 opções por pergunta, dor com fase,
  ida e volta do `#d=`, limite do `?text=`, travessão em `plano.js`)
- `verificar-visual.mjs` (percurso novo até o documento e o `/relatorio`)
