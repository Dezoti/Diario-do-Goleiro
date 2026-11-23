# Roadmap

Backlog do Diário do Goleiro. Cada item tem uma regra clara do que significa "pronto". Itens 1 a 4 estão prontos. Ordem sugerida para os novos: 7 → 5 → 6.

Legenda de tamanho: **P** (uma sessão), **M** (algumas sessões), **G** (várias etapas).

## Já feito

- [x] Registro de jogos com painel, lista, filtros e formulário
- [x] Leitura de print do Goleiro de Aluguel (OCR no aparelho)
- [x] Importação de vários prints
- [x] Backup em JSON e exportação em CSV
- [x] Instalação como app (PWA) com guia dentro do app e botão de compartilhar
- [x] Hospedagem no GitHub Pages
- [x] Barrar jogo já cadastrado (mesma data e horário)
- [x] Fotos no jogo (várias por jogo, backup opcional com fotos)
- [x] Imagem para Instagram (story e feed)
- [x] Logotipo e ícones do app

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

## 3. Imagem para Instagram — G ✅ feito (falta colocar os logotipos em `assets/logos/`)

Depende do item 2 (fotos) e dos logotipos (item 4 e arquivos dos logos).

Pronto quando:
- [x] Na tela de um jogo há dois botões: **Gerar story** (1080 × 1920, 9:16) e **Gerar feed** (1080 × 1350, 4:5).
- [x] Antes de gerar, o usuário **escolhe quais fotos do jogo** entram na imagem.
- [x] A imagem traz a(s) **foto(s) escolhida(s)**, o **placar**, o **nome da quadra**, o **resultado** conforme o placar (VITÓRIA) e os **logotipos do Goleiro de Aluguel e do Diário do Goleiro**.
- [x] Nenhum outro dado aparece (sem data, defesas ou nota).
- [x] Há uma pré-visualização antes de salvar.
- [x] O botão compartilhar usa o menu do celular (`navigator.share` com arquivo), com download como alternativa.
- [x] Sem foto, a imagem usa um fundo padrão da marca.

Decisões técnicas:
- Desenho em `<canvas>` e exportação em PNG. Sem servidor.
- Texto sobre a foto com degradê escuro para manter a leitura.
- No story, deixar livres as faixas do topo e do rodapé (as áreas cobertas pela interface do Instagram).
- Fonte embutida no projeto, para a imagem sair igual em qualquer aparelho.
- **Logotipos guardados no repositório**, em `assets/logos/` (PNG ou SVG com fundo transparente). O usuário vai carregar os arquivos.

Para confirmar na hora de fazer: o texto de resultado segue o placar (VITÓRIA, EMPATE ou DERROTA). Se preferir que só vitórias mostrem o selo, é um ajuste pequeno.

## 4. Logotipo e marca — M ✅ feito (luva + caderno)

Pronto quando:
- [x] Uma direção de logotipo é escolhida entre as ideias de `docs/marca.md`.
- [x] Ícone do app (192, 512 e maskable) atualizado a partir do logotipo em PNG. (Versão SVG e de uma cor não foram feitas: o PNG com fundo transparente atende às imagens.)
- [x] Paleta e tipografia registradas em `docs/marca.md`.

## 5. Estatísticas e evolução — M

Pronto quando:
- [ ] Há uma tela de **Estatísticas**, aberta por um botão no topo.
- [ ] Mostra os totais: jogos, vitórias, empates e derrotas, % de vitórias, média de defesas por jogo, média de gols sofridos por jogo e média da nota (de 30).
- [ ] Mostra a **evolução da nota** ao longo do tempo, em gráfico simples.
- [ ] Mostra o **desempenho por quadra**: jogos, vitórias e média da nota, das mais jogadas para as menos.
- [ ] Dá para escolher o período: este mês, este ano ou tudo.
- [ ] Com poucos jogos (menos de 3), mostra um aviso em vez de gráficos vazios.
- [ ] Os cálculos ficam em funções puras, com testes em `test/`.

Decisões técnicas:
- Gráficos desenhados em SVG, sem biblioteca externa.
- Médias consideram só os jogos que têm aquele dado preenchido (jogo sem nota não puxa a média para zero).

Para confirmar na hora de fazer: quais números são os mais importantes para você; se faltar algum, entra na lista.

## 6. Resumo do mês ou ano — M

Depende dos itens 3 (imagem) e 5 (estatísticas).

Pronto quando:
- [ ] Na tela de Estatísticas há o botão **Gerar resumo** para o período escolhido (mês ou ano).
- [ ] A imagem sai em story (1080 × 1920) e em feed (1080 × 1350), com o mesmo estilo e os mesmos logotipos das imagens de jogo.
- [ ] Mostra o nome do período, o número de jogos, vitórias, empates e derrotas, e o total de defesas.
- [ ] Há pré-visualização, compartilhar e baixar, como na imagem de jogo.
- [ ] Reaproveita o desenho de `share-image.js` (sem copiar código).

Para confirmar na hora de fazer: se a nota média e os gols sofridos também entram, e se o resumo pode levar uma foto de fundo.

## 7. Autocompletar quadra — P

Pronto quando:
- [ ] Ao digitar a quadra no formulário, o app sugere as quadras já usadas (as mais frequentes primeiro).
- [ ] Ao escolher uma sugestão, o tipo de campo é preenchido com o da última vez naquela quadra, se estiver vazio.
- [ ] Nomes que mudam só em maiúsculas, acentos ou espaços sobrando contam como a mesma quadra (ex.: "Arena P10" e "ARENA P10 ").
- [ ] A leitura de prints usa o nome já existente quando for igual a uma quadra salva.
- [ ] A regra de comparação fica em função pura, com testes em `test/`.

Decisão técnica: lista de sugestões nativa do navegador (`<datalist>`), sem biblioteca.

## Ideias para depois

- Conta e sincronização na nuvem (adiada: exigiria servidor e banco, e traz responsabilidades de privacidade).
- Jogo agendado: cadastrar o jogo antes de acontecer e preencher o resultado depois.
