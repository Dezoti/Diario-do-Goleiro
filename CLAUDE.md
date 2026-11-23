# CLAUDE.md

Contexto técnico para quem for mexer neste projeto (pessoas ou o Claude).

## O que é

Diário do Goleiro: PWA estático que registra jogos de goleiro. O usuário sobe o print da convocação do app Goleiro de Aluguel, o app lê a imagem (OCR no navegador) e preenche data, horário, quadra, tipo de campo e nota. Todo o resto o usuário digita.

## Regras do projeto

- **Sem servidor e sem build.** HTML, CSS e JavaScript puros, abertos direto pelo navegador. Não adicionar framework, bundler ou serviço pago sem perguntar.
- **Dados só no aparelho.** Os jogos ficam no `localStorage` (chave `diario-goleiro:v1`). Qualquer dado novo precisa dizer como entra no backup.
- **Idioma:** textos da interface, mensagens, commits e documentação em português do Brasil.
- **Nome do repositório sem acento** (limite do GitHub); o nome do app na tela é "Diário do Goleiro".
- Os campos de um jogo e o que cada um significa estão em `README.md` e no `parser.js`. O campo "Time" foi removido de propósito: não reintroduzir.
- **Quadra:** guardar só o nome, sem endereço. **Nota:** vai de 0 a 30.

## Estrutura

```
index.html    telas, formulário, guia de instalação
styles.css    visual (tema escuro, destaque verde #22d35a)
app.js        lógica do app, OCR, backup, instalação e compartilhamento
parser.js     extrai os campos do texto lido do print (também roda no Node)
sw.js         offline: rede primeiro, cache como reserva (subir a versão do cache ao mudar arquivos)
manifest.webmanifest, icons/   instalação como app
test/         testes do parser (node:test)
docs/         documentos de apoio (marca)
ROADMAP.md    backlog e ordem de trabalho
```

## Comandos

```bash
npm start   # servidor local em http://localhost:8080
npm test    # testes do parser
```

## Cuidados ao mexer

- O print do Goleiro de Aluguel é escuro. O app converte para cinza e inverte antes do OCR. O OCR erra de formas previsíveis (ícones viram letras, "21:00" vira "2100", "Fut5" vira "Futb"). Ao corrigir o `parser.js`, **adicione o texto real do OCR como caso de teste** em `test/parser.test.js`.
- O print não mostra o ano. O parser deduz pelo dia da semana.
- O Tesseract.js é carregado de um CDN na primeira leitura. Em testes locais dá para imitar o CDN; sem isso, a leitura de print não roda.
- Ao mudar `index.html`, `styles.css` ou `app.js`, suba a versão em `CACHE` no `sw.js` para os aparelhos pegarem a versão nova.
- O endereço publicado depende do nome do repositório. Renomear o repositório quebra o ícone já instalado.
- Testar no navegador em tela de celular (cerca de 390 px de largura) antes de entregar. Dizer com clareza o que não pôde ser testado (por exemplo, aparelho real, iPhone, menu nativo de compartilhar).

## Git

O Claude não consegue fazer push nesta configuração. Ele grava os arquivos na pasta do usuário e informa os comandos (`git add`, `git commit`, `git push`) para o usuário rodar.
