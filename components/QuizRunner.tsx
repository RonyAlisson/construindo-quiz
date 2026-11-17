"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicQuestion } from "@/lib/question-schema";
import type { AnswerResult, CreatedRound } from "@/lib/rounds";
import { LevelBadge } from "./LevelBadge";
import { ProgressBar } from "./ProgressBar";
import { buttonClass, LINK_CLASS } from "./ui";

type State =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | {
      phase: "playing";
      roundId: string;
      questions: PublicQuestion[];
      index: number;
      pending: boolean;
      chosen: boolean | null;
      feedback: AnswerResult | null;
      answerError: string | null;
    };

type ApiErrorBody = { error?: { code?: string; message?: string } };

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return body.error?.message ?? `Erro ${response.status}`;
  } catch {
    return `Erro ${response.status}`;
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function QuizRunner() {
  const router = useRouter();
  const [state, setState] = useState<State>({ phase: "loading" });
  const started = useRef(false);
  const statementRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const startRound = useCallback(async () => {
    setState({ phase: "loading" });
    try {
      const response = await fetch("/api/rounds", { method: "POST" });
      if (!response.ok) throw new Error(await readError(response));
      const round = (await response.json()) as CreatedRound;
      setState({
        phase: "playing",
        roundId: round.roundId,
        questions: round.questions,
        index: 0,
        pending: false,
        chosen: null,
        feedback: null,
        answerError: null,
      });
    } catch (error) {
      setState({
        phase: "error",
        message: error instanceof Error ? error.message : "Não foi possível começar a rodada.",
      });
    }
  }, []);

  // Recarregar a página reinicia a rodada (PRD 3.2): o roundId vive só em memória.
  useEffect(() => {
    if (started.current) return; // evita rodada dupla no StrictMode do dev
    started.current = true;
    void startRound();
  }, [startRound]);

  const playing = state.phase === "playing" ? state : null;
  const question = playing?.questions[playing.index];
  const isLast = playing ? playing.index === playing.questions.length - 1 : false;

  const answer = useCallback(
    async (value: boolean) => {
      if (!playing || !question || playing.pending || playing.feedback) return;
      setState({ ...playing, pending: true, chosen: value, answerError: null });
      try {
        const response = await fetch(`/api/rounds/${playing.roundId}/answers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: question.id, answer: value }),
        });
        if (!response.ok) throw new Error(await readError(response));
        const feedback = (await response.json()) as AnswerResult;
        setState((current) =>
          current.phase === "playing" ? { ...current, pending: false, feedback } : current,
        );
      } catch (error) {
        setState((current) =>
          current.phase === "playing"
            ? {
                ...current,
                pending: false,
                chosen: null,
                answerError:
                  error instanceof Error ? error.message : "Não foi possível enviar a resposta.",
              }
            : current,
        );
      }
    },
    [playing, question],
  );

  const next = useCallback(() => {
    if (!playing?.feedback) return;
    if (isLast) {
      router.push(`/resultado/${playing.roundId}`);
      return;
    }
    setState({
      ...playing,
      index: playing.index + 1,
      chosen: null,
      feedback: null,
      answerError: null,
    });
  }, [playing, isLast, router]);

  // Foco: nova pergunta → afirmação; feedback → botão "Próxima".
  useEffect(() => {
    if (playing && !playing.feedback) statementRef.current?.focus();
  }, [playing?.index, playing?.feedback]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (playing?.feedback) nextRef.current?.focus();
  }, [playing?.feedback]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (!playing?.feedback && (key === "v" || key === "f")) {
        event.preventDefault();
        void answer(key === "v");
      } else if (playing?.feedback && key === "enter" && event.target === document.body) {
        // Com foco no botão "Próxima", o Enter nativo do botão já avança.
        event.preventDefault();
        next();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [playing?.feedback, answer, next]);

  if (state.phase === "loading") {
    return (
      <p role="status" className="text-muted">
        Sorteando as perguntas…
      </p>
    );
  }

  if (state.phase === "error" || !playing || !question) {
    return (
      <div role="alert" className="space-y-4">
        <p className="font-medium">Não foi possível começar a rodada.</p>
        {state.phase === "error" && <p className="text-sm text-muted">{state.message}</p>}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => void startRound()} className={buttonClass()}>
            Tentar de novo
          </button>
          <Link href="/" className={buttonClass("secondary")}>
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  const { feedback, chosen, pending } = playing;

  return (
    <div className="flex flex-col gap-6">
      <ProgressBar current={playing.index + 1} total={playing.questions.length} />

      <section
        aria-labelledby="afirmacao"
        className="space-y-4 rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6"
      >
        <LevelBadge level={question.level} />
        <h1
          id="afirmacao"
          ref={statementRef}
          tabIndex={-1}
          className="text-lg leading-relaxed font-semibold text-balance focus:outline-none sm:text-xl"
        >
          {question.statement}
        </h1>
      </section>

      <div role="group" aria-label="Sua resposta" className="grid grid-cols-2 gap-3">
        {[true, false].map((value) => {
          const label = value ? "Verdadeiro" : "Falso";
          const selected = chosen === value;
          const isRight = feedback && feedback.correctAnswer === value;
          let tone = "border-border bg-surface hover:bg-slate-100 dark:hover:bg-slate-800";
          if (feedback && isRight) {
            tone =
              "border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-100";
          } else if (feedback && selected) {
            tone =
              "border-rose-600 bg-rose-50 text-rose-900 dark:border-rose-400 dark:bg-rose-950 dark:text-rose-100";
          } else if (selected) {
            tone = "border-indigo-600 bg-indigo-50 dark:bg-indigo-950";
          }
          return (
            <button
              key={label}
              type="button"
              onClick={() => void answer(value)}
              disabled={pending || Boolean(feedback)}
              aria-pressed={selected}
              aria-keyshortcuts={value ? "V" : "F"}
              className={`flex min-h-16 flex-col items-center justify-center rounded-xl border-2 px-3 py-3 text-lg font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:cursor-default ${tone}`}
            >
              <span>
                {feedback && isRight ? "✓ " : feedback && selected ? "✗ " : ""}
                {label}
              </span>
              <kbd className="mt-1 font-mono text-xs font-normal opacity-70">
                {value ? "V" : "F"}
              </kbd>
            </button>
          );
        })}
      </div>

      <div aria-live="polite" aria-atomic="true">
        {pending && <p className="text-sm text-muted">Conferindo…</p>}
        {playing.answerError && (
          <p role="alert" className="text-sm font-medium text-rose-700 dark:text-rose-300">
            {playing.answerError} Tente responder de novo.
          </p>
        )}
        {feedback && (
          <div
            className={`space-y-3 rounded-xl border-2 p-5 motion-safe:animate-pop-in ${
              feedback.correct
                ? "border-emerald-600 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950"
                : "border-rose-600 bg-rose-50 dark:border-rose-400 dark:bg-rose-950"
            }`}
          >
            <p
              className={`text-lg font-bold ${
                feedback.correct
                  ? "text-emerald-900 dark:text-emerald-100"
                  : "text-rose-900 dark:text-rose-100"
              }`}
            >
              {feedback.correct ? "✓ Correto!" : "✗ Não foi dessa vez"}
            </p>
            <p className="leading-relaxed">{feedback.explanation}</p>
            <a
              href={feedback.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASS}
            >
              Saiba mais na documentação
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          </div>
        )}
      </div>

      {feedback && (
        <button ref={nextRef} type="button" onClick={next} className={buttonClass()}>
          {isLast ? "Ver resultado" : "Próxima"}
        </button>
      )}
    </div>
  );
}
