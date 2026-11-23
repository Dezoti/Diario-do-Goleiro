# Diário do Goleiro

App para celular que registra os resultados dos jogos de goleiro. Você sobe o print da convocação
(do app Goleiro de Aluguel) e o app preenche sozinho **data, horário, quadra, tipo de campo e nota**.
Depois é só informar placar, gols e defesas.

Não tem servidor, conta nem banco de dados: é HTML, CSS e JavaScript puros, e os jogos ficam salvos
no próprio aparelho.

## O que faz

- **Painel** com vitórias, empates, derrotas, nota média (de 30), defesas, gols sofridos e marcados.
- **Lista de jogos** com filtro por resultado e por jogos pendentes.
- **Novo jogo** com leitura de print, placar, resultado automático, contadores de gols e defesas, nota e observações.
- **Importar vários prints** de uma vez: cada print vira um jogo pendente para completar depois.
- **Sem jogo repetido:** o app barra um jogo com a mesma data e o mesmo horário de outro já cadastrado.
- **Backup** em JSON (exportar e importar) e **planilha CSV**.
- Funciona offline depois da primeira abertura e pode ser instalado na tela inicial (PWA), com guia de instalação dentro do app (Android e iPhone) e botão para compartilhar o link.

## Rodar no computador

```bash
npm start        # ou: python3 -m http.server 8080
```

Abra http://localhost:8080.

## Publicar (GitHub Pages)

1. No repositório, vá em **Settings → Pages**.
2. Em **Build and deployment**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`.
3. Abra o endereço que o GitHub mostrar no celular e use **Adicionar à tela inicial**.

## Como a leitura de print funciona

A leitura é feita no próprio aparelho com [Tesseract.js](https://github.com/naptha/tesseract.js) (OCR).
O app converte o print (escuro) para cinza e inverte as cores antes de ler, e `parser.js` extrai os campos do texto.
A biblioteca e o idioma português são baixados de um CDN na primeira leitura, então esse primeiro uso precisa de internet.
Nenhuma imagem sai do aparelho.

O OCR pode errar. Por isso, depois de ler, o app mostra os campos preenchidos para você conferir.

## Onde ficam os dados

No `localStorage` do navegador do aparelho. Limpar os dados do site apaga os jogos, e um aparelho não enxerga
os jogos de outro. Use **Dados → Exportar backup** de vez em quando.

## Testes

```bash
npm test
```

Cobre o `parser.js` (com saídas reais de OCR de prints do app) e o `games.js`.

## Estrutura

```
index.html   telas e formulário
styles.css   visual
app.js       lógica do app, OCR e backup
parser.js    extrai os campos do texto lido do print
games.js     regras da lista de jogos (jogo duplicado)
sw.js        funcionamento offline
manifest.webmanifest, icons/   instalação como app
test/        testes do parser
```
