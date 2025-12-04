// lowkeese.js
// Simple Lowkeese v2 translation engine.

// ===============
// Helper: cleanup
// ===============
function normalise(text) {
  return text
    .trim()
    .replace(/\s+/g, " ");
}

// Lowercase but keep punctuation like ! ? …
function toLowerNoWeird(text) {
  return text.toLowerCase();
}

// ==============================
// Dictionaries (very simple v2)
// ==============================

// English word → Lowkeese segment
// All keys should be lowercase.
const englishToLowkeese = {
  "hello": "lowkey!",
  "hi": "lowkey!",
  "bye": "lowkey…",

  "i": "lowkey",
  "me": "lowkey",
  "my": "lowkey",

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
  "hello,": "lowkey!",    // allow commas sometimes
};

// Multi-word patterns (English → Lowkeese) before single words
// Keys are lowercased phrases.
const englishPhrasesToLowkeese = {
  "my name is": "lowkey lowkē", // name usually follows
  "i am": "lowkey lowkey",
  "i'm": "lowkey lowkey",
};

// Lowkeese → English (for single or multi tokens)
const lowkeeseToEnglishMap = {
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

  "lowkey… (tired)": "tired", // just in case we tag like this later
};

// ======================
// English → Lowkeese v2
// ======================
function translateEnglishToLowkeese(input) {
  const raw = normalise(input);
  if (!raw) return "";

  const text = toLowerNoWeird(raw);

  // First handle phrase-level replacements (like "my name is")
  let processed = text;

  Object.keys(englishPhrasesToLowkeese).forEach((phrase) => {
    const regex = new RegExp("\\b" + phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + "\\b", "gi");
    processed = processed.replace(regex, englishPhrasesToLowkeese[phrase]);
  });

  // Split remaining words
  const words = normalise(processed).split(" ");

  const out = words.map((w) => {
    // keep basic punctuation attached if needed
    const match = w.match(/^([a-zA-Z']+)([.,!?…]*)$/);
    if (!match) return w;

    const wordPart = match[1].toLowerCase();
    const punctPart = match[2] || "";

    const mapped = englishToLowkeese[wordPart];
    if (mapped) {
      return mapped + (punctPart ? punctPart : "");
    }

    // If unknown (like names), keep as-is but capitalised
    const pretty = wordPart.charAt(0).toUpperCase() + wordPart.slice(1);
    return pretty + (punctPart ? punctPart : "");
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

  // Try to match multi-word lowkeese patterns first
  while (i < tokens.length) {
    // Try 4-word, then 3, 2, then 1
    let matched = false;

    for (let span = 4; span >= 2; span--) {
      if (i + span <= tokens.length) {
        const slice = tokens.slice(i, i + span).join(" ");
        const key = slice.toLowerCase();
        if (lowkeeseToEnglishMap[key]) {
          results.push(lowkeeseToEnglishMap[key]);
          i += span;
          matched = true;
          break;
        }
      }
    }

    if (matched) continue;

    // Single token fallback
    const token = tokens[i];
    const key1 = token.toLowerCase();

    if (lowkeeseToEnglishMap[key1]) {
      results.push(lowkeeseToEnglishMap[key1]);
    } else if (key1 === "lowkey!") {
      results.push("hello");
    } else if (key1 === "lowkey…") {
      results.push("bye");
    } else if (key1.startsWith("lowkey")) {
      // Generic fallback for "lowkey" forms
      results.push("lowkey");
    } else {
      // Probably a name or unknown word, keep as-is
      results.push(token);
    }

    i++;
  }

  // Clean up spacing, lowercase+capitalise first letter
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
  // If it mostly contains "lowkey" variations, assume Lowkeese
  const lowCount = (lower.match(/lowkey/g) || []).length;
  const wordCount = lower.split(/\s+/).length;
  return lowCount > 0 && lowCount >= wordCount / 2;
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
});
