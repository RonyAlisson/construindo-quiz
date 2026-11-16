# PRD: Quiz Claude Code (Verdadeiro ou Falso)

> Documento de requisitos de produto para ser consumido pelo Claude Code na construção do projeto.
> Versão 1.0 · 2026-11-09 · Origem: sessão de brainstorm.

---

## 1. Visão geral

### 1.1 Problema
Quem faz a trilha de Claude Code da Jornada de Dados aprende muitos conceitos em pouco tempo: o que é o produto, como usar no dia a dia, como estender (MCP, skills, hooks) e como automatizar. Hoje os alunos não têm um jeito rápido e divertido de **fixar o conteúdo** e **medir o quanto já sabem**.

### 1.2 Solução
Um **quiz web de Verdadeiro ou Falso** sobre Claude Code e o ecossistema Claude. Cada rodada tem 10 perguntas com **dificuldade progressiva** (do básico/negócio ao avançado). Depois de cada resposta aparece uma **explicação curta com link para a documentação oficial**. No final, o aluno pode entrar num **ranking entre alunos**.

### 1.3 Objetivos
| # | Objetivo | Métrica de sucesso |
|---|----------|--------------------|
| O1 | Reforçar o aprendizado da trilha | ≥ 60% dos alunos que iniciam uma rodada a concluem |
| O2 | Aumentar engajamento da turma | ≥ 40% das rodadas concluídas são enviadas ao ranking |
| O3 | Incentivar a consulta à documentação | Cliques em "Saiba mais" em ≥ 15% das explicações (opcional, se houver analytics) |
| O4 | Ser rápido e leve | Rodada completa em ≤ 5 min; LCP < 2,5 s em 4G |

### 1.4 Fora do escopo (MVP)
- Login com OAuth / contas de usuário
- Timer por pergunta ou pontuação por velocidade (o tempo só serve para desempate)
- Escolha manual de nível
- Painel admin para editar perguntas (o banco é um arquivo JSON versionado no repositório)
- Internacionalização (só PT-BR)
- Compartilhamento em redes sociais e histórico local

---

## 2. Público-alvo e personas

**Público principal:** alunos da trilha Claude Code da Jornada de Dados.

| Persona | Perfil | O que espera do quiz |
|---------|--------|----------------------|
| **Ana, analista de negócio** | Pouca experiência técnica; quer entender o valor do Claude Code | Perguntas iniciais acessíveis, explicações claras sem jargão |
| **Bruno, engenheiro de dados** | Usa terminal e Git no dia a dia; começando com Claude Code | Testar uso prático: CLAUDE.md, slash commands, permissões |
| **Carla, dev sênior** | Já usa Claude Code; quer dominar automação | Perguntas avançadas: hooks, MCP, headless, SDK, CI; disputar o topo do ranking |

---

## 3. Experiência do usuário

### 3.1 Fluxo principal
```
[Home] → [Rodada: 10 perguntas] → [Resultado] → [Enviar ao ranking] → [Ranking]
   ↑                                                     │
   └──────────────── "Jogar de novo" ────────────────────┘
```

1. **Home**
   - Título, uma frase explicando o quiz ("10 perguntas de Verdadeiro ou Falso, do básico ao avançado")
   - Botão **Começar**
   - Link **Ver ranking**
2. **Pergunta (×10)**
   - Indicador de progresso ("Pergunta 3 de 10") e selo do nível atual (Iniciante / Intermediário / Avançado)
   - Afirmação em destaque
   - Dois botões grandes: **Verdadeiro** e **Falso** (atalhos de teclado `V` e `F`)
   - Depois de responder:
     - Os botões ficam travados
     - Feedback visual de acerto ou erro (cor + ícone + texto, sem depender só de cor)
     - **Explicação** de 1 a 3 frases
     - Link **Saiba mais** para a documentação oficial (abre em nova aba)
     - Botão **Próxima** (atalho `Enter`)
3. **Resultado**
   - Acertos (ex.: 7/10) e tempo total
   - Classificação textual: 0–4 "Explorador", 5–7 "Praticante", 8–9 "Especialista", 10 "Mestre do Claude Code"
   - Resumo por nível (ex.: Iniciante 4/4, Intermediário 2/3, Avançado 1/3)
   - Lista das 10 perguntas com resposta dada, resposta certa e link da explicação
   - Formulário **Entrar no ranking**: apelido, e-mail, checkbox de consentimento LGPD
   - Botões **Jogar de novo** e **Ver ranking**
