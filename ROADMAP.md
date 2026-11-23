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
- [x] Barrar jogo já cadastrado (mesma data e horário)

## 1. Barrar jogo já cadastrado — P (feito)

**Regra:** um jogo é duplicado quando já existe outro com a **mesma data (dia, mês e ano) e o mesmo horário**.

Pronto quando:
- [x] Ao salvar um jogo novo, se for duplicado, o app não salva e mostra a mensagem "Já existe um jogo em 17/11/2026 às 18:00 (ARENA P10)", com um botão para abrir o jogo existente.
- [x] Ao editar, o jogo não conta contra si mesmo. Mudar a data ou o horário para os de outro jogo também é barrado.
- [x] Na importação de vários prints, os duplicados são pulados e contados no aviso final. Hoje a comparação inclui a quadra; passa a ser só data e horário.
- [x] Na importação de backup, jogos duplicados (com `id` diferente) são pulados e contados.
- [x] A regra fica em uma função pura (`findDuplicate`) com testes em `test/`.

**Decidido:** o jogo normalmente sempre terá horário. Se o horário estiver vazio, o jogo **não bloqueia** nem é bloqueado, porque sem horário não dá para afirmar que é o mesmo jogo.

## 2. Fotos no jogo — M ✅ feito

Pronto quando:
- [x] O formulário tem o botão "Adicionar fotos", que abre a câmera ou a galeria e aceita **várias fotos** por jogo.
- [x] Cada foto é reduzida antes de salvar (lado maior de 1600 px, JPEG com qualidade em torno de 0,82) para não estourar o armazenamento.
- [x] As fotos aparecem como miniaturas no formulário e no cartão do jogo (a primeira como capa). Tocar abre em tamanho maior. Dá para remover e reordenar.
- [x] Jogos antigos, sem foto, continuam funcionando.
- [x] O backup tem a opção **"incluir fotos"**. O padrão é exportar **sem** fotos; ao importar, jogos continuam com as fotos que já têm neste aparelho.

Decisões técnicas:
- O `localStorage` tem limite de cerca de 5 MB, então as fotos vão para o **IndexedDB**. O jogo guarda só as referências (`photoIds`, uma lista).
- Backup com fotos usa base64 dentro do JSON, o que deixa o arquivo grande. Por isso a opção é manual.
- É no item 3 que o usuário escolhe quais fotos entram em cada imagem.

## 3. Imagem para Instagram — G

Depende do item 2 (fotos) e dos logotipos (item 4 e arquivos dos logos).

Pronto quando:
- [ ] Na tela de um jogo há dois botões: **Gerar story** (1080 × 1920, 9:16) e **Gerar feed** (1080 × 1350, 4:5).
- [ ] Antes de gerar, o usuário **escolhe quais fotos do jogo** entram na imagem.
- [ ] A imagem traz a(s) **foto(s) escolhida(s)**, o **placar**, o **nome da quadra**, o **resultado** conforme o placar (VITÓRIA) e os **logotipos do Goleiro de Aluguel e do Diário do Goleiro**.
- [ ] Nenhum outro dado aparece (sem data, defesas ou nota).
- [ ] Há uma pré-visualização antes de salvar.
- [ ] O botão compartilhar usa o menu do celular (`navigator.share` com arquivo), com download como alternativa.
- [ ] Sem foto, a imagem usa um fundo padrão da marca.

Decisões técnicas:
- Desenho em `<canvas>` e exportação em PNG. Sem servidor.
- Texto sobre a foto com degradê escuro para manter a leitura.
- No story, deixar livres as faixas do topo e do rodapé (as áreas cobertas pela interface do Instagram).
- Fonte embutida no projeto, para a imagem sair igual em qualquer aparelho.
- **Logotipos guardados no repositório**, em `assets/logos/` (PNG ou SVG com fundo transparente). O usuário vai carregar os arquivos.

Para confirmar na hora de fazer: o texto de resultado segue o placar (VITÓRIA, EMPATE ou DERROTA). Se preferir que só vitórias mostrem o selo, é um ajuste pequeno.

## 4. Logotipo e marca — M

Pronto quando:
- [ ] Uma direção de logotipo é escolhida entre as ideias de `docs/marca.md`.
- [ ] Logo em SVG (versão colorida e versão de uma cor) e ícone do app (192, 512 e maskable) atualizados.
- [ ] Paleta e tipografia registradas em `docs/marca.md`.

## Ideias para depois

- Conta e sincronização na nuvem (adiada: exigiria servidor e banco, e traz responsabilidades de privacidade).
