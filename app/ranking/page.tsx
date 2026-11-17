import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { buttonClass } from "@/components/ui";
import { getLeaderboard } from "@/lib/rounds";

export const metadata: Metadata = { title: "Ranking" };

const TOP = 20;

export default function RankingPage({ searchParams }: PageProps<"/ranking">) {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Ranking</h1>
        <p className="text-muted">
          A melhor rodada de cada aluno. Empate em acertos é decidido pelo menor tempo.
        </p>
      </div>
      <Suspense
        fallback={
          <p role="status" className="text-muted">
            Carregando o ranking…
          </p>
        }
      >
        <Ranking searchParams={searchParams} />
      </Suspense>
      <Link href="/quiz" className={buttonClass()}>
        Jogar uma rodada
      </Link>
    </div>
  );
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function Ranking({ searchParams }: { searchParams: PageProps<"/ranking">["searchParams"] }) {
  const params = await searchParams;
  const position = Number.parseInt(single(params.pos) ?? "", 10);
  const myPosition = Number.isInteger(position) && position > 0 ? position : undefined;
  const nickname = single(params.apelido)?.slice(0, 20);
  const improved = single(params.melhorou);

  const entries = await getLeaderboard(TOP);

  return (
    <>
      {myPosition && (
        <div
          role="status"
          className="rounded-xl border border-indigo-300 bg-indigo-50 p-4 dark:border-indigo-700 dark:bg-indigo-950"
        >
          <p className="font-semibold">
            {nickname ? `${nickname}, sua` : "Sua"} posição: {myPosition}º
          </p>
          {improved === "0" && (
            <p className="text-sm text-muted">
              Essa rodada não superou sua melhor marca, então o ranking manteve a anterior.
            </p>
          )}
          {myPosition > TOP && (
            <p className="text-sm text-muted">
              Você está fora do top {TOP}. Jogue de novo para subir!
            </p>
          )}
        </div>
      )}
      <LeaderboardTable entries={entries} highlightPosition={myPosition} />
    </>
  );
}
