# Roadmap

Backlog do Diário do Goleiro. Cada item tem uma regra clara do que significa "pronto". Ordem sugerida: 1 → 2 → 3 → 4 (a marca pode andar em paralelo).

Legenda de tamanho: **P** (uma sessão), **M** (algumas sessões), **G** (várias etapas).

## Já feito

- [x] Registro de jogos com painel, lista, filtros e formulário
- [x] Leitura de print do Goleiro de Aluguel (OCR no aparelho)
- [x] Importação de vários prints
- [x] Backup em JSON e exportação em CSV
- [x] Instalação como app (PWA) com guia dentro do app e botão de compartilhar
- [x] Hospedagem no GitHub Pages

## 1. Barrar jogo já cadastrado — P

**Regra:** um jogo é duplicado quando já existe outro com a **mesma data (dia, mês e ano) e o mesmo horário**.

Pronto quando:
- [ ] Ao salvar um jogo novo, se for duplicado, o app não salva e mostra a mensagem "Já existe um jogo em 17/11/2026 às 18:00 (ARENA P10)", com um botão para abrir o jogo existente.
- [ ] Ao editar, o jogo não conta contra si mesmo. Mudar a data ou o horário para os de outro jogo também é barrado.
- [ ] Na importação de vários prints, os duplicados são pulados e contados no aviso final. Hoje a comparação inclui a quadra; passa a ser só data e horário.
- [ ] Na importação de backup, jogos duplicados (com `id` diferente) são pulados e contados.
- [ ] A regra fica em uma função pura (`findDuplicate`) com testes em `test/`.

Pergunta em aberto: se o horário estiver vazio, o jogo bloqueia outro do mesmo dia sem horário? Sugestão: **não**, porque sem horário não dá para afirmar que é o mesmo jogo.

## 2. Foto no jogo — M

Pronto quando:
- [ ] O formulário tem o botão "Adicionar foto", que abre a câmera ou a galeria.
- [ ] A foto é reduzida antes de salvar (lado maior de 1600 px, JPEG com qualidade em torno de 0,82) para não estourar o armazenamento.
- [ ] A foto aparece como miniatura no cartão do jogo e em tamanho maior ao tocar. Dá para trocar e remover.
- [ ] Jogos antigos, sem foto, continuam funcionando.

Decisões técnicas:
- O `localStorage` tem limite de cerca de 5 MB, então as fotos vão para o **IndexedDB**. O jogo guarda só uma referência (`photoId`).
- **Backup:** fotos em base64 deixam o JSON enorme. Sugestão: o backup padrão não inclui fotos, e há uma opção "incluir fotos". Decidir na hora de fazer.
- Uma foto por jogo (a "foto do dia"). Perguntar se vale permitir várias.

## 3. Imagem para Instagram — G

Depende do item 2 (foto) e dos logotipos (item 4 e arquivos dos logos).

Pronto quando:
- [ ] Na tela de um jogo há dois botões: **Gerar story** (1080 × 1920, 9:16) e **Gerar feed** (1080 × 1350, 4:5).
- [ ] A imagem traz a **foto do dia**, o **placar**, o **nome da quadra** e os **logotipos do Goleiro de Aluguel e do Diário do Goleiro**.
- [ ] Há uma pré-visualização antes de salvar.
- [ ] O botão compartilhar usa o menu do celular (`navigator.share` com arquivo), com download como alternativa.
- [ ] Sem foto, a imagem usa um fundo padrão da marca.

Decisões técnicas:
- Desenho em `<canvas>` e exportação em PNG. Sem servidor.
- Texto sobre a foto com degradê escuro para manter a leitura.
- No story, deixar livres as faixas do topo e do rodapé (as áreas cobertas pela interface do Instagram).
- Fonte embutida no projeto, para a imagem sair igual em qualquer aparelho.

Perguntas em aberto:
- A imagem mostra mais algum dado (data, resultado "VITÓRIA", defesas, nota)?
- Onde ficam os logotipos? Opção A: arquivos em `assets/` no repositório. Opção B: o usuário carrega nas configurações do app e ficam só no aparelho. Como o repositório é público e o logo do Goleiro de Aluguel é de terceiros, confirmar se publicar esse arquivo é adequado.

## 4. Logotipo e marca — M

Pronto quando:
- [ ] Uma direção de logotipo é escolhida entre as ideias de `docs/marca.md`.
- [ ] Logo em SVG (versão colorida e versão de uma cor) e ícone do app (192, 512 e maskable) atualizados.
- [ ] Paleta e tipografia registradas em `docs/marca.md`.

## Ideias para depois

- Conta e sincronização na nuvem (adiada: exigiria servidor e banco, e traz responsabilidades de privacidade).
