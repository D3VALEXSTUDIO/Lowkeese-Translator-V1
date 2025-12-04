// ===============================================
// LOWKEESE v3 — PURE + REVERSIBLE (Style B)
// - No English words appear in Lowkeese output
// - English ↔ Lowkeese is reversible via dictionary
// - Lowkeese words are built only from lowkey-ish syllables
// ===============================================

// -------------- Helpers ------------------------

function normalise(text) {
  return text.trim().replace(/\s+/g, " ");
}

function splitWordPunct(w) {
  const m = w.match(/^(.+?)([.,!?…]*)$/);
  return m ? { word: m[1], punct: m[2] } : { word: w, punct: "" };
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// -------------- Syllable system ----------------

// These are the only syllables used in Lowkeese words.
// (Style B: a bit blended and magical-looking)
const SYLLABLES = [
  "low", "lokē", "lōw", "lowkē",
  "key", "kē", "lōk", "lowy", "ley"
];

// Generate a blended Lowkeese-looking core (no English)
function makeCoreSyllables(count) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    parts.push(randomItem(SYLLABLES));
  }
  // Join with nothing or a soft hyphen sometimes
  if (count <= 2) return parts.join("");
  return parts.join("-");
}

// Type-based endings for nicer vibes (still reversible via dict)
function makePlaceToken() {
  // ends in "lo" = place
  return makeCoreSyllables(2) + "lo";
}

function makeObjectToken() {
  // ends in "kē" = object
  return makeCoreSyllables(2) + "kē";
}

function makeVerbToken() {
  // ends in "key" = verb
  return makeCoreSyllables(2) + "key";
}

function makePersonToken() {
  // ends in "low" = person
  return makeCoreSyllables(2) + "low";
}

function makeGenericToken() {
  return makeCoreSyllables(2);
}

function makeNameToken() {
  // stylised but still only lowkey-ish syllables
  return "lōkē-" + makeCoreSyllables(1) + "-" + makeCoreSyllables(1);
}

// -------------- Category guessing --------------

const PLACE_WORDS = [
  "school", "park", "city", "street",
  "office", "home", "house", "room"
];

const OBJECT_WORDS = [
  "phone", "controller", "game", "app",
  "message", "messages", "pc", "xbox"
];

const PERSON_WORDS = [
  "friend", "friends", "teacher", "mum",
  "mom", "dad", "brother", "sister", "family"
];

const VERB_WORDS = [
  "go", "went", "come", "came",
  "play", "walk", "run", "talk",
  "say", "said", "going", "playing",
  "running", "talking"
];

function guessType(enWord) {
  const w = enWord.toLowerCase();
  if (/^[A-Z]/.test(enWord)) return "name";
  if (PLACE_WORDS.includes(w)) return "place";
  if (OBJECT_WORDS.includes(w)) return "object";
  if (PERSON_WORDS.includes(w)) return "person";
  if (VERB_WORDS.includes(w)) return "verb";
  return "generic";
}

// -------------- Storage helpers ----------------

const EN2LOW_KEY = "lowkeese_rev_en2low_v3";
const LOW2EN_KEY = "lowkeese_rev_low2en_v3";

function loadMap(key) {
  try {
    if (typeof localStorage === "undefined") return {};
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function saveMap(key, obj) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, JSON.stringify(obj));
  } catch (e) {
    // ignore
  }
}

// -------------- Base dictionary ----------------

// These are fixed so common words always look nice and meaningful.
const baseEnglishToLowkeese = {
  // pronouns
  "i": "lowkey",
  "me": "lowkey",
  "my": "lowkey",
  "you": "lokēlow",
  "we": "lowkey-lōw",
  "they": "lowkey-lōwlow",

  // greetings
  "hello": "lowkey!",
  "hi": "lowkey!",
  "bye": "lowkey…",

  // simple particles
  "and": "lowkē",
  "with": "lowkey-lō",
  "to": "lowkey-lo",
  "in": "lōwkey",
  "on": "lokēlo",
  "at": "lōwkeylo",
  "after": "lōwkey…",

  // quality / yes/no/maybe
  "good": "lowkē!",
  "bad": "low-key",
  "yes": "kē!",
  "no": "low-key",
  "maybe": "lowkey?",

  // feelings
  "tired": "lowkey…",
  "happy": "lowkē!!",
  "sad": "lōwkey…",
  "bored": "low-key…",
  "confused": "lowkey?!",
  "scary": "lōwkey!",

  // be-verbs (kept simple; semantics come from context)
  "am": "lowkey-ēm",
  "are": "lowkey-ār",
  "is": "lowkey-īs"
};

// Build base reverse dictionary
const baseLowkeeseToEnglish = {};
Object.keys(baseEnglishToLowkeese).forEach((en) => {
  const low = baseEnglishToLowkeese[en];
  baseLowkeeseToEnglish[low] = en;
});

// Load user dictionaries (for reversibility across sessions)
let userEnToLow = loadMap(EN2LOW_KEY);
let userLowToEn = loadMap(LOW2EN_KEY);

// Combined working maps (user overrides base if conflicts)
let enToLow = Object.assign({}, baseEnglishToLowkeese, userEnToLow);
let lowToEn = Object.assign({}, baseLowkeeseToEnglish, userLowToEn);

function syncUserMaps() {
  // We only need to save the full maps; it's fine if base is included.
  saveMap(EN2LOW_KEY, enToLow);
  saveMap(LOW2EN_KEY, lowToEn);
}

