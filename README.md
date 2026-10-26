# Horas na Vida

Controle do que você faz no seu tempo livre (baseado na planilha "Horas Investidas na Vida") com barra de progresso para estudos de temas novos.

- **Painel**: tempo livre investido, média diária, maior foco, sequência de dias, distribuição por categoria, horas por dia/mês, por dia da semana e dias úteis × fim de semana. Compromissos fixos (ex.: Trabalho CLT) ficam fora por padrão.
- **Registros**: lançamentos agrupados por dia, com filtros de período, categoria e busca; criar/editar/apagar.
- **Estudos**: temas com meta total de horas, meta semanal opcional e prazo. Mostra % concluído, média semanal, previsão de término e ritmo necessário para o prazo.
- **Rotinas**: atividades recorrentes por dia da semana e gerador de lançamentos (sem duplicar).
- **Categorias**: cor, descrição e marcação de "compromisso fixo".

## Stack

Next.js 16 (App Router, route handlers em `src/app/api`), React 19, Tailwind CSS v4, Drizzle ORM, Neon (Postgres), Zod.

## Rodando localmente

```bash
pnpm install
cp .env.example .env.local   # preencha DATABASE_URL
pnpm db:migrate
pnpm dev
```

Sem Neon? `docker compose up -d` sobe um Postgres em `localhost:5433` (`DATABASE_URL=postgres://postgres:postgres@localhost:5433/life_hours`).
O app usa o driver HTTP do Neon quando o host termina em `.neon.tech` e `node-postgres` nos demais casos.

### Importar a planilha

```bash
pnpm db:import "C:/caminho/Horas Investidas na Vida.xlsx"
```

Importa categorias, registros e rotinas. Pode rodar de novo sem duplicar. Registros com data futura (ex.: CLT gerado para o mês seguinte) são ignorados; use `--include-future` para trazê-los.

## Deploy (Vercel + Neon)

1. Crie um projeto no Neon e copie a connection string.
2. Rode `pnpm db:migrate` apontando `DATABASE_URL` para o Neon.
3. Na Vercel, configure `DATABASE_URL` e, para proteger o app, `APP_PASSWORD` e `AUTH_SECRET`.

## API

| Método | Rota | Descrição |
| --- | --- | --- |
| GET / POST | `/api/entries` | Lista (`from`, `to`, `categoryId`, `studyTopicId`, `q`, `limit`) / cria registro |
| PUT / DELETE | `/api/entries/:id` | Atualiza / apaga registro |
| GET / POST | `/api/categories` | Lista com totais / cria |
| PUT / DELETE | `/api/categories/:id` | Atualiza / apaga (409 se tiver registros) |
| GET / POST | `/api/topics` | Temas de estudo com progresso / cria |
| GET / PUT / DELETE | `/api/topics/:id` | Detalhe / atualiza / apaga |
| GET / POST | `/api/routines` | Rotinas / cria |
| PUT / DELETE | `/api/routines/:id` | Atualiza / apaga |
| POST | `/api/routines/generate` | `{ from, to, routineIds? }` gera lançamentos |
| GET | `/api/stats` | Estatísticas do painel (`period`, `includeFixed`) |
| GET | `/api/activities` | Sugestões de atividades já usadas |

Erros de validação retornam 422 com `fieldErrors`.