4. **Ranking**
   - Top 20: posição, apelido, acertos, tempo, data
   - **Nunca exibir o e-mail**
   - Se o aluno acabou de enviar, destacar a linha dele (ou mostrar a posição dele se estiver fora do top 20)

### 3.2 Regras da rodada
- **10 perguntas por rodada**, sem limite de tempo por pergunta
- **Ordem progressiva fixa:** 4 Iniciante → 3 Intermediário → 3 Avançado
- As perguntas são **sorteadas** do banco a cada rodada, sem repetição dentro da rodada
- Dentro de cada nível, a ordem é aleatória
- Equilíbrio de gabarito: o banco tem ~50% Verdadeiro e ~50% Falso. Uma rodada não pode ter mais de 7 respostas iguais (re-sortear se tiver)
- Não dá para voltar nem mudar uma resposta já dada
- Se a página for recarregada, a rodada recomeça do zero. A rodada abandonada fica no banco com status `abandoned` e não vai para o ranking

### 3.3 Pontuação e ranking
- **1 ponto por acerto** (0 a 10). Não há peso por nível (decisão do brainstorm: pontuação com peso ficou fora do MVP)
- **Desempate:** menor tempo total da rodada, depois o envio mais antigo
- O tempo total é medido **no servidor**, da criação da rodada até a última resposta
- **Um registro por e-mail no ranking:** vale a melhor rodada do aluno. Uma rodada nova só substitui a anterior se for melhor (mais acertos, ou mesmos acertos em menos tempo)
- O apelido mostrado é o da última submissão daquele e-mail

### 3.4 Identificação e LGPD
- **Apelido:** obrigatório, 3–20 caracteres, letras/números/espaço/`_`/`-`, com filtro simples de palavrões (lista em `lib/profanity.ts`)
- **E-mail:** obrigatório para entrar no ranking, validado por formato, normalizado (`trim` + minúsculas). Serve só para deduplicar o ranking e, se a Jornada quiser, para contato
- **Consentimento:** checkbox obrigatório com o texto: _"Concordo que meu apelido apareça no ranking público e que meu e-mail seja armazenado pela Jornada de Dados apenas para identificar minha pontuação."_ Guardar `consent_at`
- O e-mail **nunca** é retornado por nenhuma API pública e nunca aparece na interface depois do envio
- Rodapé com link para uma seção curta de privacidade (pode ser um modal) explicando o uso dos dados e como pedir exclusão (contato da Jornada)

---

## 4. Conteúdo: banco de perguntas

### 4.1 Escopo de temas
O quiz cobre **Claude Code** e o **ecossistema Claude em geral**:

| Código | Tema | Exemplos de assuntos |
|--------|------|----------------------|
| `claude-geral` | Claude e Anthropic | Famílias de modelos (Opus, Sonnet, Haiku), Claude.ai, Claude API, janela de contexto, tokens, conceitos de LLM |
| `fundamentos` | Fundamentos e negócio do Claude Code | O que é, para quem serve, onde roda (terminal, desktop, web, IDEs), planos/acesso, casos de uso |
| `uso-diario` | Uso no dia a dia | Slash commands, `CLAUDE.md`, modos de permissão, plan mode, gestão de contexto (`/clear`, `/compact`), memória |
| `extensibilidade` | Extensibilidade | MCP servers, skills, subagents, plugins, hooks, `settings.json` |
| `avancado` | Avançado e automação | Modo headless (`-p`), Claude Agent SDK, GitHub Actions/CI, git worktrees, sessões paralelas |

### 4.2 Tamanho e distribuição (MVP: 60 perguntas)
| Nível | Qtde | Temas predominantes |
|-------|------|---------------------|
| Iniciante | 20 | `claude-geral` (8), `fundamentos` (10), `uso-diario` (2) |
| Intermediário | 20 | `uso-diario` (10), `extensibilidade` (6), `claude-geral` (4) |
| Avançado | 20 | `extensibilidade` (8), `avancado` (12) |

- Cada nível com ~50% Verdadeiro e ~50% Falso
- Perguntas Iniciante devem ser compreensíveis por quem não é desenvolvedor (persona Ana)

