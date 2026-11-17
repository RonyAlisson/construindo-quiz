export function ProgressBar({ current, total }: { current: number; total: number }) {
  const percent = Math.round((current / total) * 100);
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted">
        Pergunta {current} de {total}
      </p>
      <div
        role="progressbar"
        aria-label="Progresso da rodada"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={`Pergunta ${current} de ${total}`}
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
      >
        <div
          className="h-full rounded-full bg-indigo-600 transition-[width] duration-300 motion-reduce:transition-none dark:bg-indigo-400"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
