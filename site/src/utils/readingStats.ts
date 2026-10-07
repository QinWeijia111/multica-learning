export interface ReadingStats {
  proseUnits: number;
  codeLines: number;
  minutes: number;
}

/**
 * Deterministic technical-reading estimate: Chinese characters and English word
 * tokens count as prose units; non-empty fenced-code lines count separately.
 * Reading time uses 250 prose units/minute plus 10 code lines/minute.
 */
export function calculateReadingStats(source: string): ReadingStats {
  let codeLines = 0;

  const prose = source.replace(/^(?: {0,3})(`{3,}|~{3,})[^\n]*\n([\s\S]*?)^(?: {0,3})\1\s*$/gm, (_match, _fence, code: string) => {
    codeLines += code.split('\n').filter((line) => line.trim().length > 0).length;
    return ' ';
  });

  const plainText = prose
    .replace(/^---[\s\S]*?---\s*/u, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!?(?:\[([^\]]*)\])\([^)]*\)/g, '$1')
    .replace(/[`*_>#|~-]/g, ' ')
    .replace(/&(?:[a-z]+|#\d+);/gi, ' ');

  const chineseCharacters = plainText.match(/\p{Script=Han}/gu)?.length ?? 0;
  const englishWords = plainText.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0;
  const proseUnits = chineseCharacters + englishWords;
  const minutes = Math.max(1, Math.ceil(proseUnits / 250 + codeLines / 10));

  return { proseUnits, codeLines, minutes };
}