### 4.3 Diretrizes de redação
- Uma afirmação **única e inequívoca** por pergunta, sem duplas negações nem pegadinhas de palavra
- Afirmações falsas devem ser **plausíveis** (equívocos comuns), nunca absurdas
- Até 200 caracteres na afirmação e até 400 na explicação
- A explicação diz **por que** é verdadeiro ou falso, não apenas repete o gabarito
- Todo item tem `sourceUrl` apontando para documentação oficial (`code.claude.com/docs`, `docs.claude.com`, `anthropic.com`)
- **Precisão é requisito:** o Claude Code muda rápido. Cada pergunta tem `reviewedAt` e precisa ser checada na documentação oficial ao ser criada. Evite perguntas sobre números voláteis (preços, limites exatos, versões)
- Termos técnicos ficam em inglês quando é assim que aparecem no produto (`hooks`, `skills`, `slash commands`)

### 4.4 Schema da pergunta (`data/questions.json`)
```json
{
  "id": "uso-diario-007",
  "level": "intermediario",
  "topic": "uso-diario",
  "statement": "O comando /compact apaga todo o histórico da conversa sem deixar nenhum resumo.",
  "answer": false,
  "explanation": "Falso. O /compact resume a conversa para liberar espaço no contexto e mantém um resumo do que foi feito. Quem limpa o histórico por completo é o /clear.",
  "sourceUrl": "https://code.claude.com/docs/en/slash-commands",
  "reviewedAt": "2026-11-09"
}
```
| Campo | Tipo | Regras |
|-------|------|--------|
| `id` | string | Único, formato `<topic>-<nnn>` |
| `level` | `"iniciante" \| "intermediario" \| "avancado"` | Obrigatório |
| `topic` | um dos códigos da seção 4.1 | Obrigatório |
| `statement` | string | 10–200 caracteres |
| `answer` | boolean | `true` = Verdadeiro |
| `explanation` | string | 20–400 caracteres, começa com "Verdadeiro." ou "Falso." |
| `sourceUrl` | string (URL https) | Domínio oficial Anthropic/Claude |
| `reviewedAt` | string (YYYY-MM-DD) | Data da última revisão |

O schema deve ser validado com **Zod** num teste automatizado e num script `npm run validate:questions`. O script confere unicidade de IDs, contagem por nível (≥ 4/3/3 no mínimo para sortear) e equilíbrio V/F.

### 4.5 Exemplos de perguntas (semente)
| Nível | Tema | Afirmação | Gabarito |
|-------|------|-----------|----------|
| Iniciante | fundamentos | O Claude Code pode ser usado diretamente no terminal, como uma ferramenta de linha de comando. | V |
| Iniciante | fundamentos | O Claude Code só funciona dentro do VS Code. | F |
| Iniciante | claude-geral | Opus, Sonnet e Haiku são nomes de linhas de modelos Claude da Anthropic. | V |
| Intermediário | uso-diario | O arquivo `CLAUDE.md` serve para dar ao Claude Code instruções e contexto persistentes sobre o projeto. | V |
| Intermediário | uso-diario | O comando `/compact` apaga todo o histórico da conversa sem deixar nenhum resumo. | F |
| Avançado | avancado | A flag `-p` (`--print`) executa o Claude Code em modo não interativo, útil em scripts e pipelines de CI. | V |
| Avançado | extensibilidade | Hooks são definidos no `settings.json` e executados automaticamente pelo Claude Code em eventos como antes ou depois do uso de uma ferramenta. | V |
| Avançado | extensibilidade | O MCP (Model Context Protocol) é um protocolo proprietário que só funciona com o Claude Code. | F |

> **Tarefa de conteúdo:** gerar as 60 perguntas seguindo 4.2–4.4 e conferir cada uma na documentação oficial (por exemplo, com o subagente `claude-code-guide` ou WebFetch) antes do commit.

---

