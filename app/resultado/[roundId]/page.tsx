import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ResultSummary } from "@/components/ResultSummary";
import { ReviewList } from "@/components/ReviewList";
import { SubmitForm } from "@/components/SubmitForm";
import { buttonClass } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { getResult, type RoundResult } from "@/lib/rounds";
import { roundIdSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Resultado" };

export default function ResultPage({ params }: PageProps<"/resultado/[roundId]">) {
  return (
    <Suspense
      fallback={
        <p role="status" className="text-muted">
          Calculando seu resultado…
        </p>
      }
    >
      <Result params={params} />
    </Suspense>
  );
}

async function Result({ params }: { params: PageProps<"/resultado/[roundId]">["params"] }) {
  const { roundId } = await params;
  if (!roundIdSchema.safeParse(roundId).success) notFound();

  let result: RoundResult;
  try {
    result = await getResult(roundId);
  } catch (error) {
    if (error instanceof ApiError && error.code === "ROUND_NOT_FOUND") notFound();
    if (error instanceof ApiError) {
      return (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Resultado indisponível</h1>
          <p className="text-muted">Essa rodada ainda não terminou ou não está mais disponível.</p>
          <Link href="/quiz" className={buttonClass()}>
            Começar uma nova rodada
          </Link>
        </div>
      );
    }
    throw error;
  }

  return (
    <div className="flex flex-col gap-8">
      <ResultSummary result={result} />

      {result.status === "finished" ? (
        <SubmitForm roundId={result.roundId} />
      ) : (
        <p className="rounded-xl border border-border bg-surface p-4">
          Este resultado já foi enviado ao ranking.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/quiz" className={buttonClass("secondary")}>
          Jogar de novo
        </Link>
        <Link href="/ranking" className={buttonClass("secondary")}>
          Ver ranking
        </Link>
      </div>

      <ReviewList items={result.review} />
    </div>
  );
}
