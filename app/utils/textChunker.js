/**
 * Purpose: Split long review text into smaller overlapping chunks for RAG.
 *
 * Why: Vector search works best when it retrieves specific passages, not entire documents.
 * We keep this dependency-free and deterministic (KISS) and reuse it for both
 * single-review sync and bulk sync (DRY).
 */

/**
 * Split text into sentence-ish units.
 * This is intentionally simple: we prefer a stable heuristic over heavy NLP deps (YAGNI).
 */
function splitIntoSentences(text) {
  const cleaned = String(text || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return [];

  // Split on sentence boundaries while keeping it robust for short/odd punctuation.
  const parts = cleaned.split(/(?<=[.!?])\s+/g);
  return parts.map((p) => p.trim()).filter(Boolean);
}

/**
 * Chunk text into overlapping chunks by character budget.
 *
 * @param {string} text
 * @param {object} [opts]
 * @param {number} [opts.maxChunkChars] - Target max size per chunk.
 * @param {number} [opts.overlapSentences] - How many sentences to overlap between chunks.
 * @returns {string[]} chunks (non-empty)
 */
export function chunkText(
  text,
  { maxChunkChars = 1200, overlapSentences = 2 } = {}
) {
  const sentences = splitIntoSentences(text);
  if (sentences.length === 0) return [];

  const chunks = [];
  let current = [];
  let currentLen = 0;

  const flush = () => {
    const chunk = current.join(" ").trim();
    if (chunk) chunks.push(chunk);
  };

  for (let i = 0; i < sentences.length; i += 1) {
    const s = sentences[i];

    // If a single sentence is too long, hard-split it into pieces.
    if (s.length > maxChunkChars) {
      // Flush current first.
      if (current.length) {
        flush();
        current = [];
        currentLen = 0;
      }

      for (let j = 0; j < s.length; j += maxChunkChars) {
        const piece = s.slice(j, j + maxChunkChars).trim();
        if (piece) chunks.push(piece);
      }
      continue;
    }

    const nextLen = currentLen + (current.length ? 1 : 0) + s.length;
    if (nextLen <= maxChunkChars) {
      current.push(s);
      currentLen = nextLen;
      continue;
    }

    // Flush current chunk and start a new one with overlap.
    flush();

    const overlap =
      overlapSentences > 0 ? current.slice(-overlapSentences) : [];

    current = [...overlap, s];
    currentLen = current.reduce((sum, part, idx) => {
      return sum + part.length + (idx === 0 ? 0 : 1);
    }, 0);
  }

  flush();
  return chunks;
}

