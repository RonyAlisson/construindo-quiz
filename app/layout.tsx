import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { PrivacyDialog } from "@/components/PrivacyDialog";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Quiz Claude Code", template: "%s · Quiz Claude Code" },
  description:
    "10 perguntas de Verdadeiro ou Falso sobre Claude Code, do básico ao avançado. Para alunos da Jornada de Dados.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#conteudo"
          className="sr-only rounded bg-indigo-700 px-3 py-2 text-white focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
        >
          Pular para o conteúdo
        </a>
        <header className="border-b border-border">
          <nav
            aria-label="Principal"
            className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-4 py-3"
          >
            <Link
              href="/"
              className="rounded font-semibold tracking-tight focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              Quiz Claude Code
            </Link>
            <Link
              href="/ranking"
              className="rounded text-sm text-muted underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              Ranking
            </Link>
          </nav>
        </header>
        <main id="conteudo" className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-border">
          <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-sm text-muted">
            <span>Jornada de Dados · Trilha Claude Code</span>
            <PrivacyDialog />
          </div>
        </footer>
      </body>
    </html>
  );
}