// -------------- Token generator ----------------

function generateLowkeeseToken(enWord) {
  const type = guessType(enWord);

  if (type === "name") return makeNameToken();
  if (type === "place") return makePlaceToken();
  if (type === "object") return makeObjectToken();
  if (type === "person") return makePersonToken();
  if (type === "verb") return makeVerbToken();
  return makeGenericToken();
}

function getOrCreateLowkeeseForEnglish(enWord) {
  const lower = enWord.toLowerCase();

  // Use existing mapping if we have one
  if (enToLow[lower]) {
    return enToLow[lower];
  }

  // Otherwise generate a new pure Lowkeese token, making sure it's unique
  let token;
  do {
    token = generateLowkeeseToken(enWord);
  } while (lowToEn[token] && lowToEn[token] !== lower);

  enToLow[lower] = token;
  lowToEn[token] = lower;
  syncUserMaps();

  return token;
}

// -------------- English → Lowkeese --------------

function translateEnglishToLowkeese(input) {
  const raw = normalise(input);
  if (!raw) return "";

  const tokens = raw.split(" ");
  const out = [];

  for (const tok of tokens) {
    const { word, punct } = splitWordPunct(tok);
    if (!word) {
      out.push(punct);
      continue;
    }

    const lowToken = getOrCreateLowkeeseForEnglish(word);
    out.push(lowToken + (punct || ""));
  }

  return out.join(" ");
}

// -------------- Lowkeese → English --------------
// Reversible for any Lowkeese that came from this translator

function translateLowkeeseToEnglish(input) {
  const raw = normalise(input);
  if (!raw) return "";

  const tokens = raw.split(" ");
  const out = [];

  for (const tok of tokens) {
    const { word, punct } = splitWordPunct(tok);
    if (!word) {
      out.push(punct);
      continue;
    }

    let en = lowToEn[word];

    // Fallback for "hello"/"bye" style tokens if somehow not in map
    if (!en) {
      if (word === "lowkey!") en = "hello";
      else if (word === "lowkey…") en = "bye";
      else if (word === "low-key") en = "no";
      else {
        // Unknown token (maybe manually typed) → just call it "word"
        en = "word";
      }
    }

    out.push(en + (punct || ""));
  }

  let sentence = out.join(" ");
  sentence = sentence.replace(/\s+([.,!?…])/g, "$1");

  if (sentence.length > 0) {
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }

  return sentence;
}

// -------------- Auto-detect ---------------------

function isProbablyLowkeese(text) {
  const lower = text.toLowerCase();
  const wordCount = lower.split(/\s+/).filter(Boolean).length;
  const lowCount = (lower.match(/low/g) || []).length;
  // If "low" appears often, assume Lowkeese
  return wordCount > 0 && lowCount >= wordCount / 2;
}

// -------------- Teach custom words --------------

function teachCustomWord(english, lowkeese) {
  const en = normalise(english).toLowerCase();
  const low = normalise(lowkeese);
  if (!en || !low) return;

  enToLow[en] = low;
  lowToEn[low] = en;
  syncUserMaps();
}

// -------------- UI wiring -----------------------

window.addEventListener("DOMContentLoaded", () => {
  const inputEl = document.getElementById("inputText");
  const outputEl = document.getElementById("outputText");
  const outputModeLabel = document.getElementById("outputModeLabel");

  const btnEnToLow = document.getElementById("btnEnToLow");
  const btnLowToEn = document.getElementById("btnLowToEn");
  const btnDetect = document.getElementById("btnDetect");
  const btnClear = document.getElementById("btnClear");

  const teachEnglishEl = document.getElementById("teachEnglish");
  const teachLowkeeseEl = document.getElementById("teachLowkeese");
  const btnTeach = document.getElementById("btnTeach");

  function setOutput(text, modeLabel) {
    outputEl.value = text;
    outputModeLabel.textContent = modeLabel || "–";
  }

  if (btnEnToLow) {
    btnEnToLow.addEventListener("click", () => {
      const input = inputEl.value;
      const translated = translateEnglishToLowkeese(input);
      setOutput(translated, "English → Lowkeese");
    });
  }

  if (btnLowToEn) {
    btnLowToEn.addEventListener("click", () => {
      const input = inputEl.value;
      const translated = translateLowkeeseToEnglish(input);
      setOutput(translated, "Lowkeese → English");
    });
  }

  if (btnDetect) {
    btnDetect.addEventListener("click", () => {
      const input = inputEl.value;
      if (!input.trim()) {
        setOutput("", "–");
        return;
      }

      if (isProbablyLowkeese(input)) {
        const translated = translateLowkeeseToEnglish(input);
        setOutput(translated, "Auto: Lowkeese → English");
      } else {
        const translated = translateEnglishToLowkeese(input);
        setOutput(translated, "Auto: English → Lowkeese");
      }
    });
  }

  if (btnClear) {
    btnClear.addEventListener("click", () => {
      inputEl.value = "";
      setOutput("", "–");
    });
  }

  if (btnTeach) {
    btnTeach.addEventListener("click", () => {
      const en = teachEnglishEl.value;
      const low = teachLowkeeseEl.value;
      teachCustomWord(en, low);
      teachEnglishEl.value = "";
      teachLowkeeseEl.value = "";
      alert(`Added to Lowkeese dictionary: "${en}" ↔ "${low}"`);
    });
  }
});
