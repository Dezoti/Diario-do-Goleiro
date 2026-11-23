# CLAUDE.md

Contexto técnico para quem for mexer neste projeto (pessoas ou o Claude).

## O que é

Diário do Goleiro: PWA estático que registra jogos de goleiro. O usuário sobe o print da convocação do app Goleiro de Aluguel, o app lê a imagem (OCR no navegador) e preenche data, horário, quadra, tipo de campo e nota. Todo o resto o usuário digita. Também guarda fotos dos jogos, mostra estatísticas e gera imagens para o Instagram (jogo e resumo do mês ou ano).

## Regras do projeto

- **Sem servidor e sem build.** HTML, CSS e JavaScript puros, abertos direto pelo navegador. Não adicionar framework, bundler ou serviço pago sem perguntar.
- **Dados só no aparelho.** Os jogos ficam no `localStorage` (chave `diario-goleiro:v1`) e as fotos no IndexedDB (`diario-goleiro-fotos`; o jogo guarda só os ids em `photoIds`). Qualquer dado novo precisa dizer como entra no backup. O backup padrão **não inclui fotos**; há a opção "com fotos".
- **Idioma:** textos da interface, mensagens, commits e documentação em português do Brasil.
- **Nome do repositório sem acento** (limite do GitHub); o nome do app na tela é "Diário do Goleiro".
- Os campos de um jogo e o que cada um significa estão em `README.md` e no `parser.js`. O campo "Time" foi removido de propósito: não reintroduzir.
- **Quadra:** guardar só o nome, sem endereço. **Nota:** vai de 0 a 30.
- **Jogo duplicado:** mesma data e mesmo horário. Sem horário, não bloqueia nem é bloqueado.
- **Imagens do Instagram:** o resultado (vitória, empate, derrota) segue o placar. Na imagem entram só foto(s), placar, quadra, resultado e os dois logos. Story tem 250 px de margem em cima e embaixo. Mudança visual: mostrar prévia e esperar aprovação antes de entregar.
- Médias das estatísticas consideram só os jogos em que o dado foi preenchido.

## Estrutura

```
index.html    telas, formulário, estatísticas, folha de imagens, guia de instalação
styles.css    visual (tema escuro, destaque verde #22d35a)
app.js        lógica da tela, OCR, backup, instalação e compartilhamento
parser.js     extrai os campos do texto lido do print (também roda no Node)
games.js      regras da lista: jogo duplicado, quadras (sugestões e nome único) (também roda no Node)
photos.js     fotos no IndexedDB: redução e miniaturas
stats.js      cálculos das estatísticas (também roda no Node)
share-image.js desenho das imagens do Instagram em canvas (partes puras rodam no Node)
sw.js         offline: rede primeiro, cache como reserva (subir a versão do cache ao mudar arquivos e incluir arquivos novos na lista)
manifest.webmanifest, icons/   instalação como app (ícones gerados por scripts/gerar-icones.py)
assets/       logos (assets/logos) e fontes (assets/fonts: Oswald e Permanent Marker)
test/         testes (node:test): parser, games, photos, stats, share-image
docs/         documentos de apoio (marca, quadro no GitHub)
scripts/      criar-quadro.sh (labels, issues e quadro) e gerar-icones.py
.github/      modelos de issue
ROADMAP.md    backlog e ordem de trabalho
```

## Comandos

```bash
npm start   # servidor local em http://localhost:8080
npm test    # testes do parser, das regras de jogos, das fotos, das estatísticas e da imagem
```

## Cuidados ao mexer

- O print do Goleiro de Aluguel é escuro. O app converte para cinza e inverte antes do OCR. O OCR erra de formas previsíveis (ícones viram letras, "21:00" vira "2100", "Fut5" vira "Futb"). Ao corrigir o `parser.js`, **adicione o texto real do OCR como caso de teste** em `test/parser.test.js`.
- O print não mostra o ano. O parser deduz pelo dia da semana.
- O Tesseract.js é carregado de um CDN na primeira leitura. Em testes locais dá para imitar o CDN; sem isso, a leitura de print não roda.
- Ao mudar `index.html`, `styles.css` ou `app.js`, suba a versão em `CACHE` no `sw.js` para os aparelhos pegarem a versão nova.
- O endereço publicado depende do nome do repositório (hoje `Diario-do-Goleiro`). Renomear quebra o ícone já instalado. Caminhos no app são relativos.
- As imagens carregam os logos de `assets/logos/` cortando a margem transparente; se um logo faltar, entra o nome em texto.
- Testar no navegador em tela de celular (cerca de 390 px de largura) antes de entregar. Dizer com clareza o que não pôde ser testado (por exemplo, aparelho real, iPhone, câmera, menu nativo de compartilhar).

## Git

O Claude não consegue fazer push nesta configuração. Ele grava os arquivos na pasta do usuário e informa os comandos (`git add`, `git commit`, `git push`) para o usuário rodar.
