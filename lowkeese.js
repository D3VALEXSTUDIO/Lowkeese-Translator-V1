// lowkeese.js
// Lowkeese v2 translation engine with:
// - base dictionary
// - fallback rules for unknown words
// - custom dictionary stored in localStorage

// ===============
// Helper: cleanup
// ===============
function normalise(text) {
  return text
    .trim()
    .replace(/\s+/g, " ");
}

function toLowerNoWeird(text) {
  return text.toLowerCase();
}

// ==============================
// Base dictionaries (simple v2)
// ==============================

// English word → Lowkeese segment
// All keys should be lowercase.
const baseEnglishToLowkeese = {
  "hello": "lowkey!",
  "hi": "lowkey!",
  "bye": "lowkey…",

  "i": "lowkey",
  "me": "lowkey",
  "my": "lowkey",
  "mine": "lowkey",

  "you": "lowkey lowkey",
  "we": "lowkey lowkey lowkey",
  "they": "lowkey lowkey lowkey lowkey",

  "yes": "lowkē",
  "no": "low-key",
  "maybe": "lowkey?",

  "am": "lowkey",
  "are": "lowkey",
  "is": "lowkey",

  "like": "lowkē",
  "love": "lowkē",        // friendly "appreciate"
  "good": "lowkē",
  "bad": "low-key",

  "tired": "lowkey…",
  "park": "lowkē lowkey", // "good place"
  "friend": "lowkē",
  "friends": "lowkeyyy",  // playful group
  "with": "lowkey",       // generic connector
  "and": "lowkey",        // generic connector
  "to": "lowkey",         // light connector

  "went": "lowkey-lo",    // past "went"
  "go": "key-lowkey",     // future-ish "go"
  "will": "key-lowkey",   // approximated
  "come": "lowkē",        // positive arrival
  "came": "lowkē",        // same, we keep it simple

  "name": "lowkē",        // used in "my name is"
};

// Multi-word patterns (English → Lowkeese) before single words
// Keys are lowercased phrases.
const baseEnglishPhrasesToLowkeese = {
  "my name is": "lowkey lowkē", // name usually follows
  "i am": "lowkey lowkey",
  "i'm": "lowkey lowkey",
};

// Lowkeese → English (for single or multi tokens)
const baseLowkeeseToEnglish = {
  "lowkey!": "hello",
  "lowkey…": "bye",
  "lowkē": "good",
  "low-key": "no",
  "lowkey?": "maybe",

  "lowkey": "I", // default single
  "lowkey lowkey": "you",
  "lowkey lowkey lowkey": "we",
  "lowkey lowkey lowkey lowkey": "they",

  "lowkeyyy": "friends",
  "lowkē lowkey": "good place",
  "lowkey-lo": "went",
  "key-lowkey": "will go",
};

// ==============================
// Custom dictionary (user-added)
// ==============================

const CUSTOM_EN_KEY = "lowkeese_custom_en_to_low";
const CUSTOM_LO_KEY = "lowkeese_custom_low_to_en";

