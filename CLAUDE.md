# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado do projeto

O repositório ainda **não tem código**: só existe `prd.md`, o PRD de um quiz web de Verdadeiro ou Falso sobre Claude Code para alunos da trilha da Jornada de Dados. O `prd.md` é a fonte da verdade para requisitos, contratos de API, schema do banco e critérios de aceite. Leia a seção relevante antes de implementar algo. A entrega segue os marcos M1–M5 (seção 11 do PRD).

Toda a interface é em **PT-BR**. Termos técnicos do produto ficam em inglês (`hooks`, `skills`, `slash commands`).

Decisões tomadas com o usuário depois do PRD:
- **Supabase local** (CLI como devDependency, via `npx supabase`, + Docker Desktop) para desenvolvimento e testes. O projeto cloud só entra no deploy (M5).
- **Ranking global e permanente**, sem separação por turma.
- **Escopo:** M1–M5 completo.
- **Pré-requisitos na máquina (Windows):** Git e Docker instalados. Node LTS pode ainda faltar; confira com `node -v` antes de começar. A pasta ainda não é repositório git.
- **Scaffold:** o `create-next-app` recusa pastas com arquivos existentes. Gere numa pasta temporária (TS, Tailwind, ESLint, App Router, sem `src/`, alias `@/*`) e mova para a raiz.

## Stack e comandos (planejados)

Next.js (App Router) + TypeScript strict (`noUncheckedIndexedAccess`), Tailwind, Zod, Supabase (Postgres), Vitest, Playwright, ESLint + Prettier, `tsx` para scripts, deploy na Vercel.

Scripts previstos no `package.json`:
- `npm run lint`, `npm run typecheck` (`tsc --noEmit`), `npm run format`
- `npm run test` (tudo), `npm run test:unit` (`tests/unit/`), `npm run test:api` (`tests/api/`, exige o Supabase local rodando)
- Um teste isolado: `npx vitest run tests/unit/sampling.test.ts` ou `npx vitest run -t "<nome>"`
- `npm run test:e2e` (Playwright em `tests/e2e/`)
- `npm run validate:questions` (`tsx scripts/validate-questions.ts`). Com `-- --strict`, exige 20 perguntas por nível; é o modo usado no CI a partir do M4
- `npm run db:start`, `npm run db:reset` (reaplica as migrações), `npm run db:types` (gera `lib/database.types.ts`)
- As chaves locais do Supabase para o `.env.local` vêm de `npx supabase status`

Atualize esta seção com os comandos reais quando o projeto for criado.

## Arquitetura e invariantes

Fluxo: navegador → Route Handlers `/api/*` → Supabase com a chave `service_role`. O cliente guarda apenas o `roundId`; o estado da rodada vive na tabela `rounds`.

Regras que atravessam vários arquivos e não podem ser quebradas:
- **O gabarito nunca chega ao cliente antes da resposta.** `data/questions.json` só é importado em módulos com `import "server-only"`. `POST /api/rounds` retorna só `{ id, level, topic, statement }`, e existe teste garantindo que `answer`/`explanation` não aparecem.
- **Supabase só no servidor.** `SUPABASE_SERVICE_ROLE_KEY` nunca recebe prefixo `NEXT_PUBLIC_`. RLS fica ativo em todas as tabelas, sem políticas para `anon`/`authenticated`.
- **O e-mail nunca é retornado** por nenhuma API nem aparece na UI. O ranking é a view `leaderboard`, que não inclui o e-mail.
- **Views ignoram o RLS.** A migração precisa de `revoke all on players, rounds, leaderboard from anon, authenticated`; sem isso, o PostgREST expõe a view com a chave anon.
- **Concorrência é resolvida no banco.** Responder e enviar ao ranking usam funções SQL atômicas chamadas via `supabase.rpc`: `answer_question` e `submit_round`, que fazem `select ... for update` na rodada. As rotas calculam `correct` com o gabarito do JSON e passam o resultado para a RPC. A lógica de "rodada melhor" existe duas vezes, em `isBetterRound` (`lib/scoring.ts`) e em SQL dentro de `submit_round`, e as duas têm que ficar iguais.
- **Rotas são adaptadores finos.** A lógica fica em `lib/rounds.ts` (`server-only`), reutilizada pelas server pages; a página de resultado chama essa camada direto, sem fetch HTTP à própria API.
- `lib/question-schema.ts` **não** usa `server-only`, porque o script de validação também o importa. Só `lib/questions.ts` carrega o JSON.
- **Tempo medido no servidor**, de `started_at` até a 10ª resposta (`duration_ms`).
- Toda entrada de API é validada com Zod (`lib/validation.ts`). Erros seguem `{ "error": { "code", "message" } }`, com `409 OUT_OF_ORDER | ALREADY_ANSWERED | ROUND_CLOSED` e `422 VALIDATION_ERROR`.

Regras de negócio concentradas em funções puras e testáveis:
- `lib/sampling.ts`: 10 perguntas na ordem fixa 4 Iniciante → 3 Intermediário → 3 Avançado, aleatórias dentro do nível, sem repetição, e no máximo 7 respostas iguais (re-sortear se passar disso).
- `lib/scoring.ts`: 1 ponto por acerto, sem peso por nível. Tiers: 0–4 Explorador, 5–7 Praticante, 8–9 Especialista, 10 Mestre do Claude Code. "Rodada melhor" = mais acertos, depois menor tempo; desempate final pelo envio mais antigo.
- Ranking: um registro por e-mail (normalizado com trim + minúsculas). `players.best_round_id` só muda se a nova rodada for melhor; o apelido exibido é o da última submissão.

Status da rodada: `in_progress → finished → submitted`, ou `abandoned`. Recarregar a página reinicia a rodada.

Migrações SQL ficam em `supabase/migrations/` (schema base na seção 7.3 do PRD).

## Banco de perguntas (`data/questions.json`)

Schema e regras estão na seção 4.4 do PRD. Pontos que costumam escapar:
- `id` no formato `<topic>-<nnn>`; `topic` ∈ `claude-geral | fundamentos | uso-diario | extensibilidade | avancado`; `level` ∈ `iniciante | intermediario | avancado`.
- `explanation` começa com "Verdadeiro." ou "Falso." e explica o porquê.
- `sourceUrl` aponta para documentação oficial (`code.claude.com/docs`, `docs.claude.com`, `anthropic.com`).
- Meta do MVP: 60 perguntas, 20 por nível, ~50% V/F em cada nível.
- As 8 perguntas semente do PRD (seção 4.5) ficam abaixo do mínimo de 4/3/3 para sortear uma rodada. Por isso os testes de `sampleRound` usam bancos *fixture* com `rng` injetável, e o banco real precisa crescer antes de o app rodar uma rodada.
- **Verifique cada afirmação na documentação oficial antes de adicioná-la** (subagente `claude-code-guide` ou WebFetch) e atualize `reviewedAt`. Evite números voláteis (preços, limites, versões).

## UI e acessibilidade

Mobile-first (360px, sem scroll horizontal), WCAG 2.1 AA, navegação completa por teclado (`V`, `F`, `Enter`), `aria-live="polite"` no feedback, feedback que não depende só de cor, tema claro/escuro via `prefers-color-scheme`, animações ≤ 300 ms respeitando `prefers-reduced-motion`. Sem marca ou logo da Anthropic. Orçamento: bundle JS inicial < 150 KB gzip.
