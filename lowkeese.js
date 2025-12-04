// Lowkeese v2 Translation Engine
// - English → Lowkeese (speakable, fun)
// - Lowkeese → English (best-effort, with patterns)
// - Custom dictionary support (saved in localStorage)

// =====================
// Helpers
// =====================

function normalise(text) {
  return text.trim().replace(/\s+/g, " ");
}

function toLowerNoWeird(text) {
  return text.toLowerCase();
}

function splitWordPunct(w) {
  const match = w.match(/^(.+?)([.,!?…]*)$/);
  return match ? { word: match[1], punct: match[2] } : { word: w, punct: "" };
}

// =====================
// Base dictionaries
// =====================

// Core English → Lowkeese words (v2 basics + expansion pack)
const baseEnglishToLowkeese = {
  // Greetings
  "hello": "lowkey!",
  "hi": "lowkey!",
  "bye": "lowkey…",

  // Pronouns
  "i": "lowkey",
  "me": "lowkey",
  "my": "lowkey",
  "mine": "lowkey",

  "you": "lowkey lowkey",
  "we": "lowkey lowkey lowkey",
  "they": "lowkey lowkey lowkey lowkey",

  // Yes / no / maybe
  "yes": "lowkē",
  "no": "low-key",
  "maybe": "lowkey?",

  // Be verbs
  "am": "lowkey",
  "are": "lowkey",
  "is": "lowkey",

  // Core feelings / quality
  "like": "lowkē",
  "love": "lowkē",        // friendly "appreciate"
  "good": "lowkē",
  "bad": "low-key",

  "tired": "lowkey…",

  // Connectors
  "with": "lowkey-with",
  "and": "lowkey",
  "to": "lowkey",

  // Time / tense-ish
  "went": "lowkey-lo",    // past "went"
  "go": "key-lowkey",     // future-ish "go"
  "will": "key-lowkey",   // approximated
  "come": "lowkē",
  "came": "lowkē",

  // Name / identity
  "name": "lowkē",        // used in "my name is"

  // ---- Expansion pack: people & social ----
  "friend": "lowkē",
  "friends": "lowkeyyy",
  "family": "lowkē lowkeyyy",
  "mum": "lowkē(mum)",
  "mom": "lowkē(mum)",
  "dad": "lowkē(dad)",
  "brother": "lowkē(brother)",
  "sister": "lowkē(sister)",
  "teacher": "lowkē(teacher)",

  // ---- Places ----
  "home": "lowkey home",
  "house": "lowkey home",
  "school": "lōwkey school",
  "park": "lowkē lowkey",
  "shop": "lowkē shop",
  "room": "lōwkey room",
  "office": "LOWKEY room",
  "city": "lōwkey city",
  "street": "lowkey street",

  // ---- Games / tech / internet ----
  "game": "lowkē game",
  "controller": "lowkey controller",
  "xbox": "lowkē(Xbox)",
  "pc": "lowkē(PC)",
  "phone": "lowkey phone",
  "message": "lowkē msg",
  "messages": "lowkē msg",
  "app": "lowkē app",

  // ---- Actions ----
  "play": "lowkē-play",
  "talk": "lowkē-talk",
  "say": "lowkey-speak",
  "said": "lowkey-speak-lo",
  "walk": "lowkē-walk",
  "run": "lowkē-run",
  "call": "lowkē-call",
  "use": "lowkē-use",
  "make": "lowkē-make",
  "want": "LOWkey",
  "needs": "LOWkey-lowkey",
  "need": "LOWkey-lowkey",

  // ---- Feelings / descriptions (safe) ----
  "happy": "lowkē!",
  "sad": "lōwkey…",
  "excited": "lowkey!",
  "bored": "low-key…",
  "confused": "lowkey?!",
  "funny": "lowkeyyyy",
  "scary": "lōwkey!",
  "okay": "lowkē",
  "fine": "lowkē",
  "not": "low-key",
  "ok": "lowkē",

  // Extra common stuff
  "in": "lowkey",
  "at": "lowkey",
  "on": "lowkey",
  "after": "lowkey…",
};

