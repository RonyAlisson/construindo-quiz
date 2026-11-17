import type { LeaderboardEntry } from "@/lib/rounds";
import { ROUND_SIZE } from "@/lib/sampling";
import { formatDuration } from "@/lib/scoring";

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

export function LeaderboardTable({
  entries,
  highlightPosition,
}: {
  entries: LeaderboardEntry[];
  highlightPosition?: number;
}) {
  if (entries.length === 0) {
    return <p className="text-muted">Ninguém entrou no ranking ainda. Seja a primeira pessoa!</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-left text-sm sm:text-base">
        <caption className="sr-only">
          Top {entries.length} do ranking, ordenado por acertos e depois pelo menor tempo
        </caption>
        <thead className="border-b border-border text-xs text-muted uppercase">
          <tr>
            <th scope="col" className="px-3 py-3">
              #
            </th>
            <th scope="col" className="px-3 py-3">
              Apelido
            </th>
            <th scope="col" className="px-3 py-3 text-right">
              Acertos
            </th>
            <th scope="col" className="px-3 py-3 text-right">
              Tempo
            </th>
            <th scope="col" className="hidden px-3 py-3 text-right sm:table-cell">
              Data
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const mine = entry.position === highlightPosition;
            return (
              <tr
                key={entry.position}
                aria-current={mine ? "true" : undefined}
                className={`border-b border-border last:border-b-0 ${
                  mine ? "bg-indigo-100 font-semibold dark:bg-indigo-950" : ""
                }`}
              >
                <td className="px-3 py-3 font-mono">{entry.position}</td>
                <td className="max-w-[10rem] truncate px-3 py-3">
                  {entry.nickname}
                  {mine && (
                    <span className="ml-2 text-xs text-indigo-800 dark:text-indigo-200">
                      (você)
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-right font-mono">
                  {entry.correctCount}/{ROUND_SIZE}
                </td>
                <td className="px-3 py-3 text-right font-mono">
                  {formatDuration(entry.durationMs)}
                </td>
                <td className="hidden px-3 py-3 text-right sm:table-cell">
                  {entry.finishedAt ? dateFormat.format(new Date(entry.finishedAt)) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
