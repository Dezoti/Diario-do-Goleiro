# Marca: Diário do Goleiro

Ponto de partida para criar o logotipo. Nada aqui está decidido.

## Hoje

- Nome: **Diário do Goleiro**. Dá para usar "Goleiro" como forma curta (já é o nome do ícone na tela inicial).
- Cores atuais: fundo `#0f1115`, destaque verde `#22d35a`, texto `#f2f4f7`.
- Ícone atual: uma trave com rede e uma bola, desenhada de forma simples. Serve como provisório.

## Direções de logotipo

| Direção | Ideia | Pontos fortes | Cuidado |
| --- | --- | --- | --- |
| **Luva + caderno** | Uma luva de goleiro com a palma virando as páginas de um diário | Conta as duas coisas: goleiro e registro | Muito detalhe some em tamanho pequeno |
| **Trave com placar** | A trave desenhada como moldura, com um número ou placar dentro | Simples, fácil de reconhecer no ícone | Parecida com muitos apps de futebol |
| **Camisa 1** | O número 1 (camisa de goleiro) em destaque, com o verde da marca | Forte e legível, funciona como selo no story | Menos ligado à ideia de "diário" |
| **Monograma DG** | As letras D e G unidas, com a curva do G lembrando uma bola ou uma luva | Elegante, funciona bem sozinho em foto | Precisa de bom desenho para não parecer genérico |
| **Defesa em movimento** | Silhueta de um goleiro em voo, em traço contínuo | Passa emoção e energia | Silhuetas complexas ficam pesadas em ícone pequeno |
| **Etiqueta / carimbo** | Selo redondo com "Diário do Goleiro" em volta e uma luva no centro | Combina com imagens de Instagram (assinatura no canto) | Texto fica ilegível em tamanho pequeno |

## O que o logo precisa fazer

- Ficar legível em **48 px** (ícone do app) e também grande no canto de uma imagem de story.
- Ter versão **de uma cor** (branco sobre foto) e versão **colorida**.
- Convivir com o logotipo do Goleiro de Aluguel na mesma imagem, sem competir com ele.
- Funcionar em SVG, para ser desenhado em `<canvas>` na geração das imagens.

## Próximos passos sugeridos

1. Escolher **duas** direções da tabela.
2. Gerar esboços em SVG das duas e comparar em tamanho pequeno e sobre uma foto.
3. Refinar a escolhida e atualizar `icons/`.

## Cuidados

- Não copiar o logotipo, a luva ou o estilo de marcas existentes. Original e simples vence.
- Se for usar uma fonte, conferir a licença (preferir fontes livres).

## Decisão

Escolhida a direção **luva + caderno**, no estilo do logotipo ilustrado do próprio usuário: `assets/logos/diario-do-goleiro.png` (luva escrevendo no caderno, contorno preto, creme e verde neon). Esse arquivo é o logotipo oficial.

- Os ícones do app (`icons/`) saem dele, sobre o fundo escuro do app: `python3 scripts/gerar-icones.py`.
- A imagem do Instagram usa o PNG direto, cortando a margem transparente (`share-image.js`).
- Os esboços em SVG que vieram antes foram descartados.

## Paleta e tipografia

- Fundo do app e dos ícones: `#0f1115`. Destaque verde: `#22d35a`. Texto: `#f2f4f7`.
- Resultado nas imagens do Instagram: vitória `#3ddc84`, empate `#ffc233`, derrota `#ff5d5d`.
- Imagens do Instagram: fonte **Oswald** (700 e 500), licença livre (OFL), guardada em `assets/fonts/`.