// Phrase-level patterns handled before single words
const baseEnglishPhrasesToLowkeese = {
  "my name is": "lowkey lowkē", // followed by name
  "i am": "lowkey lowkey",
  "i'm": "lowkey lowkey",
};

// Lowkeese → English (basic reverse mapping)
const baseLowkeeseToEnglish = {
  "lowkey!": "hello",
  "lowkey…": "bye",
  "lowkē": "good",
  "low-key": "no",
  "lowkey?": "maybe",

  "lowkey": "I", // default single lowkey
  "lowkey lowkey": "you",
  "lowkey lowkey lowkey": "we",
  "lowkey lowkey lowkey lowkey": "they",

  "lowkeyyy": "friends",
  "lowkē lowkey": "good place",
  "lowkey-lo": "went",
  "key-lowkey": "will go",

  "lowkē!": "happy",
  "lōwkey…": "sad",
  "lowkey!": "excited",
  "low-key…": "bored",
  "lowkey?!": "confused",
  "lowkeyyyy": "funny",
  "lōwkey!": "scary",
  "lowkey-with": "with",
  "lowkey-speak": "say",
  "lowkey-speak-lo": "said",
  "lowkē-play": "play",
  "lowkē-talk": "talk",
  "lowkē-walk": "walk",
  "lowkē-run": "run",
  "lowkē-call": "call",
  "lowkē-make": "make",
  "lowkē-use": "use",
  "lowkē game": "game",
  "lowkey controller": "controller",
  "lowkey phone": "phone",
  "lowkē msg": "message",
  "lowkē app": "app",
  "lowkey home": "home",
  "lōwkey school": "school",
  "lowkē shop": "shop",
  "lōwkey room": "room",
  "LOWKEY room": "office",
};

// =====================
// Custom dictionary
// =====================

const CUSTOM_EN_KEY = "lowkeese_custom_en_to_low";
const CUSTOM_LO_KEY = "lowkeese_custom_low_to_en";

