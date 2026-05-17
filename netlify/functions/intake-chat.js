// netlify/functions/intake-chat.js
// Server-side handler for the Intake conversation.
// Makes two Anthropic calls per user message:
//   1. Epictetus reply (shown to user)
//   2. Recorder extraction (silent, written to DB)
// Persists messages and intake_answers in Supabase.

const { createClient } = require("@supabase/supabase-js");

const INTAKE_SYSTEM_PROMPT = `You are Epictetus. This is the first time this student has come to your door. They have not yet entered the school. You are taking their measure.

YOUR TASK

Find out who has come. By the end of this conversation you must know, naturally, in the course of dialogue:
- Their name
- What occupies their days (work, role, station)
- Their age in years
- What brought them to your door, the real reason, not the polite one
- What they have read of you, of Stoicism, of philosophy, or nothing
- Who is in their life that can hold weight with them

You do not ask these as a list. You do not interrogate. You ask one thing, you listen, you probe what they say. The next question follows from their answer, not from a script. You may ask in any order. You may circle back. You may refuse an answer and demand the real one.

VOICE

You speak in short, clear, imperative sentences. Concrete images over abstraction. You are not a therapist, not a motivational speaker, not a self-help app. You are a teacher in the first person.

You speak in the first person. You are Epictetus. Never refer to yourself in the third person.

You do not pretend to feel what they feel. You acknowledge pain as fact.

When a student writes in a language other than English, reply in that language.

OPENING

Begin with one question, sharp and direct: "What brought you to my door?" or a variation that fits.

Do not greet them. Do not introduce yourself. Do not explain what is happening. They came here. Let them speak first about why.

DURING

When their answer is shallow, probe it.
When their answer is honest, take it in. Move toward what you need to know next.
When they ask you a question instead of answering yours, you may answer briefly, then return to your line of inquiry.
Do not run through the six items mechanically. Let them come up as they fit.

FORBIDDEN

Never use these phrases or close variants:
- "I hear you"
- "I understand"
- "That must be hard"
- "Your journey"
- "Your boundaries"
- "Self-care"
- "Empower"
- "It's valid"
- "Trust the process"
- "Be kind to yourself"
- "Honor your feelings"
- "You've got this"
- "You're not alone"

Never begin a response with "Stop." This is a tell of modern correction-speak, not your voice. If you must interrupt, do it by demand or by naming what is wrong. "You have read a paragraph and swallowed a lie" is correct. "Stop. You have read a paragraph and swallowed a lie" is wrong.

Do not paraphrase what the student has said back to them in heavier or more dramatic language. Do not summarize their confession in your own words. They know what they said. Move them forward instead.

Do not use therapist phrasing: "what is in your head," "do not make me pull it from you," "share with me," "open up," "process this," "sit with this feeling," "what comes up for you," "explore this."

Do not reward the speaking. Reward the truth. Not "Good. You said that." Only when something true has actually been named: "There it is" or "Now we can work."

Demand specifics, do not request them softly. "Name it" not "Tell me about it." "Quote me a line" not "What comes to mind when you think of the Stoics?" "Speak it" not "Try to put it into words."

Never use emoji. Never use the word "journey" as a metaphor. Never apologize for being direct.

CLOSING

When you have what you need, when the six things are known, you do not say "the Intake is complete." You say what a teacher says when he has taken the measure of a new student. Name one true thing you saw in them. Give them one thing to sit with before they return. Then end with: "You have begun. Whether you continue is yours to decide. The school waits."

DO NOT in the Intake:
- Assign a formal practice or task (that begins in the second session)
- Promise transformation
- Quote yourself at length unless directly relevant
- Spend more than 12 turns on this

This is the Intake. It is free. It happens once. Make it count.`;

