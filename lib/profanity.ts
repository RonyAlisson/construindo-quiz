// Filtro simples de palavrões para apelidos do ranking (PT-BR e EN).
// Normaliza acentos e leetspeak (0→o, 1→i, 3→e, 4→a, 5→s, 7→t, @→a, $→s).
// Para evitar falsos positivos ("computador", "desviado"), palavras curtas só contam no começo
// de cada parte do apelido (separadas por espaço, _ ou -); palavras com 6+ letras contam em
// qualquer posição do apelido inteiro.

const BLOCKED_WORDS = [
  // PT-BR
  "porra",
  "caralho",
  "buceta",
  "puta",
  "merda",
  "cuzao",
  "foder",
  "fodase",
  "viado",
  "arrombado",
  "piroca",
  "xoxota",
  "babaca",
  "otario",
  "vagabund",
  "corno",
  // EN
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "dick",
  "asshole",
  "pussy",
  "nigger",
  "faggot",
  "whore",
];

const ANYWHERE_MIN_LENGTH = 6;

const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
};

export function normalizeForProfanity(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[013457@$]/g, (ch) => LEET[ch] ?? ch)
    .replace(/[^a-z]/g, "");
}

export function containsProfanity(text: string): boolean {
  const parts = text
    .split(/[\s_-]+/)
    .map(normalizeForProfanity)
    .filter(Boolean);
  const whole = parts.join("");
  return BLOCKED_WORDS.some(
    (word) =>
      parts.some((part) => part.startsWith(word)) ||
      (word.length >= ANYWHERE_MIN_LENGTH && whole.includes(word)),
  );
}