function loadCustomMap(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveCustomMap(key, obj) {
  try {
    localStorage.setItem(key, JSON.stringify(obj));
  } catch {
    // ignore
  }
}

let customEnglishToLowkeese = loadCustomMap(CUSTOM_EN_KEY);
let customLowkeeseToEnglish = loadCustomMap(CUSTOM_LO_KEY);

function getEnglishToLowkeeseDict() {
  return Object.assign({}, baseEnglishToLowkeese, customEnglishToLowkeese);
}

function getEnglishPhrasesToLowkeeseDict() {
  // You could merge custom phrases here later if you want
  return baseEnglishPhrasesToLowkeese;
}

function getLowkeeseToEnglishDict() {
  return Object.assign({}, baseLowkeeseToEnglish, customLowkeeseToEnglish);
}

// ==============================
// Fallback: auto-build Lowkeese
// ==============================

function fallbackEnglishWordToLowkeese(wordPart) {
  const lower = wordPart.toLowerCase();

  if (lower.endsWith("ing")) {
    // running / talking / playing → ongoing action vibe
    return "lowkey…";
  }

  if (lower.endsWith("ly")) {
    // quickly, slowly → adverb style
    return "lowkeyyy";
  }

  if (
    lower.endsWith("ness") ||
    lower.endsWith("tion") ||
    lower.endsWith("ment")
  ) {
    // concepts / abstract nouns
    return "lōwkey";
  }

  if (lower[0] === lower[0].toLowerCase()) {
    // common noun
    return "lowkē lowkey";
  }

  // probably a name / proper noun
  return "lowkē(" + wordPart + ")";
}

// ==============================
// English → Lowkeese v2
// ==============================

function translateEnglishToLowkeese(input) {
  const raw = normalise(input);
  if (!raw) return "";

  const text = toLowerNoWeird(raw);

  // apply phrase replacements first (e.g. "my name is")
  let processed = text;
  const englishPhrasesToLowkeese = getEnglishPhrasesToLowkeeseDict();

  Object.keys(englishPhrasesToLowkeese).forEach((phrase) => {
    const regex = new RegExp(
      "\\b" + phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + "\\b",
      "gi"
    );
    processed = processed.replace(regex, englishPhrasesToLowkeese[phrase]);
  });

  const words = normalise(processed).split(" ");
  const englishToLowkeese = getEnglishToLowkeeseDict();

  const out = words.map((w) => {
    const { word, punct } = splitWordPunct(w);
    const lowerWord = word.toLowerCase();

    // 1) dictionary lookup (base + custom)
    const mapped = englishToLowkeese[lowerWord];
    if (mapped) {
      return mapped + (punct || "");
    }

    // 2) fallback pattern
    const fallback = fallbackEnglishWordToLowkeese(word);
    return fallback + (punct || "");
  });

  return out.join(" ");
}

// ==============================
// Lowkeese → English v2
// ==============================

function translateLowkeeseToEnglish(input) {
  const raw = normalise(input);
  if (!raw) return "";

  const tokens = raw.split(" ");
  const results = [];
  let i = 0;

  const lowkeeseToEnglish = getLowkeeseToEnglishDict();

  while (i < tokens.length) {
    let matched = false;

    // Try 4-word, then 3-word, then 2-word matches
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

    const tokenRaw = tokens[i];
    const { word, punct } = splitWordPunct(tokenRaw);
    const key1 = word.toLowerCase();

    // 1) direct mapping
    if (lowkeeseToEnglish[key1]) {
      results.push(lowkeeseToEnglish[key1] + punct);
    }
    // 2) hello / bye variants
    else if (key1 === "lowkey!") {
      results.push("hello" + punct);
    } else if (key1 === "lowkey…") {
      results.push("bye" + punct);
    }
    // 3) name marker: lowkē(Name)
    else if (/^lowkē\(.+\)$/.test(word)) {
      const name = word.slice(6, -1); // between lowkē( and )

      // If previous token was "lowkey", interpret as "my name is Name"
      if (
        i > 0 &&
        tokens[i - 1].toLowerCase().replace(/[.,!?…]/g, "") === "lowkey"
      ) {
        // Remove previous translation ("I" or "my")
        results.pop();
        results.push("my name is " + name + punct);
      } else {
        results.push(name + punct);
      }
    }
    // 4) any "lowkey-..." vibes → generic "lowkey"
    else if (key1.startsWith("lowkey") || key1.startsWith("lowkē") || key1.startsWith("lōwkey")) {
      results.push("lowkey" + punct);
    }
    // 5) unknown non-lowkey token → keep as-is (probably name)
    else {
      results.push(word + punct);
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

// ==============================
// Auto-detect
// ==============================

function isProbablyLowkeese(text) {
  const lower = text.toLowerCase();
  const lowCount = (lower.match(/lowkey/g) || []).length;
  const wordCount = lower.split(/\s+/).length;
  return lowCount > 0 && lowCount >= wordCount / 2;
}

// ==============================
// Teach custom words
// ==============================

function teachCustomWord(english, lowkeese) {
  const en = normalise(english).toLowerCase();
  const low = normalise(lowkeese);
  if (!en || !low) return;

  customEnglishToLowkeese[en] = low;
  saveCustomMap(CUSTOM_EN_KEY, customEnglishToLowkeese);

  customLowkeeseToEnglish[low.toLowerCase()] = en;
  saveCustomMap(CUSTOM_LO_KEY, customLowkeeseToEnglish);
}

// ==============================
// Wire up the UI
// ==============================

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
      alert(
        'Added to Lowkeese dictionary: "' + en + '" ↔ "' + low + '"'
      );
    });
  }
});
