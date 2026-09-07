/** Extract and gate the "What we know" brief. Hard news only. */

const SKIP_DESKS = new Set([
  "opinion",
  "opinions",
  "lifestyle",
  "gossip",
  "entertainment",
  "showbiz",
  "celebrity",
]);

const NEWS_DESKS = new Set(["news", "politics", "business"]);

const KNOW_HEADING = /(?:^|\n)#{2,3}\s*What we know:?\s*\n+/i;
const EXPLAINER_TITLE = /^(why|how|opinion)\b/i;
const FIRST_PERSON = /^(i |we are |i spent |we live |we treat |we think )/i;

export type KnowExtract = {
  facts: string[];
  body: string;
};

function cleanFact(raw: string): string {
  let fact = raw.replace(/^[-*+]\s+/, "").trim();
  fact = fact.replace(/^#{1,6}\s+/, "").trim();
  fact = fact.replace(/\s+/g, " ").replace(/^[:.\-–—]\s*/, "");
  return fact;
}

function isRealFact(fact: string): boolean {
  if (fact.length < 22) return false;
  if (/[.!?]"?$/.test(fact)) return true;
  if (/\d/.test(fact) && fact.length >= 28) return true;
  return fact.length >= 80;
}

export function extractWhatWeKnow(markdown: string): KnowExtract {
  if (!markdown) return { facts: [], body: markdown || "" };
  const match = markdown.match(KNOW_HEADING);
  if (!match || match.index == null) return { facts: [], body: markdown };

  const blockStart = match.index;
  const rest = markdown.slice(blockStart + match[0].length);
  const lines = rest.split("\n");
  const facts: string[] = [];
  let lineCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const stripped = lines[i].trim();
    if (!stripped) {
      const peek = lines.slice(i + 1).find((l) => l.trim());
      if (peek && /^#{2,3}\s+/.test(peek.trim()) && !/what we know/i.test(peek)) {
        lineCount = i;
        break;
      }
      lineCount = i + 1;
      continue;
    }
    if (/^#{2,3}\s+/.test(stripped) && !/what we know/i.test(stripped)) {
      lineCount = i;
      break;
    }
    if (/^[-*+]/.test(stripped)) {
      const fact = cleanFact(stripped);
      if (isRealFact(fact)) facts.push(fact);
      lineCount = i + 1;
      continue;
    }
    lineCount = i;
    break;
  }

  const consumedText = lines.slice(0, lineCount).join("\n");
  const after = rest.slice(consumedText.length).replace(/^\n+/, "");
  const before = markdown.slice(0, blockStart).trim();
  const body = [before, after.trim()].filter(Boolean).join("\n\n");
  return { facts: facts.slice(0, 5), body };
}

export function shouldShowWhatWeKnow(opts: {
  category?: string;
  title?: string;
  facts: string[];
}): boolean {
  const facts = (opts.facts || []).map((f) => f.trim()).filter((f) => f.length >= 18);
  if (facts.length < 2) return false;

  const cat = (opts.category || "").toLowerCase().trim();
  if (SKIP_DESKS.has(cat)) return false;
  if (!NEWS_DESKS.has(cat)) return false;

  const title = opts.title || "";
  if (EXPLAINER_TITLE.test(title.trim())) return false;

  const firstPerson = facts.filter((f) => FIRST_PERSON.test(f)).length;
  if (firstPerson >= 2) return false;

  const headingLike = facts.filter((f) => f.length < 48 && !/[.!?]$/.test(f)).length;
  if (headingLike === facts.length) return false;

  return true;
}

export function splitLedeHtml(html: string): { lede: string; rest: string } {
  const match = html.match(/^(<p[\s\S]*?<\/p>)([\s\S]*)$/i);
  if (!match) return { lede: html, rest: "" };
  return { lede: match[1], rest: match[2] };
}
