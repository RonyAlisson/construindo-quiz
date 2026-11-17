import type { ReviewItem } from "@/lib/rounds";
import { LevelBadge } from "./LevelBadge";
import { LINK_CLASS } from "./ui";

const label = (value: boolean | null) =>
  value === null ? "sem resposta" : value ? "Verdadeiro" : "Falso";

export function ReviewList({ items }: { items: ReviewItem[] }) {
  return (
    <section aria-labelledby="revisao-titulo" className="space-y-4">
      <h2 id="revisao-titulo" className="text-xl font-semibold">
        Revisão das perguntas
      </h2>
      <ol className="space-y-3">
        {items.map((item, index) => (
          <li
            key={item.id}
            className={`space-y-2 rounded-xl border-l-4 border-y border-r border-border bg-surface p-4 ${
              item.correct
                ? "border-l-emerald-600 dark:border-l-emerald-400"
                : "border-l-rose-600 dark:border-l-rose-400"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">{index + 1}.</span>
              <LevelBadge level={item.level} />
              <span
                className={`font-semibold ${
                  item.correct
                    ? "text-emerald-800 dark:text-emerald-300"
                    : "text-rose-800 dark:text-rose-300"
                }`}
              >
                {item.correct ? "✓ Acertou" : "✗ Errou"}
              </span>
            </div>
            <p className="font-medium">{item.statement}</p>
            <p className="text-sm text-muted">
              Sua resposta: <strong>{label(item.yourAnswer)}</strong> · Resposta certa:{" "}
              <strong>{label(item.correctAnswer)}</strong>
            </p>
            <details className="text-sm">
              <summary className="cursor-pointer rounded font-medium focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none">
                Ver explicação
              </summary>
              <p className="mt-2 leading-relaxed">{item.explanation}</p>
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-2 inline-block ${LINK_CLASS}`}
              >
                Saiba mais<span className="sr-only"> (abre em nova aba)</span>
              </a>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}
