// api/_lib/retrieval.js
// Retrieval helper for RAG. Given a user message, returns the top-N most
// semantically similar passages from the corpus table.
//
// Used by intake-chat.js and future session-chat.js.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const EMBED_MODEL = "text-embedding-3-small";

/**
 * Embed a piece of text with OpenAI. Returns Float32 vector as a JS array.
 */
async function embedQuery(text) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embedding failed: ${err}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}

/**
 * Given a user message, return the top-N most similar corpus passages.
 *
 * @param {string} userMessage - The student's message
 * @param {number} topN - How many passages to return (default 5)
 * @returns {Array<{id, source, work, reference, text, similarity}>}
 */
export async function retrievePassages(userMessage, topN = 5) {
  if (!userMessage || userMessage.trim().length < 3) return [];

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. Embed the user's message
  const queryEmbedding = await embedQuery(userMessage);

  // 2. Query Supabase for nearest neighbors using cosine distance
  const { data, error } = await supabase.rpc("match_corpus", {
    query_embedding: queryEmbedding,
    match_count: topN,
  });

  if (error) {
    console.error("Retrieval error:", error);
    return [];
  }

  return data || [];
}

/**
 * Format retrieved passages as a system-prompt injection block.
 * The block is prepended to the voice prompt so the model sees the
 * source material before responding.
 */
export function formatPassagesForPrompt(passages) {
  if (!passages || passages.length === 0) return "";

  const blocks = passages.map((p, i) => {
    return `[${p.reference}]\n${p.text}`;
  }).join("\n\n---\n\n");

  return `RELEVANT SOURCE PASSAGES — your own words and those of your teachers, drawn from the corpus for this student's question. Consult them. Draw from them when they fit. Cite by reference. Do not invent passages beyond what is shown here.

${blocks}

END OF SOURCE PASSAGES.

`;
}