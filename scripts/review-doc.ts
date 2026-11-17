// Gera docs/revisao-perguntas.md: tabela para o instrutor revisar o banco de perguntas.
// Uso: npm run docs:revisao
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { LEVEL_LABELS, LEVELS, questionBankSchema } from "../lib/question-schema";

const root = new URL("../", import.meta.url);
const bank = questionBankSchema.parse(
  JSON.parse(readFileSync(fileURLToPath(new URL("data/questions.json", root)), "utf8")),
);

const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\n/g, " ");

const lines: string[] = [
  "# Revisão das perguntas",
  "",
  "Gerado por `npm run docs:revisao` a partir de `data/questions.json`. Não edite à mão: corrija o JSON e gere de novo.",
  "",
  `Total: ${bank.length} perguntas. Cada afirmação foi conferida na documentação oficial na data de \`reviewedAt\`; os trechos que sustentam as 44 perguntas do M4 estão em [m4-verificacao.md](m4-verificacao.md).`,
  "",
  "Para revisar: leia a afirmação e a explicação, abra a fonte se tiver dúvida e marque a coluna **OK** (ou anote o problema).",
  "",
];

for (const level of LEVELS) {
  const items = bank.filter((q) => q.level === level);
  const trues = items.filter((q) => q.answer).length;
  lines.push(
    `## ${LEVEL_LABELS[level]} (${items.length} perguntas: ${trues} V / ${items.length - trues} F)`,
    "",
    "| OK | id | Afirmação | Gabarito | Explicação | Fonte | Revisado em |",
    "|----|----|-----------|----------|------------|-------|-------------|",
  );
  for (const q of items) {
    const source = q.sourceUrl.replace(/^https:\/\//, "");
    lines.push(
      `| [ ] | \`${q.id}\` | ${cell(q.statement)} | **${q.answer ? "V" : "F"}** | ${cell(q.explanation)} | [${cell(source)}](${q.sourceUrl}) | ${q.reviewedAt} |`,
    );
  }
  lines.push("");
}

const out = fileURLToPath(new URL("docs/revisao-perguntas.md", root));
writeFileSync(out, lines.join("\n"));
console.log(`Gerado ${out} (${bank.length} perguntas)`);
