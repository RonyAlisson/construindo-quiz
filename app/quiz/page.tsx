import type { Metadata } from "next";
import { QuizRunner } from "@/components/QuizRunner";

export const metadata: Metadata = { title: "Rodada" };

export default function QuizPage() {
  return <QuizRunner />;
}
