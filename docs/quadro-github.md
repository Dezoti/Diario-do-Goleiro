# Quadro no GitHub

O quadro (GitHub Project) organiza as ideias do [ROADMAP](../ROADMAP.md) como tarefas.

## Jeito rápido (script)

No computador, dentro da pasta do repositório:

```bash
gh auth login                  # se ainda não estiver logado
gh auth refresh -s project     # libera a criação de quadros
DRY_RUN=1 bash scripts/criar-quadro.sh   # só mostra o que faria
bash scripts/criar-quadro.sh             # cria de verdade (rode uma vez)
```

O script cria as labels, uma issue para cada item do roadmap e o quadro "Diário do Goleiro" com todas elas.
Se rodar duas vezes, as issues ficam duplicadas.

## Deixar o quadro com colunas

O quadro nasce como tabela. Para virar um kanban:

1. Abra o quadro (aba **Projects** do repositório ou github.com/Dezoti → Projects).
2. Clique em **+ New view** e escolha **Board**.
3. As colunas seguem o campo **Status**: Todo, In Progress e Done. Arraste os cartões entre elas.

## Jeito manual (sem script)

1. No repositório, aba **Projects** → **New project** → modelo **Board**.
2. Em **Add item**, cole o título de cada ideia (uma por linha) para criar vários cartões de uma vez.
3. Converta cada cartão em issue (menu do cartão → **Convert to issue**) e escolha o repositório.
