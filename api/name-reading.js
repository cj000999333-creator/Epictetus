// api/name-reading.js
// Standalone endpoint for the post-intake Name Reading.
// COMPLETELY SEPARATE from Epictetus. Never rides the session or intake prompt,
// so it can never turn the teacher into a horoscope.
//
// One Haiku call. Returns strict JSON:
//   - If the name has a real, traceable root: the etymology.
//   - If not: an honest "no clear root" line + three classical virtue-names to choose from.
// Saves nothing. Display only. (Saving an alias is a separate call: api/save-alias.js)
//
// DB NOTE: for the alias feature you must add two columns to the `users` table
// in Supabase (one time):
//   alias          text
//   alias_meaning  text
// This file does not write them. api/save-alias.js does.

import { createClient } from "@supabase/supabase-js";

const NAME_READING_PROMPT = `You are a careful etymologist and scholar of the classical world. You are NOT Epictetus. You do not teach, scold, or philosophize. You give accurate information about names, plainly.

You will be given a single first name. Do ONE of two things.

BRANCH 1 — the name has a real, traceable meaning.
If the name has a genuine, documented origin (Greek, Latin, Hebrew, or another well-attested tradition), give it. State the language of origin, the root, and the literal meaning. Be accurate. Do NOT invent, romanticize, or inflate. No "destined for greatness," no fortune-telling. Just the true meaning, in two or three sentences.

BRANCH 2 — the name has no clear or reliable meaning.
If the name is modern, invented, ambiguous, or you cannot vouch for a real root, DO NOT guess. Say plainly that the name has no clear traceable meaning. Then offer three classical virtue-names, each with its real meaning, as names the person might CHOOSE to grow toward. Draw from genuine Greek/Latin virtue terms, for example: Andreas (courage), Sophia (wisdom), Sophrosyne (self-command / temperance), Arete (excellence of character), Ataraxia (tranquility), Prohairesis (the reasoned choice), Kartería (endurance). Pick three that are real and correctly defined.

Output ONLY valid JSON, no markdown, no code fences, no commentary. Exactly this shape:

{
  "has_meaning": boolean,
  "origin": string or null,
  "meaning": string or null,
  "options": [ { "name": string, "meaning": string }, ... ] or null
}

Rules:
- If has_meaning is true: fill origin and meaning; set options to null.
- If has_meaning is false: set origin and meaning to null; fill options with exactly three {name, meaning} objects.
- meaning must be accurate and plain. Never invent a root you are unsure of.
- Do not address the person. Do not teach. Just the reading.

Output the JSON object only.`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization" });
    }
    const userJwt = authHeader.replace("Bearer ", "");

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "Server not configured" });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      global: { headers: { Authorization: `Bearer ${userJwt}` } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser(userJwt);
    if (userErr || !userData?.user) {
      return res.status(401).json({ error: "Invalid session" });
    }
    const userId = userData.user.id;

    // Get the name from the saved profile (captured during intake).
    // Allow an override in the body in case the front end wants to pass it directly.
    let name = (req.body && req.body.name) ? String(req.body.name).trim() : null;

    if (!name) {
      const { data: profile, error: profileErr } = await supabase
        .from("users")
        .select("name")
        .eq("id", userId)
        .single();
      if (profileErr) {
        return res.status(500).json({ error: "Could not load profile", details: profileErr.message });
      }
      name = profile?.name ? String(profile.name).trim() : null;
    }

    if (!name || name.length < 1 || name.length > 40) {
      return res.status(400).json({ error: "No usable name found" });
    }

    // Single Haiku call — cheap, this is not voice work.
    const readingRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: NAME_READING_PROMPT,
        messages: [{ role: "user", content: `Name: ${name}` }],
      }),
    });

    if (!readingRes.ok) {
      const errText = await readingRes.text();
      return res.status(readingRes.status).json({
        error: "Anthropic error (name-reading)",
        details: errText,
      });
    }

    const readingData = await readingRes.json();
    const readingText = readingData.content?.[0]?.text || "";
    const cleaned = readingText.replace(/```json|```/g, "").trim();

    let reading;
    try {
      reading = JSON.parse(cleaned);
    } catch (e) {
      console.error("Name-reading JSON parse failed:", readingText);
      return res.status(502).json({ error: "Could not read the name" });
    }

    // Basic shape guard so the front end always gets something sane.
    const safe = {
      name,
      has_meaning: reading.has_meaning === true,
      origin: reading.origin ?? null,
      meaning: reading.meaning ?? null,
      options: Array.isArray(reading.options) ? reading.options.slice(0, 3) : null,
    };

    return res.status(200).json(safe);
  } catch (err) {
    console.error("Name-reading handler crashed:", err);
    return res.status(500).json({ error: err.message });
  }
}
