# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

Quiz web de Verdadeiro ou Falso sobre Claude Code para alunos da trilha da Jornada de Dados. O `prd.md` é a fonte da verdade para requisitos, contratos de API, schema do banco e critérios de aceite; leia a seção relevante antes de mudar comportamento. O MVP (marcos M1–M5 do PRD) está implementado, menos o deploy. Setup, scripts e API estão no `README.md`.

Toda a interface é em **PT-BR**. Termos técnicos do produto ficam em inglês (`hooks`, `skills`, `slash commands`).

Decisões tomadas com o usuário depois do PRD: Supabase **local** (CLI como devDependency + Docker Desktop) em desenvolvimento e testes, nuvem só no deploy; ranking **global e permanente**, sem separação por turma.

## Comandos

- `npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` (`next typegen && tsc --noEmit`) · `npm run format:check`
- `npm run test:unit` · `npm run test:api` (exige `npm run db:start` e `.env.local`) · `npm run test:e2e` (Playwright faz build e sobe `next start` na porta 3100; reaproveita um servidor já rodando nela)
- Um teste isolado: `npx vitest run tests/unit/sampling.test.ts` ou `npx vitest run -t "<nome>"`
- `npm run validate:questions -- --strict` (modo do CI) · `npm run docs:revisao` (regenera `docs/revisao-perguntas.md`)
- `npm run db:start` · `npm run db:reset` (recria o banco e reaplica as migrações) · `npm run db:types` (regenere `lib/database.types.ts` sempre que mudar uma migração; o CI falha se estiver desatualizado)
- `.env.local` usa `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_ANON_KEY` (só testes), tirados de `npx supabase status -o env`. Nunca imprima as chaves no chat.
- No Windows deste projeto o Node pode não estar no PATH do shell: use `export PATH="/c/Program Files/nodejs:$PATH"` no Bash.
- Os testes de API/E2E gravam jogadores fictícios no ranking local; `npm run db:reset` limpa.

## Next.js 16 com Cache Components

Esta versão difere do que costuma estar no treinamento. Antes de mexer em rotas ou páginas, leia o guia em `node_modules/next/dist/docs/`. Pontos que já morderam este projeto:
- `cacheComponents: true` está ligado. As exportações `dynamic`, `runtime`, `revalidate` e `fetchCache` **não existem mais**; não as adicione.
- Página que lê banco, `params` ou `searchParams` precisa de um componente `async` dentro de `<Suspense>` (veja `app/resultado/[roundId]/page.tsx` e `app/ranking/page.tsx`). Por causa do streaming, `notFound()` ali responde HTTP 200 com a página 404; teste o conteúdo, não o status.
- Todo `catch` que pode envolver código do Next chama `unstable_rethrow(error)` primeiro (`handle()` em `lib/api.ts`). Sem isso, o sinal interno de "rota dinâmica" do pré-render vira um 500.
- Tipos globais `PageProps<"/rota">`, `LayoutProps` e `RouteContext<"/rota">` vêm do `next typegen`.

## Arquitetura e invariantes

Fluxo: navegador → Route Handlers `/api/*` (adaptadores finos) → `lib/rounds.ts` (`server-only`, camada de serviço) → Supabase com a chave `service_role`. As server pages chamam `lib/rounds.ts` direto, sem HTTP. O cliente guarda só o `roundId` em memória; recarregar a página reinicia a rodada.

