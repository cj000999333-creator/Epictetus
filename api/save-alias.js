// api/save-alias.js
// Saves the student's alias choices. NO AI call — just a DB write.
// Called from welcome.html in up to two steps:
//   1. { alias, alias_meaning }        -> when they take a name
//   2. { alias_preferred: "alias"|"name" } -> when they choose how to be addressed
// Any subset of fields may be sent; only the provided ones are written.
//
// DB NOTE (one time, in Supabase) — add to the `users` table:
//   alias            text
//   alias_meaning    text
//   alias_preferred  text

import { createClient } from "@supabase/supabase-js";

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
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
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

    const body = req.body || {};
    const updates = {};

    if (body.alias !== undefined && body.alias !== null) {
      const alias = String(body.alias).trim();
      if (alias.length < 1 || alias.length > 40) {
        return res.status(400).json({ error: "Invalid alias" });
      }
      updates.alias = alias;
    }

    if (body.alias_meaning !== undefined && body.alias_meaning !== null) {
      updates.alias_meaning = String(body.alias_meaning).trim();
    }

    if (body.alias_preferred !== undefined && body.alias_preferred !== null) {
      const pref = String(body.alias_preferred).trim();
      if (pref !== "alias" && pref !== "name") {
        return res.status(400).json({ error: "Invalid preference" });
      }
      updates.alias_preferred = pref;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nothing to save" });
    }

    const { error: updateErr } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId);

    if (updateErr) {
      return res.status(500).json({ error: "Could not save", details: updateErr.message });
    }

    return res.status(200).json({ ok: true, saved: updates });
  } catch (err) {
    console.error("save-alias handler crashed:", err);
    return res.status(500).json({ error: err.message });
  }
}