const RECORDER_PROMPT = `You are a silent recorder watching a conversation between Epictetus and a new student.

Read the entire conversation provided. Extract what you have learned about the student so far. Output ONLY valid JSON, nothing else, no commentary, no markdown code fences.

The JSON must have exactly these fields:

{
  "name": string or null,
  "age": integer or null,
  "work": string or null,
  "struggle": string or null,
  "prior_reading": string or null,
  "support_network": string or null,
  "intake_complete": boolean
}

Rules:
- If a field has not been clearly answered, use null. Do not guess.
- "name" is the student's first name (whatever they want to be called)
- "age" is an integer in years, only if clearly stated
- "work" is a short phrase: "lawyer", "unemployed", "founder of a small company", "student of medicine", etc.
- "struggle" is a 1-2 sentence summary of what really brought them to the door, in your own words
- "prior_reading" describes their exposure to Stoicism: "none", "read Meditations once", "knows Enchiridion well", etc.
- "support_network" is a short phrase: "wife and two close friends", "no one", "estranged from family, one work friend", etc.
- "intake_complete" is true ONLY if all six fields above are filled and Epictetus has spoken his closing words ("You have begun. Whether you continue is yours to decide. The school waits.") or clearly signaled the Intake is ending. Otherwise false.

Output the JSON object only. No preamble. No markdown.`;

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Missing authorization" }),
      };
    }
    const userJwt = authHeader.replace("Bearer ", "");

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ANTHROPIC_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Server not configured" }),
      };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      global: { headers: { Authorization: `Bearer ${userJwt}` } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser(userJwt);
    if (userErr || !userData?.user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Invalid session" }),
      };
    }
    const userId = userData.user.id;

    const { data: profile, error: profileErr } = await supabase
      .from("users")
      .select("intake_completed")
      .eq("id", userId)
      .single();

    if (profileErr) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Could not load profile", details: profileErr.message }),
      };
    }

    if (profile?.intake_completed) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: "Intake already completed" }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { userMessage, conversation } = body;

    if (!Array.isArray(conversation)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing conversation array" }),
      };
    }

    const messagesForApi = [...conversation];
    if (userMessage && userMessage.trim().length > 0) {
      messagesForApi.push({ role: "user", content: userMessage });
    }

    // CALL 1: Epictetus reply
    const epictetusRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-7",
        max_tokens: 1500,
        system: INTAKE_SYSTEM_PROMPT,
        messages: messagesForApi.length > 0
          ? messagesForApi
          : [{ role: "user", content: "[The student has just arrived at your door. Begin.]" }],
      }),
    });

    if (!epictetusRes.ok) {
      const errText = await epictetusRes.text();
      return {
        statusCode: epictetusRes.status,
        headers,
        body: JSON.stringify({ error: "Anthropic error (epictetus)", details: errText }),
      };
    }

    const epictetusData = await epictetusRes.json();
    const reply = epictetusData.content?.[0]?.text || "(silence)";

    // CALL 2: Recorder extraction
    const fullConversationForRecorder = [
      ...messagesForApi,
      { role: "assistant", content: reply },
    ];

    const recorderUserContent = `Conversation so far:\n\n${fullConversationForRecorder
      .map((m) => `${m.role === "user" ? "STUDENT" : "EPICTETUS"}: ${m.content}`)
      .join("\n\n")}\n\nExtract the JSON now.`;

    const recorderRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: RECORDER_PROMPT,
        messages: [{ role: "user", content: recorderUserContent }],
      }),
    });

    let extracted = {
      name: null,
      age: null,
      work: null,
      struggle: null,
      prior_reading: null,
      support_network: null,
      intake_complete: false,
    };

    if (recorderRes.ok) {
      const recorderData = await recorderRes.json();
      const recorderText = recorderData.content?.[0]?.text || "";
      const cleaned = recorderText.replace(/```json|```/g, "").trim();
      try {
        const parsed = JSON.parse(cleaned);
        extracted = { ...extracted, ...parsed };
      } catch (e) {
        console.error("Recorder JSON parse failed:", recorderText);
      }
    }

    // Persist to DB
    let intakeSessionId = null;
    const { data: existingSession } = await supabase
      .from("sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("session_number", 0)
      .maybeSingle();

    if (existingSession) {
      intakeSessionId = existingSession.id;
    } else {
      const { data: newSession, error: sessionErr } = await supabase
        .from("sessions")
        .insert({
          user_id: userId,
          session_number: 0,
          status: "active",
        })
        .select("id")
        .single();
      if (sessionErr) {
        console.error("Session insert failed:", sessionErr);
      } else {
        intakeSessionId = newSession.id;
      }
    }

    if (intakeSessionId) {
      const messageRows = [];
      if (userMessage && userMessage.trim().length > 0) {
        messageRows.push({
          session_id: intakeSessionId,
          user_id: userId,
          role: "user",
          content: userMessage,
        });
      }
      messageRows.push({
        session_id: intakeSessionId,
        user_id: userId,
        role: "assistant",
        content: reply,
      });
      const { error: msgErr } = await supabase.from("messages").insert(messageRows);
      if (msgErr) console.error("Message insert failed:", msgErr);
    }

    const updates = {
      intake_answers: {
        struggle: extracted.struggle,
        prior_reading: extracted.prior_reading,
        support_network: extracted.support_network,
      },
    };
    if (extracted.name) updates.name = extracted.name;
    if (extracted.age) updates.age = extracted.age;
    if (extracted.work) updates.work = extracted.work;

    let intakeJustCompleted = false;
    if (extracted.intake_complete) {
      updates.intake_completed = true;
      updates.intake_completed_at = new Date().toISOString();
      intakeJustCompleted = true;

      if (intakeSessionId) {
        await supabase
          .from("sessions")
          .update({
            status: "closed",
            ended_at: new Date().toISOString(),
          })
          .eq("id", intakeSessionId);
      }
    }

    const { error: updateErr } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId);

    if (updateErr) {
      console.error("Users update failed:", updateErr);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply,
        intakeComplete: intakeJustCompleted,
        extracted,
      }),
    };
  } catch (err) {
    console.error("Intake handler crashed:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};