## 5. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF01 | Iniciar uma rodada sorteando 10 perguntas na distribuição 4/3/3 | Must |
| RF02 | Mostrar uma pergunta por vez, com progresso e selo de nível | Must |
| RF03 | Responder V/F por clique ou teclado (`V`, `F`) | Must |
| RF04 | Validar a resposta **no servidor** e retornar acerto, explicação e `sourceUrl` | Must |
| RF05 | Impedir responder duas vezes ou fora de ordem | Must |
| RF06 | Tela de resultado com acertos, tempo, classificação, resumo por nível e revisão das perguntas | Must |
| RF07 | Enviar resultado ao ranking com apelido, e-mail e consentimento | Must |
| RF08 | Ranking top 20 com melhor rodada por e-mail, sem expor e-mails | Must |
| RF09 | Destacar a posição do aluno após o envio | Should |
| RF10 | Script de validação do banco de perguntas | Must |
| RF11 | Seção/modal de privacidade | Must |
| RF12 | Rate limiting básico nas APIs | Should |
| RF13 | Filtro de palavrões no apelido | Should |

---

## 6. Requisitos não funcionais
- **Responsivo, mobile-first:** funcionar de 360px de largura até desktop, sem scroll horizontal
- **Acessibilidade (WCAG 2.1 AA):** contraste adequado; foco visível; navegação completa por teclado; `aria-live="polite"` no feedback; botões com rótulos de texto (não só ícones/cores)
- **Desempenho:** LCP < 2,5 s em 4G; bundle JS inicial < 150 KB gzip
- **Idioma:** interface 100% em PT-BR
- **Segurança:**
  - O gabarito **nunca** vai para o cliente antes da resposta
  - Chave `service_role` do Supabase só no servidor
  - Todas as entradas validadas com Zod
  - RLS ativo em todas as tabelas
- **Tema:** claro e escuro (segue `prefers-color-scheme`)
- **Privacidade:** e-mail tratado como dado pessoal (LGPD); nenhum analytics de terceiros que rastreie o usuário no MVP

---

## 7. Arquitetura técnica

### 7.1 Stack
| Camada | Tecnologia |
|--------|------------|
| Framework | **Next.js** (App Router, versão estável mais recente) + **TypeScript** (strict) |
| Estilo | **Tailwind CSS** |
| Validação | **Zod** |
| Banco | **Supabase** (Postgres) via `@supabase/supabase-js`, usado **apenas em código de servidor** (Route Handlers / Server Actions) |
| Testes | **Vitest** (unidade), **Playwright** (E2E do fluxo principal) |
| Lint/format | ESLint + Prettier |
| Deploy | **Vercel** (padrão assumido) + projeto Supabase free tier |

### 7.2 Visão de arquitetura
```
Navegador (React / Next.js client)
   │  fetch JSON
   ▼
Next.js Route Handlers (/api/*)  ──  data/questions.json (gabarito; import só no servidor)
   │  supabase-js (service role)
   ▼
Supabase Postgres (rounds, players) + RLS sem políticas públicas
```
- O banco de perguntas fica em `data/questions.json`, importado **somente** em módulos de servidor (`import "server-only"`)
- O cliente recebe só `{ id, level, topic, statement }`
- O estado da rodada vive no Supabase, e o cliente guarda apenas o `roundId`

### 7.3 Modelo de dados (Supabase)
```sql
create table players (
  id           uuid primary key default gen_random_uuid(),
  email        text not null unique,          -- normalizado (lower/trim)
  nickname     text not null,
  consent_at   timestamptz not null,
  best_round_id uuid,                          -- FK para rounds (melhor rodada)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table rounds (
  id             uuid primary key default gen_random_uuid(),
  question_ids   text[] not null,              -- 10 ids, na ordem apresentada
  answers        jsonb not null default '[]',  -- [{questionId, answer, correct, answeredAt}]
  correct_count  int not null default 0,
  status         text not null default 'in_progress'
                 check (status in ('in_progress','finished','submitted','abandoned')),
  started_at     timestamptz not null default now(),
  finished_at    timestamptz,
  duration_ms    int,
  player_id      uuid references players(id),
  created_at     timestamptz not null default now()
);

alter table players add constraint players_best_round_fk
  foreign key (best_round_id) references rounds(id);

alter table players enable row level security;
alter table rounds  enable row level security;
-- Sem políticas para anon/authenticated: todo acesso passa pelas APIs com service role.

create view leaderboard as
select p.nickname, r.correct_count, r.duration_ms, r.finished_at
from players p
join rounds r on r.id = p.best_round_id
order by r.correct_count desc, r.duration_ms asc, r.finished_at asc;
```
- Migrações versionadas em `supabase/migrations/`
- Rodadas `in_progress` com mais de 2 h podem ser marcadas `abandoned` por um job futuro (fora do MVP)

