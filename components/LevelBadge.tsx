import { LEVEL_LABELS, type Level } from "@/lib/question-schema";
import { LEVEL_BADGE_CLASSES } from "./ui";

export function LevelBadge({ level }: { level: Level }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${LEVEL_BADGE_CLASSES[level]}`}
    >
      <span className="sr-only">Nível: </span>
      {LEVEL_LABELS[level]}
    </span>
  );
}
