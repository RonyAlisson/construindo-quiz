"use client";

import { useRef } from "react";

// Contato para pedidos de exclusão de dados. Placeholder até a Jornada definir o canal oficial.
export const PRIVACY_CONTACT = "o suporte da Jornada de Dados";

export function PrivacyDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded underline underline-offset-4 hover:text-foreground focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
      >
        Privacidade
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="privacidade-titulo"
        onClose={() => openerRef.current?.focus()}
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface p-6 text-foreground shadow-xl backdrop:bg-slate-950/60"
      >
        <h2 id="privacidade-titulo" className="text-lg font-semibold">
          Privacidade
        </h2>
        <div className="mt-3 space-y-3 text-sm text-muted">
          <p>
            Para jogar não é preciso se identificar. Só pedimos dados se você quiser entrar no
            ranking.
          </p>
          <p>
            <strong className="text-foreground">Apelido:</strong> aparece no ranking público.
          </p>
          <p>
            <strong className="text-foreground">E-mail:</strong> fica guardado pela Jornada de Dados
            apenas para identificar sua pontuação, evitando registros duplicados. Ele nunca aparece
            no site nem é devolvido por nenhuma página.
          </p>
          <p>
            Para pedir a exclusão dos seus dados, fale com {PRIVACY_CONTACT} informando o e-mail
            usado.
          </p>
        </div>
        <form method="dialog" className="mt-5 flex justify-end">
          <button
            type="submit"
            autoFocus
            className="min-h-11 rounded-lg bg-indigo-700 px-4 font-semibold text-white hover:bg-indigo-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:bg-indigo-500 dark:text-slate-950"
          >
            Fechar
          </button>
        </form>
      </dialog>
    </>
  );
}
