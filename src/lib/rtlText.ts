/**
 * Helpers for cleaning up right-to-left (Arabic, Hebrew, Persian, Urdu) text
 * that has been extracted from PDFs.
 *
 * PDF text extraction often returns Arabic as isolated "presentation forms"
 * (U+FB50–U+FDFF and U+FE70–U+FEFF) laid out in *visual* order, which makes the
 * letters appear disconnected and the words reversed when rendered as HTML.
 * Normalising to the base Unicode letters (NFKC) restores correct shaping, and
 * reversing the visually-ordered runs restores logical order.
 */

const PRESENTATION_FORMS = /[\uFB50-\uFDFF\uFE70-\uFEFF]/;
const RTL_CHAR = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
// Marks that must stay attached to the preceding base letter when reversing.
const COMBINING_MARK = /[\u064B-\u065F\u0670\u06D6-\u06ED\u0610-\u061A\u05B0-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/;

export function containsRtl(text: string): boolean {
  return RTL_CHAR.test(text);
}

/** Reverse a string while keeping combining marks attached to their base char. */
function reverseGraphemes(text: string): string {
  const clusters: string[] = [];
  for (const char of Array.from(text)) {
    if (clusters.length > 0 && COMBINING_MARK.test(char)) {
      clusters[clusters.length - 1] += char;
    } else {
      clusters.push(char);
    }
  }
  return clusters.reverse().join('');
}

/** Mirror bracket-like characters when flipping a visual-order run. */
const MIRRORED: Record<string, string> = {
  '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{',
  '<': '>', '>': '<', '«': '»', '»': '«',
};

function mirror(text: string): string {
  return text.replace(/[()[\]{}<>«»]/g, (c) => MIRRORED[c] ?? c);
}

/**
 * Normalise a single line of extracted text.
 * Only lines that came in as presentation forms are treated as visual order.
 */
function normalizeLine(line: string): string {
  if (!PRESENTATION_FORMS.test(line)) {
    // Still normalise so any stray ligature forms become base letters.
    return containsRtl(line) ? line.normalize('NFKC') : line;
  }

  const normalized = line.normalize('NFKC');

  // Split into RTL runs and non-RTL runs, reverse each RTL run, then reverse
  // the run order so the whole line reads in logical order.
  const runs: { rtl: boolean; text: string }[] = [];
  for (const char of Array.from(normalized)) {
    const isRtl = RTL_CHAR.test(char) || COMBINING_MARK.test(char);
    const last = runs[runs.length - 1];
    if (last && (last.rtl === isRtl || (isRtl && COMBINING_MARK.test(char) && last.rtl))) {
      last.text += char;
    } else {
      runs.push({ rtl: isRtl, text: char });
    }
  }

  return runs
    .reverse()
    .map((run) => (run.rtl ? reverseGraphemes(run.text) : mirror(reverseGraphemes(run.text))))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clean up text extracted from a PDF so Arabic (and other RTL scripts) render
 * correctly. Latin-only text is returned untouched.
 */
export function normalizeExtractedText(text: string): string {
  if (!text || !containsRtl(text)) return text;
  return text
    .split('\n')
    .map((line) => normalizeLine(line))
    .join('\n');
}
