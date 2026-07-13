// api/_lib/citation-modes.js
// Two behavior modes for how Epictetus treats the retrieved passages.
//
// Used by voice-test.js, and later by session-chat.js, sunday-letter.js, etc.
//
// The passages are ALWAYS retrieved and injected — the difference is what
// the model is told to do with them.

/**
 * Format retrieved passages plus a citation instruction, based on cite mode.
 *
 * @param {Array} passages - Retrieved passages from retrieval.js
 * @param {boolean} citeMode - true = allow citations, false = silent influence only
 * @returns {string} - Block to prepend to the system prompt
 */
export function buildRetrievalBlock(passages, citeMode) {
  if (!passages || passages.length === 0) return "";

  const passagesFormatted = passages.map(p => {
    return `[${p.reference}]\n${p.text}`;
  }).join("\n\n---\n\n");

  if (citeMode) {
    return `RELEVANT SOURCE PASSAGES — your own words and those of your teachers, retrieved for this student's question:

${passagesFormatted}

END OF SOURCE PASSAGES.

CITATION RULES

You may cite from these passages when it strengthens the teaching. When you cite, name the reference in brackets, like [Discourses II.5] or [Meditations 4.3]. Keep quotes brief — under 20 words. Prefer one strong quote to two competing ones. Never invent citations beyond what is shown above.

`;
  }

   // Silent mode: passages inform reasoning but the model must not quote or cite
  return `RELEVANT SOURCE PASSAGES — your own words and those of your teachers, retrieved for this student's question. These are for your own reasoning only. The student cannot see them and must never learn they exist.

${passagesFormatted}

END OF SOURCE PASSAGES.

SILENT-MODE RULES — ABSOLUTE

You are FORBIDDEN from citing in this mode. This is not a preference. It is a hard rule with no exceptions.

Specifically, you must NEVER:
- Write a reference in parentheses, e.g. "(Discourses 1.1)" — FORBIDDEN
- Write a reference in brackets, e.g. "[Meditations 4.3]" — FORBIDDEN
- Name a work and a number, e.g. "as I say in Discourses one" — FORBIDDEN
- Say "as I wrote" or "as it is written" or "in my Discourses" — FORBIDDEN
- Attribute a line to Seneca, Marcus, Cicero, Plato, or any named source — FORBIDDEN
- Quote a passage word-for-word in a way that reads as recitation — FORBIDDEN

If you catch yourself about to name a source or number, STOP and rewrite the sentence so the idea stands on its own, in your own voice.

The passages are fuel for your thinking. They are invisible to the student. A teacher who has truly absorbed his tradition does not footnote himself in conversation. Speak as that teacher — the ideas fully yours, the sources dissolved into your own understanding.

`;