Regras que atravessam vários arquivos e não podem ser quebradas:
- **O gabarito nunca chega ao cliente antes da resposta.** `data/questions.json` só é importado por `lib/questions.ts` (`server-only`). `POST /api/rounds` retorna só `{ id, level, topic, statement }`; há testes de API e E2E garantindo isso.
- **Zod fica fora do bundle do quiz.** Componentes de cliente importam níveis e rótulos de `lib/levels.ts` (sem Zod), nunca valores de `lib/question-schema.ts` (`import type` pode). O orçamento de JS inicial é < 150 KB gzip; o quiz está em ~139 KB.
- **Supabase só no servidor.** `SUPABASE_SERVICE_ROLE_KEY` nunca recebe prefixo `NEXT_PUBLIC_`.
- **Banco fechado para a chave anon.** RLS ligado e sem políticas, mais `revoke` explícito em tabelas, na view `leaderboard` (views ignoram RLS) e nas funções (que nascem executáveis por `PUBLIC`). Toda migração nova precisa repetir esse padrão; o teste "acesso direto ao banco com a chave anon" confere.
- **O e-mail nunca é retornado** por nenhuma API nem aparece na UI.
- **Concorrência é resolvida no banco.** `answer_question` e `submit_round` (SQL, chamadas via `supabase.rpc`) fazem `select ... for update` na rodada e devolvem `{error: código}` em vez de lançar. A rota calcula `correct` com o gabarito do JSON e passa para a RPC. O tempo (`duration_ms`) é medido com o `now()` do banco.
- **"Rodada melhor" existe duas vezes**: `isBetterRound` em `lib/scoring.ts` e o SQL de `submit_round` (mais acertos → menor tempo → terminou antes). Mude as duas juntas. A view `leaderboard` usa a mesma ordenação.
- Erros da API: lance `ApiError(code)` de `lib/api.ts`; `handle()` converte para `{ "error": { "code", "message", "fields?" } }` com o status certo (404/409/422/429).
- `lib/validation.ts` não usa `server-only`: o `SubmitForm` reaproveita os schemas no cliente para mostrar erros por campo.

Regras de negócio em funções puras e testadas: `lib/sampling.ts` (4/3/3, sem repetição, no máximo 7 respostas iguais, `rng` injetável), `lib/scoring.ts` (tiers 0–4 Explorador, 5–7 Praticante, 8–9 Especialista, 10 Mestre do Claude Code), `lib/profanity.ts`, `lib/rate-limit.ts` (relógio injetável; desligado com `RATE_LIMIT_DISABLED=1`, usado nos testes de API e E2E).

Status da rodada: `in_progress → finished → submitted`, ou `abandoned` (ainda não usado; seria um job futuro).

## Banco de perguntas (`data/questions.json`)

60 perguntas, 20 por nível, 10 V / 10 F em cada nível. Schema na seção 4.4 do PRD e em `lib/question-schema.ts`. Pontos que costumam escapar:
- `id` = `<topic>-<nnn>`, numeração sequencial por tema; `explanation` começa com "Verdadeiro." ou "Falso." de acordo com `answer`.
- `sourceUrl`: https em `code.claude.com`, `docs.claude.com`, `platform.claude.com` (para onde `docs.claude.com` redireciona hoje) ou `anthropic.com`. Use a URL canônica que responde 200 (ex.: modelos em `https://platform.claude.com/docs/en/models/overview`).
- **Verifique cada afirmação na documentação atual antes de adicioná-la e atualize `reviewedAt`.** O produto muda rápido e a memória do modelo fica desatualizada (ex.: o modo de permissão padrão virou `auto`; subagents agora podem criar subagents; existem linhas de modelo além de Opus/Sonnet/Haiku). Toda página do Claude Code tem versão em Markdown em `https://code.claude.com/docs/en/<pagina>.md`, com índice em `https://code.claude.com/docs/llms.txt`. Evite preços, limites e versões.
- Depois de mudar o banco: `npm run validate:questions -- --strict` e `npm run docs:revisao`.

## UI e acessibilidade

Mobile-first (360 px, sem scroll horizontal), WCAG 2.1 AA, navegação completa por teclado (`V`, `F`, `Enter`; o foco vai para a afirmação a cada pergunta e para "Próxima" no feedback), `aria-live="polite"` no feedback, feedback que não depende só de cor, tema claro/escuro via `prefers-color-scheme` (tokens em `app/globals.css`), animações ≤ 300 ms com `motion-safe:`. Classes compartilhadas de botão, link e selo de nível ficam em `components/ui.ts`. Sem marca ou logo da Anthropic.
