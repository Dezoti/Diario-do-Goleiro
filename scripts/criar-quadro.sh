#!/usr/bin/env bash
# Cria as labels, as issues do ROADMAP e um quadro (GitHub Project) com elas.
# Rode UMA vez, dentro da pasta do repositório, no seu computador:
#   gh auth login                      # se ainda não estiver logado
#   gh auth refresh -s project         # permite criar o quadro
#   bash scripts/criar-quadro.sh
# Para só ver o que seria feito, sem criar nada:  DRY_RUN=1 bash scripts/criar-quadro.sh
set -euo pipefail

DRY="${DRY_RUN:-}"
REPO="${REPO:-$(git remote get-url origin | sed -E 's#^.*github\.com[:/]##; s#\.git$##')}"
OWNER="${REPO%%/*}"
echo "Repositório: $REPO"

URLS=()

label() { # nome cor descrição
  if [ -n "$DRY" ]; then echo "[simulação] label: $1"; return; fi
  gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null
}

issue() { # título labels [fechada] (corpo vem da entrada padrão); "fechada" fecha a issue (item já feito)
  local body url
  body="$(cat)"
  if [ -n "$DRY" ]; then
    echo "[simulação] issue: $1  [$2] ${3:+(já feita: será fechada)}"
    URLS+=("https://github.com/$REPO/issues/0")
    return
  fi
  url="$(gh issue create --repo "$REPO" --title "$1" --label "$2" --body "$body")"
  echo "Criada: $url"
  if [ "${3:-}" = "fechada" ]; then gh issue close "$url" --repo "$REPO" --reason completed >/dev/null; echo "  (fechada: já está pronta)"; fi
  URLS+=("$url")
}

label ideia       a2eeef "Ideia nova"
label melhoria    22d35a "Melhoria do app"
label marca       f5b83d "Logotipo e identidade visual"
label teste       c5def5 "Testes em aparelho real"
label problema    ff5d5d "Algo não funciona"
label tamanho-P   ededed "Uma sessão de trabalho"
label tamanho-M   d4c5f9 "Algumas sessões"
label tamanho-G   b60205 "Várias etapas"

issue "Barrar jogo já cadastrado" "melhoria,tamanho-P" "fechada" <<'BODY'
**Regra:** um jogo é duplicado quando já existe outro com a mesma data (dia, mês e ano) e o mesmo horário. Se o horário estiver vazio, não bloqueia.

- [ ] Ao salvar um jogo novo duplicado, o app não salva e mostra "Já existe um jogo em 17/11/2026 às 18:00 (ARENA P10)", com botão para abrir o existente
- [ ] Ao editar, o jogo não conta contra si mesmo; mudar data ou horário para os de outro jogo também é barrado
- [ ] Na importação de vários prints, duplicados são pulados e contados no aviso (comparar só data e horário, sem a quadra)
- [ ] Na importação de backup, duplicados com `id` diferente são pulados e contados
- [ ] Regra em função pura (`findDuplicate`) com testes em `test/`

Detalhes no [ROADMAP](../blob/main/ROADMAP.md).
BODY

issue "Fotos no jogo" "melhoria,tamanho-M" "fechada" <<'BODY'
Permitir várias fotos por jogo.

- [ ] Botão "Adicionar fotos" (câmera ou galeria), várias por jogo
- [ ] Reduzir cada foto antes de salvar (lado maior 1600 px, JPEG ~0,82)
- [ ] Miniaturas no formulário e no cartão (primeira como capa); tocar abre maior; remover e reordenar
- [ ] Guardar no IndexedDB, com `photoIds` (lista) no jogo
- [ ] Backup com opção "incluir fotos" (padrão: sem fotos)
- [ ] Jogos antigos, sem foto, continuam funcionando

Detalhes no [ROADMAP](../blob/main/ROADMAP.md).
BODY

issue "Gerar imagem para Instagram (story e feed)" "melhoria,tamanho-G" "fechada" <<'BODY'
Depende de: fotos no jogo e logotipos em `assets/logos/`.

- [ ] Botões "Gerar story" (1080×1920) e "Gerar feed" (1080×1350) na tela do jogo
- [ ] Escolher quais fotos do jogo entram na imagem
- [ ] Conteúdo: foto(s), placar, nome da quadra, resultado conforme o placar (VITÓRIA) e logos do Goleiro de Aluguel e do Diário do Goleiro; nenhum outro dado
- [ ] Pré-visualização antes de salvar
- [ ] Compartilhar pelo menu do celular, com download como alternativa
- [ ] Sem foto: fundo padrão da marca
- [ ] Desenho em canvas, PNG, fonte embutida, faixas livres no story

Detalhes no [ROADMAP](../blob/main/ROADMAP.md).
BODY

issue "Logotipo e marca" "marca,tamanho-M" "fechada" <<'BODY'
- [ ] Escolher uma direção entre as ideias de `docs/marca.md`
- [ ] Logo em SVG (colorido e de uma cor) e ícone do app (192, 512 e maskable)
- [ ] Registrar paleta e tipografia em `docs/marca.md`
- [ ] Colocar os logos (Diário do Goleiro e Goleiro de Aluguel) em `assets/logos/`
BODY

issue "Testar em aparelho real" "teste,tamanho-P" <<'BODY'
Itens que só foram testados em simulação:

- [ ] Botão "Instalar agora" no Android
- [ ] Menu nativo de compartilhar (botão "Compartilhar o app")
- [ ] Instalação e uso no iPhone (Safari)
- [ ] Leitura de print com o idioma baixado do CDN de produção, em prints novos
BODY

# --- Quadro (GitHub Project) ---
if [ -n "$DRY" ]; then
  echo "[simulação] quadro 'Diário do Goleiro' com ${#URLS[@]} itens"
  exit 0
fi

if NUM="$(gh project create --owner "$OWNER" --title "Diário do Goleiro" --format json --jq .number 2>/dev/null)"; then
  echo "Quadro criado: https://github.com/users/$OWNER/projects/$NUM"
  gh project link "$NUM" --owner "$OWNER" --repo "$REPO" >/dev/null 2>&1 || true
  for u in "${URLS[@]}"; do
    gh project item-add "$NUM" --owner "$OWNER" --url "$u" >/dev/null && echo "Adicionada ao quadro: $u"
  done
else
  echo
  echo "As issues foram criadas, mas não consegui criar o quadro automaticamente."
  echo "Rode: gh auth refresh -s project   e depois crie o quadro pela web (veja docs/quadro-github.md)."
fi
