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
  return `RELEVANT SOURCE PASSAGES — your own words and those of your teachers, retrieved for this student's question. These are for your own reasoning only. The student cannot see them.

${passagesFormatted}

END OF SOURCE PASSAGES.

SILENT-MODE RULES

Do not quote these passages. Do not cite them. Do not name the reference. Do not paraphrase them with the give-away formality of a scholar. The student does not want a library. He wants a teacher.

Let the passages sharpen what you say — your images, your questions, your emphasis — but speak in your own voice, as if you had internalized these teachings so completely you no longer need to point at them.

`;
}