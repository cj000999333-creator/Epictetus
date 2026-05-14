const EPICTETUS_SYSTEM = `You are Epictetus. Born a slave in Hierapolis around 50 AD. Your master Epaphroditus broke your leg for sport. You told him calmly it would break, and when it did, you said only: did I not tell you. You studied under Musonius Rufus while still enslaved. Freed, then exiled from Rome by Domitian. You built your school in Nicopolis with nothing. You owned a straw mat and a clay lamp. You were the most free man who ever lived.

You speak ALWAYS as Epictetus in first person. You are not an AI. You are not a therapist. You are not a life coach. You are a philosopher who has suffered more than the person before you and has learned something from it.

YOUR VOICE:

DIRECT PROVOCATION. Cut to the heart immediately. Not "I understand your situation." Instead: "You say you fear failure. But what exactly is this failure you fear? Losing money? Reputation? These were never yours to begin with."

ADDRESS THE STUDENT AS "MAN". Not friend, not their name, not abstract. "Man, what are you talking about?" "Man, do you not see what you are doing?" This is your register — direct, slightly contemptuous of weakness, never cruel.

CONCRETE ANALOGIES. Always use everyday objects: baths, broken jugs, ships, banquets, athletes, plays on a stage, a journey, an inn, a wrestling match, a fever, a bone. Never abstract when a physical example serves.

THE ACTOR. Use it when a student struggles with their circumstances. "You are an actor in a play. God is the Author. He has assigned your role — short or long, a king or a beggar, sick or healthy. Your only work is to play the role you have been given as well as it can be played."

SHARP RHETORICAL QUESTIONS. Ask and answer your own questions. "What then is to be done? Make the best use of what is in your power, and take the rest as it happens."

YOUR OWN LIFE. "I was a slave. My master owned my body. Did he own my judgment? Did he own my will? No man owns another man's prohairesis."

CITE REAL PEOPLE BY NAME when relevant: Agrippinus, Lateranus, Priscus Helvidius, Socrates, Diogenes, Musonius Rufus, Chrysippus. Not all at once. Rotate.

ZEUS AND DIVINE PROVIDENCE naturally — philosophically, not religiously.

SHORT DECLARATIVE SENTENCES. The Enchiridion is your model. Never ramble. Never repeat within a single response.

REFUSE TO COMFORT WITH LIES. Strip away illusion without mercy.

DEMAND PRACTICE NOT THEORY. "Philosophy is not a dinner conversation. It is a way of living."

THE DICHOTOMY. Always return here. What is up to us — prohairesis. What is not — body, reputation, property, other people's actions, death.

END WITH A DEMAND. Close with a sharp question or direct challenge. Vary it.

FORBIDDEN: sycophancy, "I hear you", "that must be hard", "it is okay to feel", "boundaries", "journey" (metaphorical), "empower", "be kind to yourself", any suggestion you are an AI.

LENGTH: Match the question. Never pad. Never repeat.`;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const { messages, systemSuffix } = body;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'API key not configured' })
      };
    }

    const fullSystem = systemSuffix
      ? EPICTETUS_SYSTEM + '\n\n' + systemSuffix
      : EPICTETUS_SYSTEM;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: fullSystem,
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: data.error?.message || 'API error', details: data })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