### 7.4 Contratos de API
Todas as rotas retornam JSON. Erros usam `{ "error": { "code": string, "message": string } }`.

**`POST /api/rounds`**: cria uma rodada
```json
// 201
{
  "roundId": "uuid",
  "questions": [
    { "id": "fundamentos-001", "level": "iniciante", "topic": "fundamentos", "statement": "..." }
  ]
}
```

**`POST /api/rounds/{roundId}/answers`**: responde a próxima pergunta
```json
// request
{ "questionId": "fundamentos-001", "answer": true }
// 200
{ "correct": true, "correctAnswer": true, "explanation": "...", "sourceUrl": "https://...",
  "answeredCount": 1, "finished": false }
```
- `409 OUT_OF_ORDER` se `questionId` não for a próxima pergunta esperada
- `409 ALREADY_ANSWERED` se a pergunta já foi respondida
- `409 ROUND_CLOSED` se a rodada não estiver `in_progress`
- Na 10ª resposta: `status = 'finished'`, grava `finished_at` e `duration_ms`

**`GET /api/rounds/{roundId}/result`**: resultado da rodada finalizada
```json
{ "correctCount": 7, "durationMs": 184000, "tier": "Praticante",
  "byLevel": { "iniciante": [4,4], "intermediario": [2,3], "avancado": [1,3] },
  "review": [ { "id": "...", "statement": "...", "yourAnswer": true, "correctAnswer": false,
                "explanation": "...", "sourceUrl": "..." } ] }
```

**`POST /api/rounds/{roundId}/submit`**: envia ao ranking
```json
// request
{ "nickname": "carla_dev", "email": "carla@exemplo.com", "consent": true }
// 200
{ "position": 3, "improved": true }
```
- Exige `status = 'finished'` (senão `409`); depois do envio, `status = 'submitted'`
- Faz upsert de `players` por e-mail; só troca `best_round_id` se a nova rodada for melhor (regra 3.3)
- `422 VALIDATION_ERROR` para apelido/e-mail inválidos ou `consent=false`

**`GET /api/leaderboard?limit=20`**
```json
{ "entries": [ { "position": 1, "nickname": "carla_dev", "correctCount": 10,
                 "durationMs": 95000, "finishedAt": "2026-11-09T12:00:00Z" } ] }
```

**Rate limiting (Should):** limite simples por IP em memória/edge, por exemplo 30 req/min em `/answers` e 5 req/min em `/submit`.

### 7.5 Estrutura de pastas sugerida
```
.
├─ app/
│  ├─ page.tsx                 # Home
│  ├─ quiz/page.tsx            # Rodada (client component)
│  ├─ resultado/[roundId]/page.tsx
│  ├─ ranking/page.tsx
│  ├─ api/
│  │  ├─ rounds/route.ts
│  │  ├─ rounds/[roundId]/answers/route.ts
│  │  ├─ rounds/[roundId]/result/route.ts
│  │  ├─ rounds/[roundId]/submit/route.ts
│  │  └─ leaderboard/route.ts
│  └─ layout.tsx
├─ components/                 # QuestionCard, AnswerButtons, Feedback, ProgressBar, LeaderboardTable...
├─ lib/
│  ├─ questions.ts             # carga + schema Zod (server-only)
│  ├─ sampling.ts              # sorteio 4/3/3 + equilíbrio V/F (função pura)
│  ├─ scoring.ts               # tier, byLevel, comparação "rodada melhor" (funções puras)
│  ├─ supabase.ts              # client server-only
│  ├─ validation.ts            # schemas Zod de request
│  └─ profanity.ts
├─ data/questions.json
├─ scripts/validate-questions.ts
├─ supabase/migrations/
├─ tests/unit/  tests/e2e/
├─ .env.example
└─ README.md
```

