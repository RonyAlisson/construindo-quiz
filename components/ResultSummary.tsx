import { LEVEL_LABELS, LEVELS } from "@/lib/question-schema";
import type { RoundResult } from "@/lib/rounds";
import { formatDuration } from "@/lib/scoring";
import { LEVEL_BADGE_CLASSES } from "./ui";

export function ResultSummary({ result }: { result: RoundResult }) {
  return (
    <section aria-labelledby="resultado-titulo" className="space-y-5">
      <div className="space-y-2">
        <h1 id="resultado-titulo" className="text-3xl font-bold tracking-tight">
          {result.correctCount}/{result.totalQuestions} acertos
        </h1>
        <p className="text-lg">
          Sua classificação: <strong>{result.tier}</strong>
        </p>
        <p className="text-muted">
          Tempo total: <span className="font-mono">{formatDuration(result.durationMs)}</span>
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        {LEVELS.map((level) => {
          const [correct, total] = result.byLevel[level];
          return (
            <div key={level} className={`rounded-lg p-3 ${LEVEL_BADGE_CLASSES[level]}`}>
              <dt className="text-xs font-semibold">{LEVEL_LABELS[level]}</dt>
              <dd className="text-xl font-bold">
                {correct}/{total}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
