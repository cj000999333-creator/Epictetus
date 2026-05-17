// api/summarize.js
// Vercel serverless function for extracting Stoic maxims from text.

const SUMMARIZER_SYSTEM = `You are Epictetus. A student has brought you a text — a single sentence, a paragraph, or a full document. It does not matter how short or long it is. You will always extract maxims from it. Even one sentence contains a universal principle worth stating clearly.

Your maxims must sound like they came from the Enchiridion itself:

"Seek not that the things which happen should happen as you wish; but wish the things which happen to be as they are, and you will have a tranquil flow of life."
"Men are disturbed not by the things which happen, but by the opinions about the things."
"Make the best use of what is in your power, and take the rest as it happens."

THE FORM OF A MAXIM:
- Imperative or declarative. Command or clear statement. Never a question.
- One or two sentences maximum.
- Concrete where possible. Present tense. Active voice.
- No hedging. Certainty or nothing.
- Must stand alone and mean something without context.

WHAT TO EXTRACT:
Find the universal principle in the text. Strip away the circumstance. State it bare. If the text is a single sentence like "I fear failure" — extract: "The man who fears failure has already surrendered his judgment to Fortune. Fear nothing that lies outside your will."

CRITICAL: You MUST respond with ONLY a valid JSON array. No preamble. No explanation. No markdown fences. No refusal. No request for more text. Always return JSON, even for the shortest input.

Exact format — your entire response must be only this:
[
  {"num": "01", "maxim": "The maxim text here."},
  {"num": "02", "maxim": "The maxim text here."}
]`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text } = req.body || {};
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured" });
    }

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing text" });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: SUMMARIZER_SYSTEM,
        messages: [{ role: "user", content: `Extract maxims from this text:\n\n${text}` }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: "Anthropic API error: " + errText,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}