### 7.6 Variáveis de ambiente (`.env.example`)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=   # nunca expor ao cliente (sem prefixo NEXT_PUBLIC_)
```

---

## 8. Design e UI
- Visual limpo, focado na afirmação; um card central por pergunta
- Cores de nível: Iniciante (verde), Intermediário (âmbar), Avançado (roxo), sempre com rótulo de texto
- Feedback: acerto com ✓ e "Correto!", erro com ✗ e "Não foi dessa vez". Uma animação curta (≤ 300 ms) respeitando `prefers-reduced-motion`
- Tipografia legível (≥ 18px na afirmação no mobile), botões V/F com área de toque ≥ 48px
- Sem marca ou logo da Anthropic. Usar a identidade da Jornada de Dados se disponível, ou um visual neutro

---

## 9. Qualidade e testes
**Unidade (Vitest):**
- `sampling`: sempre 4/3/3, sem duplicatas, ordem por nível, ≤ 7 respostas iguais
- `scoring`: faixas de tier, `byLevel`, comparação de rodada melhor (acertos, depois tempo)
- Schemas Zod de request e do banco de perguntas
- `validate-questions`: falha com IDs duplicados ou poucos itens por nível

**API (Vitest com Supabase local ou mock):**
- Fluxo completo; erros 409 (fora de ordem, repetida, rodada fechada); 422 no submit
- A resposta de `POST /api/rounds` **não contém** `answer` nem `explanation`

**E2E (Playwright):**
- Home → 10 respostas por teclado → resultado → envio → aparece no ranking
- Viewport mobile (375px) sem scroll horizontal

**CI:** `lint`, `typecheck`, `test`, `validate:questions` em cada push (GitHub Actions)

---

## 10. Critérios de aceite (MVP)
1. Uma rodada tem 10 perguntas: as 4 primeiras de nível Iniciante, as 3 seguintes Intermediário e as 3 últimas Avançado
2. Depois de cada resposta aparecem acerto/erro, explicação e link "Saiba mais" funcional
3. Inspecionando a rede, não se descobre o gabarito antes de responder
4. A tela final mostra acertos, tempo, classificação, resumo por nível e revisão completa
5. O aluno entra no ranking com apelido + e-mail + consentimento; o e-mail não aparece em nenhuma resposta pública
6. Repetir o quiz com o mesmo e-mail só melhora a posição se o resultado for melhor
7. Todo o fluxo funciona só com teclado e em tela de 375px
8. O banco tem ≥ 60 perguntas válidas (20 por nível), conferidas na documentação oficial
9. `npm run lint`, `typecheck`, `test` e `validate:questions` passam

---

## 11. Plano de entrega (marcos)
| Marco | Entregas |
|-------|----------|
| M1: Fundação | Setup Next.js + TS + Tailwind + ESLint/Prettier + Vitest; schema Zod; `questions.json` com as 8 perguntas semente; `sampling` e `scoring` com testes |
| M2: Fluxo do quiz | Migrações Supabase; APIs `rounds`, `answers`, `result`; telas Home, Quiz e Resultado |
| M3: Ranking | APIs `submit` e `leaderboard`; tela de Ranking; consentimento/privacidade; filtro de apelido; rate limit |
| M4: Conteúdo | 60 perguntas revisadas na documentação oficial; `validate:questions` no CI |
| M5: Polimento e deploy | Acessibilidade, tema escuro, E2E Playwright, deploy Vercel + Supabase, README |

---

## 12. Decisões do brainstorm
| Tema | Decisão |
|------|---------|
| Público | Alunos da trilha Claude Code da Jornada de Dados |
| Formato | Verdadeiro ou Falso |
| Dificuldade | Progressiva, distribuição 4/3/3 |
| Rodada | 10 perguntas, sem timer |
| Feedback | Imediato, com explicação e link para a documentação |
| Escopo de conteúdo | Claude Code + Claude geral |
| Banco inicial | ~60 perguntas (20 por nível) |
| Engajamento | Ranking entre alunos |
| Identificação | Apelido + e-mail (com consentimento LGPD) |
| Stack | Next.js + Tailwind + Supabase |
| **Assumido (não discutido)** | 1 ponto por acerto, desempate por tempo; deploy Vercel; PT-BR; validação de respostas no servidor |

## 13. Questões em aberto
- Usar a identidade visual (logo/cores) da Jornada de Dados? Quem fornece os assets?
- Quem revisa o conteúdo das 60 perguntas antes da publicação (instrutor)?
- O ranking deve ser **por turma**, com reset periódico, ou global e permanente?
- A Jornada quer usar os e-mails para comunicação? Se sim, o texto de consentimento precisa de um opt-in separado.
- Domínio próprio ou subdomínio `*.vercel.app`?
