-- Schema base do quiz (PRD 7.3) + funções atômicas para responder e enviar ao ranking.
-- Todo acesso passa pelas rotas da API com a chave service_role. anon/authenticated não leem nada.

create table public.players (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique check (email = lower(btrim(email)) and email <> ''),
  nickname      text not null check (char_length(nickname) between 3 and 20),
  consent_at    timestamptz not null,
  best_round_id uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.rounds (
  id            uuid primary key default gen_random_uuid(),
  question_ids  text[] not null check (cardinality(question_ids) between 1 and 50),
  answers       jsonb not null default '[]'::jsonb,
  correct_count int not null default 0,
  status        text not null default 'in_progress'
                check (status in ('in_progress', 'finished', 'submitted', 'abandoned')),
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  duration_ms   int,
  player_id     uuid references public.players (id),
  created_at    timestamptz not null default now()
);

alter table public.players
  add constraint players_best_round_fk foreign key (best_round_id) references public.rounds (id);

create index rounds_status_idx on public.rounds (status);
create index rounds_player_idx on public.rounds (player_id);
create index players_best_round_idx on public.players (best_round_id);

alter table public.players enable row level security;
alter table public.rounds enable row level security;
-- Sem políticas: RLS ativo e nenhuma política = anon/authenticated não acessam linhas.

-- Ranking: melhor rodada de cada jogador. Nunca inclui o e-mail.
-- A ordenação é a mesma de isBetterRound (lib/scoring.ts): acertos desc, tempo asc, término asc.
create view public.leaderboard as
select
  row_number() over (
    order by r.correct_count desc, r.duration_ms asc, r.finished_at asc, p.id
  )::int as position,
  p.nickname,
  r.correct_count,
  r.duration_ms,
  r.finished_at
from public.players p
join public.rounds r on r.id = p.best_round_id;

-- Views ignoram o RLS das tabelas de origem; sem estes revokes o PostgREST expõe o ranking
-- (e as tabelas, pelos privilégios padrão do Supabase) para quem tiver a chave anon.
revoke all on public.players, public.rounds, public.leaderboard from anon, authenticated;

-- Responde a próxima pergunta da rodada de forma atômica.
-- `p_correct` é calculado pela rota com o gabarito de data/questions.json.
-- Retorna {answeredCount, finished, correctCount} ou {error: código}.
create function public.answer_question(
  p_round_id    uuid,
  p_question_id text,
  p_answer      boolean,
  p_correct     boolean
) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  r          public.rounds%rowtype;
  answered   int;
  total      int;
  is_last    boolean;
  ts         timestamptz := now();
begin
  select * into r from public.rounds where id = p_round_id for update;
  if not found then
    return jsonb_build_object('error', 'ROUND_NOT_FOUND');
  end if;

  if r.status <> 'in_progress' then
    return jsonb_build_object('error', 'ROUND_CLOSED');
  end if;

  if exists (
    select 1 from jsonb_array_elements(r.answers) a where a ->> 'questionId' = p_question_id
  ) then
    return jsonb_build_object('error', 'ALREADY_ANSWERED');
  end if;

  answered := jsonb_array_length(r.answers);
  total := cardinality(r.question_ids);
  if r.question_ids[answered + 1] is distinct from p_question_id then
    return jsonb_build_object('error', 'OUT_OF_ORDER');
  end if;

  is_last := answered + 1 >= total;

  update public.rounds set
    answers = answers || jsonb_build_array(jsonb_build_object(
      'questionId', p_question_id,
      'answer', p_answer,
      'correct', p_correct,
      'answeredAt', ts
    )),
    correct_count = correct_count + case when p_correct then 1 else 0 end,
    status = case when is_last then 'finished' else status end,
    finished_at = case when is_last then ts else finished_at end,
    duration_ms = case
      when is_last then floor(extract(epoch from (ts - started_at)) * 1000)::int
      else duration_ms
    end
  where id = p_round_id
  returning * into r;

  return jsonb_build_object(
    'answeredCount', answered + 1,
    'finished', is_last,
    'correctCount', r.correct_count
  );
end;
$$;

-- Envia uma rodada finalizada ao ranking. Um registro por e-mail; best_round_id só muda se a
-- nova rodada for melhor. O apelido é sempre o da última submissão.
-- Retorna {improved, position} ou {error: código}.
create function public.submit_round(
  p_round_id uuid,
  p_email    text,
  p_nickname text
) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  r         public.rounds%rowtype;
  best      public.rounds%rowtype;
  v_player  public.players%rowtype;
  improved  boolean;
  pos       int;
  v_email   text := lower(btrim(p_email));
begin
  select * into r from public.rounds where id = p_round_id for update;
  if not found then
    return jsonb_build_object('error', 'ROUND_NOT_FOUND');
  end if;
  if r.status = 'in_progress' then
    return jsonb_build_object('error', 'ROUND_NOT_FINISHED');
  end if;
  if r.status <> 'finished' then
    return jsonb_build_object('error', 'ROUND_CLOSED');
  end if;

  insert into public.players (email, nickname, consent_at)
  values (v_email, p_nickname, now())
  on conflict (email) do update
    set nickname = excluded.nickname,
        consent_at = excluded.consent_at,
        updated_at = now()
  returning * into v_player;

  -- Serializa envios concorrentes do mesmo jogador.
  select * into v_player from public.players where id = v_player.id for update;

  if v_player.best_round_id is null then
    improved := true;
  else
    select * into best from public.rounds where id = v_player.best_round_id;
    -- Mesma regra de isBetterRound (lib/scoring.ts).
    improved :=
      r.correct_count > best.correct_count
      or (r.correct_count = best.correct_count and r.duration_ms < best.duration_ms)
      or (r.correct_count = best.correct_count and r.duration_ms = best.duration_ms
          and r.finished_at < best.finished_at);
  end if;

  if improved then
    update public.players set best_round_id = r.id where id = v_player.id;
  end if;

  update public.rounds set status = 'submitted', player_id = v_player.id where id = r.id;

  select ranked.position into pos
  from (
    select p.id,
           row_number() over (
             order by br.correct_count desc, br.duration_ms asc, br.finished_at asc, p.id
           )::int as position
    from public.players p
    join public.rounds br on br.id = p.best_round_id
  ) ranked
  where ranked.id = v_player.id;

  return jsonb_build_object('improved', improved, 'position', pos);
end;
$$;

-- Funções nascem executáveis por PUBLIC; só a service_role pode chamá-las.
revoke execute on function public.answer_question(uuid, text, boolean, boolean)
  from public, anon, authenticated;
revoke execute on function public.submit_round(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.answer_question(uuid, text, boolean, boolean) to service_role;
grant execute on function public.submit_round(uuid, text, text) to service_role;
