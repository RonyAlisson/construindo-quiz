// Uso: npm run validate:questions [-- --strict]
// --strict exige a meta do MVP (20 por nível) e o equilíbrio V/F; é o modo do CI.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { validateBank } from "../lib/validate-bank";

const strict = process.argv.includes("--strict");
const file = fileURLToPath(new URL("../data/questions.json", import.meta.url));

let raw: unknown;
try {
  raw = JSON.parse(readFileSync(file, "utf8"));
} catch (error) {
  console.error(`Não foi possível ler data/questions.json: ${(error as Error).message}`);
  process.exit(1);
}

const { errors, warnings, counts } = validateBank(raw, { strict });

console.log(`Banco de perguntas${strict ? " (modo --strict)" : ""}:`);
for (const [level, { total, trues }] of Object.entries(counts)) {
  console.log(
    `  ${level.padEnd(14)} ${String(total).padStart(3)} perguntas  (${trues} V / ${total - trues} F)`,
  );
}
for (const warning of warnings) console.warn(`  aviso: ${warning}`);
for (const error of errors) console.error(`  erro:  ${error}`);

if (errors.length > 0) {
  console.error(`\n${errors.length} erro(s).`);
  process.exit(1);
}
console.log("\nOK");