function loadCustomMap(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function saveCustomMap(key, obj) {
  try {
    localStorage.setItem(key, JSON.stringify(obj));
  } catch (e) {
    // ignore
  }
}

let customEnglishToLowkeese = loadCustomMap(CUSTOM_EN_KEY);
let customLowkeeseToEnglish = loadCustomMap(CUSTOM_LO_KEY);

// Merge helper (custom overrides base)
function getEnglishToLowkeeseDict() {
  return Object.assign({}, baseEnglishToLowkeese, customEnglishToLowkeese);
}

function getEnglishPhrasesToLowkeeseDict() {
  // phrases only from base right now; custom could also be phrases
  return baseEnglishPhrasesToLowkeese;
}

function getLowkeeseToEnglishDict() {
  return Object.assign({}, baseLowkeeseToEnglish, customLowkeeseToEnglish);
}

// ======================================
// Fallback: build Lowkeese-style words
// ======================================

// This is how we "cover every word": any unknown word
// gets turned into a Lowkeese-like thing based on pattern rules.
function fallbackEnglishWordToLowkeese(wordPart) {
  const lower = wordPart.toLowerCase();

  // Simple type guesses by ending:
  if (lower.endsWith("ing")) {
    // verb-ing → ongoing action
    return "lowkey…"; // e.g. "running" → "lowkey…"
  }

  if (lower.endsWith("ly")) {
    // adverb
    return "lowkeyyy"; // like "quickly" → "lowkeyyy"
  }

  if (lower.endsWith("ness") || lower.endsWith("tion") || lower.endsWith("ment")) {
    // noun / concept
    return "lōwkey";
  }

  if (lower[0] === lower[0].toLowerCase()) {
    // Common noun
    return "lowkē lowkey"; // generic "thing / place"
  }

  // Probably a name / proper noun
  return "lowkē(" + wordPart + ")"; // name marker
}

// ======================
// English → Lowkeese v2
// ======================
function translateEnglishToLowkeese(input) {
  const raw = normalise(input);
  if (!raw) return "";

  const text = toLowerNoWeird(raw);

  // Phrase-level replacements
  let processed = text;
  const englishPhrasesToLowkeese = getEnglishPhrasesToLowkeeseDict();

  Object.keys(englishPhrasesToLowkeese).forEach((phrase) => {
    const regex = new RegExp("\\b" + phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + "\\b", "gi");
    processed = processed.replace(regex, englishPhrasesToLowkeese[phrase]);
  });

  const words = normalise(processed).split(" ");
  const englishToLowkeese = getEnglishToLowkeeseDict();

  const out = words.map((w) => {
    // keep basic punctuation attached if needed
    const match = w.match(/^([a-zA-Z']+)([.,!?…]*)$/);
    if (!match) return w;

    const wordPart = match[1];
    const lowerWord = wordPart.toLowerCase();
    const punctPart = match[2] || "";

    // 1) custom or base dictionary mapping
    const mapped = englishToLowkeese[lowerWord];
    if (mapped) {
      return mapped + (punctPart ? punctPart : "");
    }

    // 2) fallback: auto-build Lowkeese-style token
    const fallback = fallbackEnglishWordToLowkeese(wordPart);
    return fallback + (punctPart ? punctPart : "");
  });

  return out.join(" ");
}

// ======================
// Lowkeese → English v2
// ======================

function translateLowkeeseToEnglish(input) {
  const raw = normalise(input);
  if (!raw) return "";

  const tokens = raw.split(" ");
  const results = [];
  let i = 0;

  const lowkeeseToEnglish = getLowkeeseToEnglishDict();

  while (i < tokens.length) {
    let matched = false;

    // Try multi-token sequences (4→2)
    for (let span = 4; span >= 2; span--) {
      if (i + span <= tokens.length) {
        const slice = tokens.slice(i, i + span).join(" ");
        const key = slice.toLowerCase();
        if (lowkeeseToEnglish[key]) {
          results.push(lowkeeseToEnglish[key]);
          i += span;
          matched = true;
          break;
        }
      }
    }

    if (matched) continue;

    const token = tokens[i];
    const key1 = token.toLowerCase();

    if (lowkeeseToEnglish[key1]) {
      results.push(lowkeeseToEnglish[key1]);
    } else if (key1 === "lowkey!") {
      results.push("hello");
    } else if (key1 === "lowkey…") {
      results.push("bye");
    } else if (/^lowkē\(.+\)$/.test(token)) {
      // name marker like lowkē(Ashley)
      const name = token.slice(6, -1);
      results.push(name);
    } else if (key1.startsWith("lowkey")) {
      // Generic fallback for "lowkey" forms
      results.push("lowkey");
    } else {
      // Unknown non-lowkey word → assume it's just a name/borrowed
      results.push(token);
    }

    i++;
  }

  let sentence = results.join(" ");
  sentence = sentence.replace(/\s+([.,!?…])/g, "$1");

  if (sentence.length > 0) {
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }

  return sentence;
}

// ======================
// Auto detect language
// ======================
function isProbablyLowkeese(text) {
  const lower = text.toLowerCase();
  const lowCount = (lower.match(/lowkey/g) || []).length;
  const wordCount = lower.split(/\s+/).length;
  return lowCount > 0 && lowCount >= wordCount / 2;
}

// ======================
// Teach custom words
// ======================
function teachCustomWord(english, lowkeese) {
  const en = normalise(english).toLowerCase();
  const low = normalise(lowkeese);

  if (!en || !low) return;

  customEnglishToLowkeese[en] = low;
  saveCustomMap(CUSTOM_EN_KEY, customEnglishToLowkeese);

  customLowkeeseToEnglish[low.toLowerCase()] = en;
  saveCustomMap(CUSTOM_LO_KEY, customLowkeeseToEnglish);
}

// ======================
// Wire up the UI
// ======================
window.addEventListener("DOMContentLoaded", () => {
  const inputEl = document.getElementById("inputText");
  const outputEl = document.getElementById("outputText");
  const btnEnToLow = document.getElementById("btnEnToLow");
  const btnLowToEn = document.getElementById("btnLowToEn");
  const btnDetect = document.getElementById("btnDetect");
  const btnClear = document.getElementById("btnClear");
  const outputModeLabel = document.getElementById("outputModeLabel");

  const teachEnglishEl = document.getElementById("teachEnglish");
  const teachLowkeeseEl = document.getElementById("teachLowkeese");
  const btnTeach = document.getElementById("btnTeach");

  function setOutput(text, modeLabel) {
    outputEl.value = text;
    outputModeLabel.textContent = modeLabel || "–";
  }

  btnEnToLow.addEventListener("click", () => {
    const input = inputEl.value;
    const translated = translateEnglishToLowkeese(input);
    setOutput(translated, "English → Lowkeese");
  });

  btnLowToEn.addEventListener("click", () => {
    const input = inputEl.value;
    const translated = translateLowkeeseToEnglish(input);
    setOutput(translated, "Lowkeese → English");
  });

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

  btnClear.addEventListener("click", () => {
    inputEl.value = "";
    setOutput("", "–");
  });

  if (btnTeach) {
    btnTeach.addEventListener("click", () => {
      const en = teachEnglishEl.value;
      const low = teachLowkeeseEl.value;
      teachCustomWord(en, low);
      teachEnglishEl.value = "";
      teachLowkeeseEl.value = "";
      alert("Added to Lowkeese dictionary: \"" + en + "\" ↔ \"" + low + "\"");
    });
  }
});
