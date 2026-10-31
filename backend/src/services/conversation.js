/**
 * Small talk and call control.
 *
 * A phone call starts with "hello", ends with "thank you", and in between
 * people ask "who are you" or "what can you do". None of that is in a knowledge
 * base, so it is handled here, in the caller's language, before retrieval runs.
 *
 * A greeting is only treated as a greeting when it really is one: "hello, what
 * is PM-KISAN" is a question and goes to the knowledge base.
 */
const { text, CALL_LANGS, nameOf } = require('../data/languages');

const QUESTION_LIKE = /(\?|what |how |why |when |where |which |who is |kya |kaise |kab |kahan |kyun |kitna |kitni |enu |hege |yake |yelli |ಏನು|ಹೇಗೆ|ಯಾಕೆ|ಯಾರು|क्या|कैसे|कब|कहां)/i;

/**
 * \b is useless for Devanagari, Kannada and the other Indic scripts, because
 * they are not \w in JavaScript. These two helpers give a real word boundary
 * for any script.
 */
const NOT_LETTER_BEFORE = '(?<![\\p{L}\\p{M}])';
const NOT_LETTER_AFTER = '(?![\\p{L}\\p{M}])';
const boundary = (body) => new RegExp(`${NOT_LETTER_BEFORE}(?:${body})${NOT_LETTER_AFTER}`, 'iu');

const INTENTS = [
  {
    id: 'goodbye',
    key: 'goodbye',
    end: true,
    exclusive: true,
    test: boundary('bye|goodbye|good bye|end the call|cut the call|phone rakh[\\p{L}\\p{M}]*|rakhta hoon|band karo|अलविदा|फोन रख[\\p{L}\\p{M}]*|फ़ोन रख[\\p{L}\\p{M}]*|कॉल बंद|ಮುಗಿಸಿ|ಬೈ|ಕರೆ ಮುಗಿಸು'),
  },
  {
    id: 'thanks',
    key: 'thanks',
    exclusive: true,
    test: boundary('thanks|thank you|thanku|dhanyavad|dhanyawad|dhanyavaad|shukriya|धन्यवाद|शुक्रिया|ಧನ್ಯವಾದ|ನಂದಿ'),
  },
  {
    id: 'not-heard',
    key: 'askAgain',
    exclusive: true,
    test: boundary('repeat|say again|again please|samajh nahi|samjha nahi|phir bolo|फिर बोल|समझ नहीं|माफ कर|ಮತ್ತೆ ಹೇಳಿ|ಅರ್ಥ ಆಗಲಿಲ್ಲ'),
  },
  {
    id: 'who',
    key: 'who',
    test: boundary('who are you|your name|what is your name|are you a robot|are you human|kaun ho|tum kaun|aap kaun|नाम क्या|कौन हो|रोबोट|ಯಾರು ನೀನು|ನಿಮ್ಮ ಹೆಸರು|ಯಂತ್ರ'),
  },
  {
    id: 'can-do',
    key: 'canDo',
    test: boundary('what can you do|how can you help|can you help|help me|kya kar sakte|kaise madad|मदद कर|क्या कर सकते|ಸಹಾಯ ಮಾಡು|ಏನು ಮಾಡಬಲ್ಲ'),
  },
  {
    id: 'languages',
    key: 'canDo',
    test: boundary('which language|what languages|do you speak|kaun si bhasha|कौन सी भाषा|भाषा बोल|ಯಾವ ಭಾಷೆ|ಭಾಷೆಗಳು'),
  },
  {
    id: 'greeting',
    key: 'greeting',
    exclusive: true,
    test: new RegExp(`^(?:hi|hii|hello|hey|namaste|namaskar|namaskara|namaskaram|vanakkam|namaskaramu|sat sri akal|salaam|assalam|adaab|नमस्ते|नमस्कार|ನಮಸ್ಕಾರ|ವಣಕ್ಕಂ|వణಕ್ಕం|নমস্কার|નમસ્તે)${NOT_LETTER_AFTER}`, 'iu'),
  },
];

function words(input) {
  return String(input || '').trim().split(/\s+/).filter(Boolean);
}

/** Every language the call can hold a conversation in, for the "languages" intent. */
function languageList() {
  return CALL_LANGS.map((code) => nameOf(code).native).join(', ');
}

/**
 * @returns {{intent: string, reply: string, end?: boolean}|null}
 */
function match(input, lang) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  const questionLike = QUESTION_LIKE.test(raw);
  const short = words(raw).length <= 6;

  for (const intent of INTENTS) {
    if (!intent.test.test(raw)) continue;
    // A greeting or a thank-you is only that if it is not also a question.
    if (intent.exclusive && questionLike) continue;
    if (intent.exclusive && !short) continue;
    const reply = intent.id === 'languages'
      ? `${text(lang, 'canDo')} ${languageList()}.`
      : text(lang, intent.key);
    return { intent: intent.id, reply, end: Boolean(intent.end) };
  }
  return null;
}

/**
 * "Tell me more" — continues the previous answer instead of asking a new
 * question. Kept separate from the intents because it needs the stored answer.
 */
const MORE_REQUEST = new RegExp(
  `${NOT_LETTER_BEFORE}(?:more|more please|tell me more|continue|go on|aage|aur batao|aur bata|aur sunao|baaki|baki|poora batao|और बताओ|और बताइए|आगे|बाकी|पूरा बताओ|innu heli|hechchu heli|munde heli|ಇನ್ನೂ ಹೇಳಿ|ಮುಂದೆ ಹೇಳಿ|ಪೂರ್ತಿ ಹೇಳಿ)${NOT_LETTER_AFTER}`,
  'iu',
);

function isMoreRequest(input) {
  const t = String(input || '').trim();
  if (!t) return false;
  if (words(t).length > 6) return false;
  return MORE_REQUEST.test(t);
}

module.exports = { match, languageList, isMoreRequest };
