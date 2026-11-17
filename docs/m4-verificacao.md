# M4 — Log de verificação das perguntas novas

As 44 perguntas foram escritas num rascunho e depois juntadas a `data/questions.json`. Revisão feita em 2026-11-16 contra a documentação oficial (páginas baixadas em Markdown e URLs canônicas conferidas com HTTP 200).

| id | gabarito | sourceUrl | trecho de apoio |
|----|----------|-----------|-----------------|
| claude-geral-004 | V | https://platform.claude.com/docs/en/models/overview | "All current models support text and image input, text output, multilingual capabilities, vision, and tool use." |
| claude-geral-005 | F | https://platform.claude.com/docs/en/intro | "All current models support text and image input, text output, multilingual capabilities, vision, and tool use." |
| claude-geral-006 | V | https://platform.claude.com/docs/en/about-claude/glossary | "Tokens are the smallest individual units of a language model, and can correspond to words, subwords, characters" |
| claude-geral-007 | F | https://platform.claude.com/docs/en/models/overview | "Reliable knowledge cutoff: The date through which the model's knowledge is most extensive and reliable." |
| claude-geral-008 | V | https://platform.claude.com/docs/en/about-claude/glossary | "Claude ... is based on a large language model that has been fine-tuned and trained using RLHF." |
| claude-geral-009 | F | https://platform.claude.com/docs/en/about-claude/glossary | "This is different from the large corpus of data the language model was trained on" |
| fundamentos-005 | V | https://code.claude.com/docs/en/overview | "With MCP, Claude Code can read your design docs in Google Drive, update tickets in Jira, pull data from Slack" |
| fundamentos-006 | F | https://code.claude.com/docs/en/setup | "You can run Claude Code natively on Windows or inside WSL." |
| fundamentos-007 | V | https://code.claude.com/docs/en/mobile | "Start, monitor, and steer Claude Code tasks from your phone with the Claude app for iOS and Android." |
| fundamentos-008 | F | https://code.claude.com/docs/en/how-claude-code-works | "Claude can read code in any language, understand how components connect" |
| fundamentos-009 | V | https://code.claude.com/docs/en/overview | "writing tests for untested code, fixing lint errors across a project, resolving merge conflicts, ... writing release notes." |
| fundamentos-010 | F | https://code.claude.com/docs/en/claude-code-on-the-web | "The session keeps running after you close your laptop, and you can check on it or steer it from any device." |
| uso-diario-005 | V | https://code.claude.com/docs/en/checkpointing | "Claude Code automatically tracks Claude's file edits as you work." |
| uso-diario-006 | F | https://code.claude.com/docs/en/sessions | "`claude --continue` — Reopens the most recent session in the current directory" |
| uso-diario-007 | V | https://code.claude.com/docs/en/permission-modes | "Deny rules block in every mode, including `bypassPermissions`." |
| uso-diario-008 | F | https://code.claude.com/docs/en/how-claude-code-works | "Actions that affect remote systems (databases, APIs, deployments) can't be checkpointed." |
| uso-diario-009 | V | https://code.claude.com/docs/en/memory | "User instructions — `~/.claude/CLAUDE.md` — Personal preferences for all projects" |
| uso-diario-010 | F | https://code.claude.com/docs/en/memory | "Claude treats them as context, not enforced configuration." |
| uso-diario-011 | V | https://code.claude.com/docs/en/commands | "`/context` — Visualize current context usage as a colored grid." |
| uso-diario-012 | F | https://code.claude.com/docs/en/permission-modes | "These still prompt: ... All other Bash commands except the built-in read-only set" |
| extensibilidade-004 | V | https://code.claude.com/docs/en/skills | "Create a `SKILL.md` file with instructions, and Claude adds it to its toolkit. Claude uses skills when relevant" |
| extensibilidade-005 | F | https://code.claude.com/docs/en/skills | "skill descriptions are loaded into context ... but full skill content only loads when invoked." |
| extensibilidade-006 | V | https://code.claude.com/docs/en/plugins/overview | "A Claude Code plugin is a directory of skills, agents, hooks, MCP servers, or other components" |
| extensibilidade-007 | F | https://code.claude.com/docs/en/mcp | "you can add any remote server listed there with `claude mcp add`." |
| extensibilidade-008 | V | https://code.claude.com/docs/en/settings | "You, in this one project only. Claude Code keeps it out of git when it creates the file" |
| extensibilidade-009 | F | https://code.claude.com/docs/en/settings | "Settings precedence, highest first: managed settings, command line, project local, shared project, user." |
| claude-geral-010 | V | https://platform.claude.com/docs/en/build-with-claude/working-with-messages | "The Messages API is stateless, which means that you always send the full conversational history to the API." |
| claude-geral-011 | F | https://platform.claude.com/docs/en/build-with-claude/context-windows | "As token count grows, accuracy and recall degrade, a phenomenon known as context rot." |
| claude-geral-012 | V | https://platform.claude.com/docs/en/about-claude/glossary | "Even with temperature set to 0, the results will not be fully deterministic" |
| extensibilidade-010 | F | https://code.claude.com/docs/en/hooks | "`PreToolUse` — Before a tool call executes. Can block it" |
| extensibilidade-011 | V | https://code.claude.com/docs/en/sub-agents | "To restrict tools, use the `tools` field as an allowlist or the `disallowedTools` field as a denylist." |
| extensibilidade-012 | F | https://code.claude.com/docs/en/hooks | "the shell command, HTTP endpoint, MCP tool, LLM prompt, or agent that runs ... There are five types" |
| extensibilidade-013 | V | https://code.claude.com/docs/en/skills | "Add `disable-model-invocation: true` to prevent Claude from triggering it automatically." |
| extensibilidade-014 | F | https://code.claude.com/docs/en/mcp | "Local scope is the default. ... Claude Code stores it in `~/.claude.json` under that project's path" |
| avancado-003 | V | https://code.claude.com/docs/en/headless | "To get output conforming to a specific schema, use `--output-format json` with `--json-schema`" |
| avancado-004 | F | https://code.claude.com/docs/en/agent-sdk/overview | "the same tools, agent loop, and context management that power Claude Code, programmable in Python and TypeScript." |
| avancado-005 | V | https://code.claude.com/docs/en/github-actions | "Mention `@claude` in a pull request or issue comment to have Claude analyze code, implement changes, and push commits." |
| avancado-006 | F | https://code.claude.com/docs/en/sandboxing | "macOS: sandboxing uses the built-in Seatbelt framework" / "Linux and WSL2: the sandbox relies on `bubblewrap`" |
| avancado-007 | V | https://code.claude.com/docs/en/managed-settings | "Claude Code applies them above every other level, so no user, project, local, or `--settings` value overrides them" |
| avancado-008 | F | https://code.claude.com/docs/en/worktrees | "the worktree is created under `.claude/worktrees/<name>/` ... on a new branch named `worktree-<name>`" |
| avancado-009 | V | https://code.claude.com/docs/en/headless | "Use `--allowedTools` to let Claude use certain tools without prompting." |
| avancado-010 | F | https://code.claude.com/docs/en/headless | "Use `--continue` to continue the most recent conversation, or `--resume` with a session ID" |
| avancado-011 | V | https://code.claude.com/docs/en/sub-agents | "Set to `worktree` to run the subagent in a temporary git worktree, giving it an isolated copy of the repository" |
| avancado-012 | F | https://code.claude.com/docs/en/permission-modes | "If you set `dontAsk` mode, Claude Code auto-denies every tool call that would otherwise prompt you" |

## Observações

- **Mudanças recentes na documentação que afetam o banco:** subagents agora **podem** criar subagents aninhados (por padrão até três níveis), e o modo de permissão inicial padrão passou a ser `auto` (o antigo `default` aparece como "Manual"). Por isso evitei perguntas sobre aninhamento de subagents e sobre "qual é o modo padrão".
- **URL de modelos:** `https://platform.claude.com/docs/en/about-claude/models/overview` (usada em `claude-geral-001`) responde **307** e redireciona para a canônica `https://platform.claude.com/docs/en/models/overview`, que é a usada nas perguntas novas.
