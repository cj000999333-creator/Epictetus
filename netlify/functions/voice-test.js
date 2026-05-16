// netlify/functions/voice-test.js
// Server-side handler for the voice test harness.
// Calls the Anthropic API with the provided system prompt and conversation.

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { password, systemPrompt, messages, model } = body;

    const REQUIRED_PASSWORD = process.env.VOICE_TEST_PASSWORD;
    if (!REQUIRED_PASSWORD || password !== REQUIRED_PASSWORD) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    if (!systemPrompt || typeof systemPrompt !== "string") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing systemPrompt" }),
      };
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing messages array" }),
      };
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
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "API key not configured on server" }),
      };
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
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: "Anthropic API error",
          details: errorText,
        }),
      };
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || "(empty response)";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply,
        model: selectedModel,
        usage: data.usage,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};