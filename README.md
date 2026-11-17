# Quiz Claude Code

Quiz web de **Verdadeiro ou Falso** sobre Claude Code e o ecossistema Claude, para os alunos da trilha Claude Code da Jornada de Dados. Cada rodada tem 10 perguntas com dificuldade progressiva (4 Iniciante → 3 Intermediário → 3 Avançado). Depois de cada resposta aparece uma explicação com link para a documentação oficial. No fim, o aluno pode entrar num ranking com apelido e e-mail.

Requisitos completos em [prd.md](prd.md). Orientações para agentes de código em [CLAUDE.md](CLAUDE.md).

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · TypeScript strict · Tailwind CSS 4 · Zod 4 · Supabase (Postgres) · Vitest · Playwright.

## Rodar localmente

Pré-requisitos: **Node.js 22+** e **Docker Desktop** rodando (o Supabase local roda em containers).

```bash
npm install
npm run db:start        # sobe o Supabase local e aplica as migrações (a 1ª vez baixa as imagens)
npx supabase status -o env
```

Crie o `.env.local` a partir do [.env.example](.env.example), copiando da saída do `status`:

| `.env.local`                    | valor do `supabase status -o env` |
| ------------------------------- | --------------------------------- |
| `SUPABASE_URL`                  | `API_URL`                         |
| `SUPABASE_SERVICE_ROLE_KEY`     | `SERVICE_ROLE_KEY`                |
| `SUPABASE_ANON_KEY` (só testes) | `ANON_KEY`                        |

```bash
npm run dev             # http://localhost:3000
```

O Supabase Studio local (para ver as tabelas) fica em http://localhost:54323.

## Scripts

| Script                                      | O que faz                                                                                          |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `npm run dev` / `build` / `start`           | Servidor de desenvolvimento, build e servidor de produção                                          |
| `npm run lint` · `typecheck` · `format`     | ESLint, `tsc` (com `next typegen`) e Prettier                                                      |
| `npm run test:unit`                         | Testes unitários (sorteio, pontuação, schemas, filtro de apelidos, rate limit)                     |
| `npm run test:api`                          | Testes das rotas contra o Supabase local (precisa do `db:start`)                                   |
| `npm run test:e2e`                          | Playwright: faz o build, sobe o servidor na porta 3100 e testa desktop e celular (375 px)          |
| `npm run test`                              | Unitários + API                                                                                    |
| `npm run validate:questions`                | Valida `data/questions.json`. Com `-- --strict`, exige 20 por nível e V/F equilibrado (modo do CI) |
| `npm run docs:revisao`                      | Gera [docs/revisao-perguntas.md](docs/revisao-perguntas.md), a tabela de revisão para o instrutor  |
| `npm run db:start` · `db:stop` · `db:reset` | Sobe, para ou recria o banco local do zero                                                         |
| `npm run db:types`                          | Gera `lib/database.types.ts` a partir do banco local                                               |

Um teste isolado: `npx vitest run tests/unit/sampling.test.ts` ou `npx vitest run -t "nome do teste"`.

Os testes de API e E2E gravam jogadores fictícios (`teste_…`, `e2e_…`) no ranking **local**. Para limpar: `npm run db:reset`.

## Como funciona

```
Navegador ──fetch──▶ Route Handlers /api/* ──▶ lib/rounds.ts ──service_role──▶ Supabase (Postgres)
                                                  │
                                    data/questions.json (gabarito, só no servidor)
```

- **O gabarito nunca vai para o navegador antes da resposta.** A rodada é criada no servidor; o cliente recebe só `{id, level, topic, statement}` e o acerto é calculado no servidor.
- **O tempo é medido no banco**, da criação da rodada até a 10ª resposta.
- **Responder e enviar ao ranking são atômicos:** as funções SQL `answer_question` e `submit_round` travam a rodada (`select … for update`), então respostas duplicadas ou fora de ordem são recusadas mesmo em paralelo.
- **Ranking:** um registro por e-mail (normalizado). Só uma rodada melhor (mais acertos, depois menos tempo) substitui a anterior; o apelido exibido é o da última submissão. O e-mail nunca sai do banco.
- **Segurança do banco:** RLS ligado e sem políticas, mais `revoke` explícito para `anon`/`authenticated` nas tabelas, na view e nas funções. Só a chave `service_role`, usada no servidor, acessa os dados.

## API

| Rota                            | Descrição                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `POST /api/rounds`              | Cria uma rodada → `201 {roundId, questions}`                                                         |
| `POST /api/rounds/{id}/answers` | `{questionId, answer}` → `{correct, correctAnswer, explanation, sourceUrl, answeredCount, finished}` |
| `GET /api/rounds/{id}/result`   | Resultado de uma rodada terminada                                                                    |
| `POST /api/rounds/{id}/submit`  | `{nickname, email, consent: true}` → `{position, improved}`                                          |
| `GET /api/leaderboard?limit=20` | Top do ranking (1–50), sem e-mail                                                                    |

Erros: `{ "error": { "code", "message", "fields?" } }`, com `404 ROUND_NOT_FOUND`, `409 OUT_OF_ORDER | ALREADY_ANSWERED | ROUND_CLOSED | ROUND_NOT_FINISHED`, `422 VALIDATION_ERROR` e `429 RATE_LIMITED`.

## Adicionar ou corrigir perguntas

1. Edite [data/questions.json](data/questions.json). Regras (PRD 4.4): `id` = `<topic>-<nnn>`; afirmação com 10–200 caracteres; explicação com 20–400 caracteres, começando com "Verdadeiro." ou "Falso." e dizendo o porquê; `sourceUrl` https em `code.claude.com`, `docs.claude.com`, `platform.claude.com` ou `anthropic.com`.
2. **Confira a afirmação na documentação oficial** e atualize `reviewedAt`. O produto muda rápido; evite preços, limites e versões. As páginas do Claude Code têm versão em Markdown (`https://code.claude.com/docs/en/<pagina>.md`) e há um índice em `https://code.claude.com/docs/llms.txt`.
3. `npm run validate:questions -- --strict` e `npm run docs:revisao`.

## Deploy

Ainda não feito. Os passos previstos, que envolvem contas externas:

1. Criar um projeto no [Supabase](https://supabase.com) e aplicar as migrações: `npx supabase link --project-ref <ref>` e `npx supabase db push`.
2. Criar o projeto na [Vercel](https://vercel.com) a partir do repositório no GitHub, com as variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (sem prefixo `NEXT_PUBLIC_`).
3. Conferir uma rodada completa na URL publicada.

## Limitações conhecidas

- **Rate limit em memória:** na Vercel o contador é por instância. Suficiente para o MVP.
- **Rodadas abandonadas** (página recarregada no meio) ficam com status `in_progress`; marcá-las como `abandoned` é um job futuro.
- **Filtro de apelidos simples:** palavras que _começam_ com um termo bloqueado são recusadas (ex.: "dickens").
- **Contato de privacidade:** o texto do diálogo usa um placeholder (`PRIVACY_CONTACT` em [components/PrivacyDialog.tsx](components/PrivacyDialog.tsx)) até a Jornada definir o canal oficial.
