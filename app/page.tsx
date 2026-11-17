import Link from "next/link";
import { buttonClass } from "@/components/ui";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-8">
      <div className="space-y-4">
        <p className="text-sm font-medium tracking-wide text-indigo-700 uppercase dark:text-indigo-300">
          Verdadeiro ou Falso
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Quanto você sabe sobre o Claude Code?
        </h1>
        <p className="text-lg text-muted">
          10 perguntas de Verdadeiro ou Falso, do básico ao avançado. Depois de cada resposta, uma
          explicação curta e o link para a documentação oficial.
        </p>
      </div>

      <ul className="grid gap-3 text-sm sm:grid-cols-3">
        <li className="rounded-lg border border-border bg-surface p-3">
          <strong className="block text-emerald-800 dark:text-emerald-300">4 Iniciante</strong>
          <span className="text-muted">Conceitos e negócio</span>
        </li>
        <li className="rounded-lg border border-border bg-surface p-3">
          <strong className="block text-amber-800 dark:text-amber-300">3 Intermediário</strong>
          <span className="text-muted">Uso no dia a dia</span>
        </li>
        <li className="rounded-lg border border-border bg-surface p-3">
          <strong className="block text-violet-800 dark:text-violet-300">3 Avançado</strong>
          <span className="text-muted">Extensões e automação</span>
        </li>
      </ul>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/quiz" className={buttonClass("primary")}>
          Começar
        </Link>
        <Link href="/ranking" className={buttonClass("secondary")}>
          Ver ranking
        </Link>
      </div>

      <p className="text-sm text-muted">
        Sem limite de tempo. Use as teclas <kbd className="font-mono">V</kbd> e{" "}
        <kbd className="font-mono">F</kbd> para responder e <kbd className="font-mono">Enter</kbd>{" "}
        para avançar.
      </p>
    </div>
  );
}
