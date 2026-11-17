import Link from "next/link";
import { buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-4">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="text-muted">O endereço pode estar errado, ou essa rodada não existe mais.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/quiz" className={buttonClass()}>
          Começar uma rodada
        </Link>
        <Link href="/" className={buttonClass("secondary")}>
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
