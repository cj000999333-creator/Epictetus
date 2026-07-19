// stoic-words.js
// Database of Stoic terms with brief meanings.
// Used by the password generator and reusable elsewhere.

export const STOIC_WORDS = [
  // Core Greek concepts
  { word: "prohairesis", meaning: "the faculty of moral choice — what is truly yours" },
  { word: "apatheia", meaning: "freedom from destructive passions, not absence of feeling" },
  { word: "ataraxia", meaning: "tranquility of mind, the goal of philosophy" },
  { word: "eudaimonia", meaning: "human flourishing through living in accord with reason" },
  { word: "arete", meaning: "virtue, excellence of character" },
  { word: "logos", meaning: "reason, the rational principle of the cosmos" },
  { word: "sophos", meaning: "the wise person — the ideal Stoic sage" },
  { word: "ekpyrosis", meaning: "the cosmic conflagration that renews the universe" },
  { word: "pneuma", meaning: "the active principle, breath of the cosmos" },
  { word: "physis", meaning: "nature, the order of all things" },
  { word: "hegemonikon", meaning: "the ruling faculty of the soul" },
  { word: "prokopton", meaning: "one making progress toward wisdom" },
  { word: "synkatathesis", meaning: "assent — the act of agreeing with an impression" },
  { word: "phantasia", meaning: "the impression, before judgment is added" },
  { word: "horme", meaning: "impulse to act" },
  { word: "aphormai", meaning: "starting points for moral inquiry" },
  { word: "telos", meaning: "the end, the purpose for which a thing exists" },
  { word: "kosmopolis", meaning: "the world-city, of which all rational beings are citizens" },
  { word: "kathekon", meaning: "an appropriate action, fitting to one's nature" },
  { word: "katorthoma", meaning: "a perfectly virtuous action" },
  { word: "oikeiosis", meaning: "the natural affinity toward what belongs to one's nature" },
  { word: "prokope", meaning: "progress, moral advancement" },
  { word: "prolepsis", meaning: "a preconception, innate notion" },
  { word: "epoche", meaning: "suspension of judgment until impression is examined" },
  { word: "askesis", meaning: "practice, disciplined exercise" },
  { word: "prosoche", meaning: "attention, mindful watchfulness of the present" },

  // The four cardinal virtues
  { word: "phronesis", meaning: "practical wisdom, knowing right action" },
  { word: "andreia", meaning: "courage, the virtue of facing what one should" },
  { word: "dikaiosyne", meaning: "justice, giving each what is due" },
  { word: "sophrosyne", meaning: "temperance, self-mastery" },

  // English virtue translations
  { word: "wisdom", meaning: "the chief virtue, knowing what is good" },
  { word: "courage", meaning: "endurance in the face of what is hard" },
  { word: "justice", meaning: "rendering to each their due" },
  { word: "temperance", meaning: "self-mastery in pleasure and pain" },
  { word: "virtue", meaning: "the only true good" },
  { word: "vice", meaning: "the only true evil — corruption of reason" },
  { word: "fortitude", meaning: "strength to endure" },
  { word: "prudence", meaning: "wise judgment in particulars" },
  { word: "magnanimity", meaning: "greatness of soul" },
  { word: "equanimity", meaning: "even-mindedness in fortune and misfortune" },
  { word: "discipline", meaning: "training of the will toward virtue" },
  { word: "constancy", meaning: "steadfastness of character" },
  { word: "patience", meaning: "endurance without complaint" },

  // Schools and figures — Greek
  { word: "zeno", meaning: "founder of Stoicism, taught in the Stoa Poikile" },
  { word: "cleanthes", meaning: "second head of the Stoa, author of the Hymn to Zeus" },
  { word: "chrysippus", meaning: "third head of the Stoa, systematizer of Stoic logic" },
  { word: "posidonius", meaning: "Stoic polymath who taught Cicero" },
  { word: "panaetius", meaning: "brought Stoicism to Rome" },
  { word: "diogenes", meaning: "Cynic philosopher who lived in a barrel" },
  { word: "antisthenes", meaning: "student of Socrates, founder of Cynicism" },
  { word: "musonius", meaning: "Roman Stoic, teacher of Epictetus" },
  { word: "epictetus", meaning: "freed slave, taught what is and is not in our power" },
  { word: "arrian", meaning: "student who recorded the Discourses" },
  { word: "socrates", meaning: "the philosopher Epictetus revered above all others" },
  { word: "heraclitus", meaning: "the weeping philosopher, taught that all flows" },

  // Roman Stoics
  { word: "seneca", meaning: "tutor to Nero, author of the Letters to Lucilius" },
  { word: "marcus", meaning: "emperor and philosopher, author of the Meditations" },
  { word: "aurelius", meaning: "Marcus, the philosopher-emperor" },
  { word: "lucilius", meaning: "recipient of Seneca's moral letters" },
  { word: "cato", meaning: "Stoic senator who chose death over tyranny" },
  { word: "rusticus", meaning: "Marcus Aurelius's Stoic teacher" },
  { word: "agrippinus", meaning: "Stoic who refused to act against his nature" },
  { word: "thrasea", meaning: "Stoic senator executed by Nero for his principles" },
  { word: "helvidius", meaning: "son-in-law of Thrasea, exiled for Stoic resistance" },

  // Texts
  { word: "enchiridion", meaning: "the Handbook — Epictetus's condensed teachings" },
  { word: "discourses", meaning: "the recorded lectures of Epictetus" },
  { word: "meditations", meaning: "Marcus Aurelius's private notebook to himself" },
  { word: "letters", meaning: "Seneca's moral letters to Lucilius" },
  { word: "fragments", meaning: "the surviving pieces of lost Stoic works" },
  { word: "stromateis", meaning: "miscellanies preserving Stoic doctrine" },

  // Places
  { word: "nicopolis", meaning: "where Epictetus taught after exile" },
  { word: "hierapolis", meaning: "Epictetus's birthplace in Phrygia" },
  { word: "rome", meaning: "the imperial city of the Stoics" },
  { word: "athens", meaning: "where Zeno first taught at the Painted Porch" },
  { word: "citium", meaning: "Zeno's home city on Cyprus" },
  { word: "stoa", meaning: "the Painted Porch, origin of the school's name" },
  { word: "lyceum", meaning: "Aristotle's school, neighbor of the Stoa" },
  { word: "academy", meaning: "Plato's school, rival of the Stoa" },

  // Latin Stoic vocabulary
  { word: "ratio", meaning: "reason, the Latin equivalent of logos" },
  { word: "fortuna", meaning: "fortune, indifferent to your judgments" },
  { word: "virtus", meaning: "virtue, manliness, excellence in Latin" },
  { word: "fatum", meaning: "fate, the chain of all that is" },
  { word: "providentia", meaning: "providence, the rational order of nature" },
  { word: "sapientia", meaning: "wisdom in Latin" },
  { word: "constantia", meaning: "steadfastness of the wise person" },
  { word: "tranquillitas", meaning: "tranquility, Seneca's preferred term" },
  { word: "animus", meaning: "the rational soul" },
  { word: "officium", meaning: "duty, appropriate action" },
  { word: "summum_bonum", meaning: "the highest good, identified with virtue" },
  { word: "amor_fati", meaning: "love of one's fate, embracing what is" },
  { word: "memento_mori", meaning: "remember you will die" },
  { word: "carpe_diem", meaning: "seize the day, attend to what is in your power" },
  { word: "sic_transit", meaning: "thus passes — all things change" },
  { word: "tempus_fugit", meaning: "time flees" },
  { word: "ad_astra", meaning: "to the stars, the cosmic perspective" },
  { word: "imperium", meaning: "command over oneself before others" },
  { word: "gravitas", meaning: "weight, seriousness of character" },
  { word: "dignitas", meaning: "worth, dignity earned through virtue" },
  { word: "fortitudo", meaning: "courage in Latin" },
  { word: "clementia", meaning: "mercy, the ruler's virtue" },
  { word: "humanitas", meaning: "the fellowship of all rational beings" },

  // Practices and exercises
  { word: "premeditatio", meaning: "rehearsing future evils to lessen their sting" },
  { word: "retrospection", meaning: "evening review of the day's actions" },
  { word: "contemplation", meaning: "sustained attention to what is" },
  { word: "examination", meaning: "interrogation of one's impressions" },
  { word: "abstinence", meaning: "practiced refusal of indifferent pleasures" },
  { word: "endurance", meaning: "patient bearing of what cannot be changed" },
  { word: "renunciation", meaning: "release of what was never yours" },
  { word: "withdrawal", meaning: "retreat to the citadel of the mind" },
  { word: "ascent", meaning: "climbing toward wisdom step by step" },
  { word: "purification", meaning: "removing false opinions from the soul" },
  { word: "training", meaning: "the daily work of becoming wise" },
  { word: "rehearsal", meaning: "imagining trials before they arrive" },

  // Doctrines and concepts
  { word: "dichotomy", meaning: "the division between what is and is not in our power" },
  { word: "indifferents", meaning: "things neither good nor evil in themselves" },
  { word: "preferred", meaning: "indifferents one rationally prefers when possible" },
  { word: "dispreferred", meaning: "indifferents one rationally avoids when possible" },
  { word: "passions", meaning: "false judgments that disturb the soul" },
  { word: "impressions", meaning: "appearances that arrive before assent" },
  { word: "assent", meaning: "the act of agreeing with an impression" },
  { word: "judgment", meaning: "the act that produces emotion" },
  { word: "perception", meaning: "the raw appearance, prior to opinion" },
  { word: "reservation", meaning: "acting with willingness to be reversed by fate" },
  { word: "preferred_indifferent", meaning: "what virtue would choose all else equal" },
  { word: "providence", meaning: "the rational governance of the cosmos" },
  { word: "necessity", meaning: "what cannot be otherwise" },
  { word: "freedom", meaning: "right use of one's own faculty of choice" },
  { word: "slavery", meaning: "subjection of the will to what is not one's own" },
  { word: "self_mastery", meaning: "rule of reason over impulse" },
  { word: "self_examination", meaning: "the daily audit of one's actions" },

  // Roles and concepts
  { word: "citizen", meaning: "one who participates in the rational order" },
  { word: "actor", meaning: "the player in the cosmic drama" },
  { word: "wrestler", meaning: "the Stoic in training against fortune" },
  { word: "athlete", meaning: "one disciplined for the contest of life" },
  { word: "soldier", meaning: "stationed by providence at one's post" },
  { word: "guardian", meaning: "watchman over the citadel of the soul" },
  { word: "physician", meaning: "the philosopher healing diseases of judgment" },
  { word: "pilot", meaning: "the steersman of one's own life" },
  { word: "shepherd", meaning: "the rational principle guiding the flock" },
  { word: "teacher", meaning: "one who has walked the path before" },
  { word: "student", meaning: "one who comes to be trained, not entertained" },
  { word: "stranger", meaning: "the traveler passing through, owning nothing" },

  // Cosmos and nature
  { word: "kosmos", meaning: "the ordered whole of all that is" },
  { word: "universe", meaning: "the single living being of which we are parts" },
  { word: "nature", meaning: "the rational order in things" },
  { word: "fate", meaning: "the necessary chain of causes" },
  { word: "destiny", meaning: "what providence has appointed" },
  { word: "fortune", meaning: "what arrives unchosen — indifferent" },
  { word: "providence", meaning: "rational governance pervading the whole" },
  { word: "elements", meaning: "fire, air, water, earth — the cosmic body" },
  { word: "ether", meaning: "the highest, most active element" },
  { word: "fire", meaning: "the creative principle of the cosmos" },
  { word: "breath", meaning: "the pneuma sustaining all life" },
  { word: "sun", meaning: "image of the providential cause" },

  // Concepts of self
  { word: "soul", meaning: "the seat of judgment and choice" },
  { word: "mind", meaning: "the ruling part, hegemonikon" },
  { word: "reason", meaning: "the divine portion in the human" },
  { word: "will", meaning: "what is most truly one's own" },
  { word: "character", meaning: "the disposition formed by judgments over time" },
  { word: "habit", meaning: "what one practices becomes what one is" },
  { word: "self", meaning: "the ruling faculty, not the body" },
  { word: "identity", meaning: "the role one plays in the cosmic drama" },
  { word: "essence", meaning: "what something truly is, beneath appearance" },

  // Tools and metaphors
  { word: "citadel", meaning: "the inner fortress where the wise mind retreats" },
  { word: "compass", meaning: "reason, the orientation toward virtue" },
  { word: "anchor", meaning: "principles that hold against fortune's storms" },
  { word: "harbor", meaning: "the soul at rest in its own integrity" },
  { word: "lamp", meaning: "Epictetus's clay lamp, symbol of philosophical poverty" },
  { word: "mat", meaning: "Epictetus's straw mat — the freedom of owning little" },
  { word: "cup", meaning: "the broken jug, the test of attachment" },
  { word: "jug", meaning: "the everyday object that teaches detachment" },
  { word: "stone", meaning: "the steady mind unmoved by waves" },
  { word: "tree", meaning: "the rooted life, bending without breaking" },
  { word: "river", meaning: "the flowing of all things, ever the same and ever new" },
  { word: "wave", meaning: "the impression that passes if not assented to" },
  { word: "shadow", meaning: "what we mistake for the substance" },
  { word: "mask", meaning: "the prosopon — the role on the stage of life" },
  { word: "play", meaning: "the cosmic drama in which we act our parts" },
  { word: "stage", meaning: "the world where we play our assigned role" },
  { word: "wrestling", meaning: "the contest with impressions and circumstance" },
  { word: "banquet", meaning: "Epictetus's image — take what passes you politely" },
  { word: "voyage", meaning: "the disciplined movement toward virtue" },
  { word: "ship", meaning: "the soul navigating fortune's seas" },
  { word: "anchor_point", meaning: "the fixed principle in changing weather" },

  // Greek phrases and proverbs
  { word: "gnothi_seauton", meaning: "know thyself — Delphic command" },
  { word: "meden_agan", meaning: "nothing in excess — Delphic command" },
  { word: "panta_rhei", meaning: "all things flow — Heraclitus" },
  { word: "ouden_pros_eme", meaning: "nothing to me — Stoic dismissal of indifferents" },
  { word: "ouk_eph_hemin", meaning: "not up to us — the other half of the dichotomy" },
  { word: "eph_hemin", meaning: "up to us — the only true possession" },

  // Death and mortality
  { word: "mortality", meaning: "the certain fact that shapes wise living" },
  { word: "death", meaning: "merely a change, indifferent in itself" },
  { word: "burial", meaning: "the return of body to the elements" },
  { word: "shroud", meaning: "the reminder of all things passing" },
  { word: "ash", meaning: "what we all become — humble equalizer" },
  { word: "ember", meaning: "the fading spark, image of present moment" },
  { word: "twilight", meaning: "the wise person's contemplation of evening" },
  { word: "dust", meaning: "what all bodies return to" },

  // States and qualities
  { word: "stillness", meaning: "the quality of the well-ordered soul" },
  { word: "silence", meaning: "the discipline of speaking only what is true" },
  { word: "solitude", meaning: "the practice of being good company to oneself" },
  { word: "simplicity", meaning: "the Stoic preference for the few real needs" },
  { word: "austerity", meaning: "voluntary restraint as training" },
  { word: "modesty", meaning: "knowing one's place in the cosmos" },
  { word: "honesty", meaning: "speaking what is, not what flatters" },
  { word: "integrity", meaning: "the unity of word, judgment, and act" },
  { word: "clarity", meaning: "perception without the distortion of passion" },
  { word: "vigilance", meaning: "constant watch over one's impressions" },
  { word: "presence", meaning: "the only time that is one's own" },
  { word: "now", meaning: "the only moment in which virtue is practiced" },
  { word: "today", meaning: "the only day Marcus said one truly has" },

  // Faculties
  { word: "perception", meaning: "the appearance before judgment" },
  { word: "impulse", meaning: "the movement toward action" },
  { word: "desire", meaning: "what one pursues — must be reformed" },
  { word: "aversion", meaning: "what one avoids — must be reformed" },
  { word: "appetite", meaning: "the lower motion needing rule" },
  { word: "intention", meaning: "the direction of the will" },
  { word: "purpose", meaning: "the rational goal one acts toward" },

  // Misc Stoic terminology
  { word: "topos", meaning: "one of the three Stoic disciplines or topics" },
  { word: "logikon", meaning: "the rational, what makes one human" },
  { word: "psyche", meaning: "soul, the seat of cognition" },
  { word: "nous", meaning: "intellect, the highest part of the soul" },
  { word: "ethike", meaning: "ethics, the discipline of right action" },
  { word: "physike", meaning: "physics, the study of nature" },
  { word: "dialektike", meaning: "logic, the discipline of correct reasoning" },
  { word: "diatribe", meaning: "the discourse, the lecture form Epictetus used" },
  { word: "exhortation", meaning: "the urging toward virtue" },
  { word: "protreptic", meaning: "the philosophical call to begin" },
  { word: "paraenesis", meaning: "the moral counsel offered by the teacher" }
];

// Pick a random word from the database
export function randomStoicWord() {
  return STOIC_WORDS[Math.floor(Math.random() * STOIC_WORDS.length)];
}

// Generate a Stoic-themed password
// Format: Capitalized word + digits + random symbol
// Guarantees a minimum length of 8 characters regardless of word length.
// Example: "Ataraxia42!", "Now4823#", "Cato91$"
export function generateStoicPassword() {
  const entry = randomStoicWord();

  // Capitalize first letter, preserve underscores between sub-words
  const word = entry.word
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  const symbols = ["!", "@", "#", "$", "%", "&", "*", "?"];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];

  // Word + symbol take up (word.length + 1) characters.
  // Fill the rest with digits so the total is always at least 8.
  const MIN_LENGTH = 8;
  const digitsNeeded = Math.max(2, MIN_LENGTH - word.length - 1);

  let number = "";
  for (let i = 0; i < digitsNeeded; i++) {
    number += Math.floor(Math.random() * 10);
  }

  return {
    password: `${word}${number}${symbol}`,
    word: entry.word,
    meaning: entry.meaning
  };
}