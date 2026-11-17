"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import type { SubmitResult } from "@/lib/rounds";
import { NICKNAME_MAX, submitRequestSchema } from "@/lib/validation";
import { buttonClass } from "./ui";

export const CONSENT_TEXT =
  "Concordo que meu apelido apareça no ranking público e que meu e-mail seja armazenado pela Jornada de Dados apenas para identificar minha pontuação.";

type FieldErrors = Partial<Record<"nickname" | "email" | "consent" | "_", string>>;

function firstErrors(fields: Record<string, string[] | undefined>): FieldErrors {
  const errors: FieldErrors = {};
  for (const [key, messages] of Object.entries(fields)) {
    if (messages?.[0]) errors[key as keyof FieldErrors] = messages[0];
  }
  return errors;
}

export function SubmitForm({ roundId }: { roundId: string }) {
  const router = useRouter();
  const id = useId();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sending, setSending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = submitRequestSchema.safeParse({ nickname, email, consent });
    if (!parsed.success) {
      const fields: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        (fields[String(issue.path[0] ?? "_")] ??= []).push(issue.message);
      }
      setErrors(firstErrors(fields));
      return;
    }

    setErrors({});
    setSending(true);
    try {
      const response = await fetch(`/api/rounds/${roundId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: { message?: string; fields?: Record<string, string[]> };
        };
        setErrors(
          body.error?.fields
            ? firstErrors(body.error.fields)
            : { _: body.error?.message ?? "Não foi possível enviar." },
        );
        return;
      }
      const result = (await response.json()) as SubmitResult;
      const params = new URLSearchParams({
        pos: String(result.position),
        apelido: parsed.data.nickname,
        melhorou: result.improved ? "1" : "0",
      });
      router.push(`/ranking?${params}`);
    } catch {
      setErrors({ _: "Sem conexão. Tente de novo." });
    } finally {
      setSending(false);
    }
  }

  const fieldClass =
    "block w-full rounded-lg border border-border bg-surface px-3 py-3 text-base focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none aria-invalid:border-rose-600";

  return (
    <section
      aria-labelledby={`${id}-titulo`}
      className="space-y-4 rounded-xl border border-border bg-surface p-5"
    >
      <h2 id={`${id}-titulo`} className="text-xl font-semibold">
        Entrar no ranking
      </h2>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="space-y-1">
          <label htmlFor={`${id}-apelido`} className="block font-medium">
            Apelido
          </label>
          <input
            id={`${id}-apelido`}
            name="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={NICKNAME_MAX}
            autoComplete="nickname"
            aria-invalid={Boolean(errors.nickname)}
            aria-describedby={`${id}-apelido-ajuda${errors.nickname ? ` ${id}-apelido-erro` : ""}`}
            className={fieldClass}
          />
          <p id={`${id}-apelido-ajuda`} className="text-sm text-muted">
            De 3 a 20 caracteres. Aparece no ranking público.
          </p>
          {errors.nickname && (
            <p
              id={`${id}-apelido-erro`}
              className="text-sm font-medium text-rose-700 dark:text-rose-300"
            >
              {errors.nickname}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor={`${id}-email`} className="block font-medium">
            E-mail
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={`${id}-email-ajuda${errors.email ? ` ${id}-email-erro` : ""}`}
            className={fieldClass}
          />
          <p id={`${id}-email-ajuda`} className="text-sm text-muted">
            Não aparece no ranking. Serve para guardar sua melhor pontuação.
          </p>
          {errors.email && (
            <p
              id={`${id}-email-erro`}
              className="text-sm font-medium text-rose-700 dark:text-rose-300"
            >
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? `${id}-consent-erro` : undefined}
              className="mt-1 size-5 shrink-0 accent-indigo-700"
            />
            <span className="text-sm leading-relaxed">{CONSENT_TEXT}</span>
          </label>
          {errors.consent && (
            <p
              id={`${id}-consent-erro`}
              className="text-sm font-medium text-rose-700 dark:text-rose-300"
            >
              {errors.consent}
            </p>
          )}
        </div>

        {errors._ && (
          <p role="alert" className="text-sm font-medium text-rose-700 dark:text-rose-300">
            {errors._}
          </p>
        )}

        <button type="submit" disabled={sending} className={`w-full ${buttonClass()}`}>
          {sending ? "Enviando…" : "Enviar ao ranking"}
        </button>
      </form>
    </section>
  );
}
