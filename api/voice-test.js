import { retrievePassages, formatPassagesForPrompt } from "./_lib/retrieval.js";

// api/voice-test.js
// Vercel serverless function for the voice test harness.
// Calls the Anthropic API with the provided system prompt and conversation.

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
    const { password, systemPrompt, messages, model } = req.body || {};

    const REQUIRED_PASSWORD = process.env.VOICE_TEST_PASSWORD;
    if (!REQUIRED_PASSWORD || password !== REQUIRED_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!systemPrompt || typeof systemPrompt !== "string") {
      return res.status(400).json({ error: "Missing systemPrompt" });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Missing messages array" });
    }

    const modelMap = {
      "opus-4.7": "claude-opus-4-7",
      "opus-4.6": "claude-opus-4-6",
      "sonnet-4.6": "claude-sonnet-4-6",
      "haiku-4.5": "claude-haiku-4-5-20251001",
    };
    const selectedModel = modelMap[model] || "claude-opus-4-7";

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured on server" });
    }

// RAG: retrieve passages using the LAST user message
    let retrievalBlock = "";
    try {
      const lastUser = messages[messages.length - 1];
      if (lastUser && lastUser.role === "user" && lastUser.content && lastUser.content.length > 3) {
        const passages = await retrievePassages(lastUser.content, 5);
        retrievalBlock = formatPassagesForPrompt(passages);
        console.log(`voice-test: Retrieved ${passages.length} passages`);
      }
    } catch (err) {
      console.error("voice-test retrieval failed:", err.message);
    }
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: selectedModel,
        max_tokens: 2000,
        system: retrievalBlock + systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: "Anthropic API error",
        details: errorText,
      });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || "(empty response)";

    return res.status(200).json({
      reply,
      model: selectedModel,
      usage: data.usage,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}