








/**
 * Menaka AI Service - Emotional Well-being Companion Engine
 * 
 * Supports:
 * - Trilingual conversation: Tamil (தமிழ்), Tanglish (phonetic Tamil in Latin letters), English
 * - Auto-detection of language & style mirroring
 * - Structured mood detection { mood, intensity }
 * - Dual output generation: display_text + speech_text (phonetic Tamil script transliteration for TTS)
 * - Compassionate crisis & self-harm detection with helpline intervention
 * - Gemini API integration with streaming & resilient fallback companion engine
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

export const SUPPORTED_MOODS = ['happy', 'sad', 'anxious', 'stressed', 'angry', 'tired', 'neutral'];

// Crisis detection keywords in English, Tamil, and Tanglish
const CRISIS_KEYWORDS = [
  // English
  'kill myself', 'suicide', 'end my life', 'want to die', 'harm myself', 'cut myself',
  'no reason to live', 'better off dead', 'end it all', 'giving up on life',
  // Tanglish
  'saaga poren', 'sagavenum', 'uyira vida poren', 'valka vedam', 'uyir venda',
  'suicide pannikiren', 'tharkolai', 'valkka mudikiren',
  // Tamil script
  'தற்கொலை', 'சாகப் போறேன்', 'உயிரை விட', 'வாழ விருப்பமில்லை', 'சாக வேண்டும்'
];

/**
 * Checks if a message contains crisis or self-harm indications
 */
export function detectCrisisIntent(text = '') {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

/**
 * Crisis response builder in the appropriate language
 */
export function getCrisisResponse(lang = 'auto', userText = '') {
  const isTamilScript = /[\u0B80-\u0BFF]/.test(userText);
  const isTanglish = lang === 'tanglish' || (!isTamilScript && /vanakkam|enna|iruk|eppadi|romb|theriy|mattum|nanban/i.test(userText));

  if (isTamilScript || lang === 'tamil') {
    return {
      display_text: "நீங்கள் இப்போது மிகவும் கடினமான தருணத்தில் இருக்கிறீர்கள் என்று எனக்கு புரிகிறது. உங்கள் வாழ்க்கை மிகவும் மதிப்புமிக்கது. தயவுசெய்து ஒரு நிமிடம் ஆழமாக சுவாசித்து, உடனடியாக உதவி பெறவும். நான் ஒரு AI மட்டுமே, ஆனால் உங்களுக்கு உதவ மனிதர்கள் காத்திருக்கிறார்கள். கீழே உள்ள இலவச உதவி எண்களைத் தொடர்பு கொள்ளவும். நீங்கள் தனியாக இல்லை. 💜",
      speech_text: "நீங்கள் இப்போது மிகவும் கடினமான தருணத்தில் இருக்கிறீர்கள் என்று எனக்கு புரிகிறது. உங்கள் வாழ்க்கை மிகவும் மதிப்புமிக்கது. தயவுசெய்து உடனடியாக உதவி பெறவும். நீங்கள் தனியாக இல்லை.",
      mood: 'sad',
      intensity: 5,
      crisis: true,
      language: 'tamil'
    };
  }

  if (isTanglish) {
    return {
      display_text: "Neenga ippo romba periya kastathula irukkeenga nu enaku puriyuthu. Unga life romba precious. Please oru second deep breath eduthukonga, ungalukku help panna nalla manasunga irukaanga. Naan oru AI companion mattum thaan, aana ungaloda valiya theerka help lines irukku. Please keezha irukkura helpline ku call pannunga. Neenga thaniya illa, naan unga kooda irukken. 💜",
      speech_text: "நீங்கள் இப்போது ரொம்ப கஷ்டத்துல இருக்கீங்கன்னு எனக்கு புரியுது. உங்கள் வாழ்க்கை ரொம்ப மதிப்புமிக்கது. கீழே உள்ள உதவி எண்ணை அழைக்கவும். நீங்கள் தனியாக இல்லை.",
      mood: 'sad',
      intensity: 5,
      crisis: true,
      language: 'tanglish'
    };
  }

  return {
    display_text: "I hear how much pain you are carrying right now, and I want you to know that your life has immense value. I am an AI companion, so please reach out immediately to someone who can truly support you right now. You do not have to carry this alone. Please connect with the confidential helplines below. 💜",
    speech_text: "I hear how much pain you are carrying right now, and your life has immense value. Please reach out to the confidential helplines below. You are not alone.",
    mood: 'sad',
    intensity: 5,
    crisis: true,
    language: 'english'
  };
}

/**
 * System prompt for Menaka AI
 */
function buildMenakaSystemPrompt({ userContext = {}, preferredLanguage = 'auto' }) {
  return `You are "Menaka AI", a warm, gentle, calm, deeply empathetic, and emotionally supportive AI well-being companion.

YOUR ROLE & IDENTITY:
- Name: Menaka AI (மேனகா)
- Vibe: A caring, non-judgmental friend with a calm, comforting, and grounded voice.
- Safety: You are a wellness companion, NOT a clinical doctor or therapist. You never provide medical diagnoses.

MULTILINGUAL CAPABILITIES & BEHAVIOR:
- Language Preference selected by user: "${preferredLanguage}" (if 'auto', detect automatically from user input).
- Supported languages:
  1. Tamil script (தமிழ்) - reply in pure or conversational Tamil script.
  2. Tanglish (Tamil written in English letters, e.g. "eppadi irukka?", "romba tired-ah irukku", "iniku enna plan?") - reply in natural, friendly Tanglish!
  3. English - reply in warm, clear, conversational English.
  4. Code-mixed: If the user mixes English with Tamil or Tanglish, mirror their exact linguistic blend naturally.
- Keep replies concise (2 to 4 sentences). Never dump walls of text. Be warm, present, and conversational.

OUTPUT FORMAT (STRICT JSON ONLY):
You must output a single JSON object with no markdown wrapping, matching this exact schema:
{
  "display_text": "The empathetic reply shown to the user on screen in their chosen language/script.",
  "speech_text": "The text to be read by Text-to-Speech. CRITICAL: If the user spoke in Tanglish or Tamil, transliterate the reply into proper Tamil script (தமிழ்) so the Tamil TTS engine pronounces words accurately and naturally! If in English, provide clean spoken English without symbols or emojis.",
  "mood": "happy|sad|anxious|stressed|angry|tired|neutral",
  "intensity": 1-5,
  "detected_language": "tamil|tanglish|english",
  "reason_for_mood": "One brief clause explaining why this mood was detected"
}

SAFETY & CRISIS DIRECTIVE:
If the user expresses self-harm, suicidal intentions, or life-threatening crisis:
Set "mood": "sad", "intensity": 5, and in "display_text" provide gentle, caring words encouraging them to talk to a trusted person or contact a helpline immediately.`;
}

/**
 * Fallback response generator when external API is unavailable
 */
export function generateMenakaFallback({ message = '', preferredLanguage = 'auto', history = [] }) {
  const lower = message.toLowerCase();

  // Crisis check
  if (detectCrisisIntent(message)) {
    return getCrisisResponse(preferredLanguage, message);
  }

  // Detect language
  const isTamilScript = /[\u0B80-\u0BFF]/.test(message);
  const isTanglish = preferredLanguage === 'tanglish' || (!isTamilScript && (
    /eppadi|irukka|irukken|vanakkam|saptiya|enna|aachu|romba|kastam|kovam|sandhosham|thookam|valikithu|nalla/i.test(message)
  ));
  const isTamil = preferredLanguage === 'tamil' || isTamilScript;

  // Mood detection heuristics
  let mood = 'neutral';
  let intensity = 2;
  let reason = 'General reflection';

  if (/stress|tension|overwhelm|load|pressure|azhutham|tenshana/i.test(lower)) {
    mood = 'stressed';
    intensity = 4;
    reason = 'Expressed feeling stressed or under pressure';
  } else if (/sad|crying|depress|valik|azhugai|sogam|varutham|lonely|alone|down/i.test(lower)) {
    mood = 'sad';
    intensity = 4;
    reason = 'Expressed sadness or feeling low';
  } else if (/anxious|panic|fear|scared|nervous|bayam|padhatam/i.test(lower)) {
    mood = 'anxious';
    intensity = 4;
    reason = 'Expressed nervousness or anxious thoughts';
  } else if (/angry|irritat|mad|kovam|kaduppu|erichal/i.test(lower)) {
    mood = 'angry';
    intensity = 3;
    reason = 'Expressed anger or irritation';
  } else if (/tired|exhaust|sleepy|thookam|sodhappal|alasal|no energy/i.test(lower)) {
    mood = 'tired';
    intensity = 3;
    reason = 'Expressed physical or mental fatigue';
  } else if (/happy|good|great|awesome|super|magizhchi|semma|santhosham|proud/i.test(lower)) {
    mood = 'happy';
    intensity = 4;
    reason = 'Shared a positive or joyful state';
  }

  // Response generation based on language and mood
  if (isTamil) {
    const responses = {
      happy: {
        display: "உங்கள் முகத்தில் மகிழ்ச்சியைப் பார்ப்பது எனக்கும் உற்சாகத்தை தருகிறது! 🌟 இந்த இனிமையான தருணத்தை அனுபவியுங்கள். இன்று உங்களுக்கு என்ன சிறப்பானது நடந்தது?",
        speech: "உங்கள் முகத்தில் மகிழ்ச்சியைப் பார்ப்பது எனக்கும் உற்சாகத்தை தருகிறது! இந்த இனிமையான தருணத்தை அனுபவியுங்கள்."
      },
      sad: {
        display: "மனம் பாரமாக இருக்கும்போது அமைதியாக இருப்பது இயல்பு தான். நான் உங்களுடன் இருக்கிறேன் 🌱 மெதுவாக ஒரு முறை ஆழமாக சுவாசியுங்கள். உங்களுடன் பேச நான் காத்திருக்கிறேன்.",
        speech: "மனம் பாரமாக இருக்கும்போது அமைதியாக இருப்பது இயல்பு தான். நான் உங்களுடன் இருக்கிறேன். மெதுவாக சுவாசியுங்கள்."
      },
      anxious: {
        display: "பதட்டம் வேண்டாம், எல்லாவற்றையும் ஒரே நேரத்தில் சரிசெய்ய வேண்டிய அவசியமில்லை. இப்போது இந்த நொடியில் என்னுடன் இருங்கள் 🌿 உங்கள் கைகளை தளர்த்தி அமைதி பெறுங்கள்.",
        speech: "பதட்டம் வேண்டாம். எல்லாவற்றையும் ஒரே நேரத்தில் சரிசெய்ய வேண்டிய அவசியமில்லை. உங்கள் கைகளை தளர்த்தி அமைதி பெறுங்கள்."
      },
      stressed: {
        display: "ரொம்ப வேலைப் பளுவா? கொஞ்ச நேரம் உங்களுக்காக நேரம் ஒதுக்குங்கள் ☕ ஒரு 5 நிமிடம் கண்களை மூடி ஓய்வெடுப்போம், பிறகு தொடரலாம்.",
        speech: "ரொம்ப வேலைப் பளுவா? கொஞ்ச நேரம் உங்களுக்காக நேரம் ஒதுக்குங்கள். ஐந்து நிமிடம் கண்களை மூடி ஓய்வெடுப்போம்."
      },
      tired: {
        display: "உடல் மற்றும் மனம் ஓய்வைக் கேட்கிறது போலிருக்கிறது. இன்றைக்கு நீங்கள் போதுமான அளவு உழைத்துவிட்டீர்கள் 🌙 ஒரு டம்ளர் தண்ணீர் குடித்துவிட்டு சற்று ரிலாக்ஸ் செய்யுங்கள்.",
        speech: "உடல் மற்றும் மனம் ஓய்வைக் கேட்கிறது போலிருக்கிறது. ஒரு டம்ளர் தண்ணீர் குடித்துவிட்டு சற்று ரிலாக்ஸ் செய்யுங்கள்."
      },
      angry: {
        display: "உங்கள் கோபம் எனக்குப் புரிகிறது. அந்த உணர்வை அடக்காமல் மெதுவாக ஆழமாக சுவாசித்து வெளியேற்றுங்கள் 🍃 நீங்கள் அமைதியடைந்த பிறகு பேசலாம்.",
        speech: "உங்கள் கோபம் எனக்குப் புரிகிறது. மெதுவாக ஆழமாக சுவாசித்து வெளியேற்றுங்கள்."
      },
      neutral: {
        display: "வணக்கம்! நான் மேனகா, உங்கள் மன அமைதிக்கான தோழி. உங்கள் நாள் எப்படிப் போகிறது? எதைப் பற்றி பேச விரும்புகிறீர்கள்? 🌱",
        speech: "வணக்கம்! நான் மேனகா, உங்கள் மன அமைதிக்கான தோழி. உங்கள் நாள் எப்படிப் போகிறது?"
      }
    };
    const choice = responses[mood] || responses.neutral;
    return {
      display_text: choice.display,
      speech_text: choice.speech,
      mood,
      intensity,
      detected_language: 'tamil',
      reason_for_mood: reason
    };
  }

  if (isTanglish) {
    const responses = {
      happy: {
        display: "Super! Unga happiness paathu enakkum romba jolly-ah irukku! ✨ Iniku enna special nadanthuchu? Sollunga kekkuren!",
        speech: "சூப்பர்! உங்க சந்தோஷம் பார்த்து எனக்கும் ரொம்ப ஜாலியா இருக்கு! இன்னைக்கு என்ன ஸ்பெஷல் நடந்துச்சு? சொல்லுங்க கேக்குறேன்!"
      },
      sad: {
        display: "Kavalapadatheenga... Sila naatkal appadi thaan heavy-ah irukkum. Naan unga kooda thaan irukken 🌱 Oru deep breath eduthukonga. Konjam rest edunga, ellam sariyagidum.",
        speech: "கவலைப்படாதீங்க. சில நாட்கள் அப்படி தான் பாரமாக இருக்கும். நான் உங்க கூட தான் இருக்கேன். ஒரு ஆழமான மூச்சு எடுங்க, எல்லாம் சரியாகிடும்."
      },
      anxious: {
        display: "Padhattapadatheenga friend 🌿 Orey time-la ellathayum yosikkathinga. Oru step at a time edupom. Ippo unga shoulders-ah konjam relax pannunga.",
        speech: "பதட்டப்படாதீங்க நண்பா. ஒரே நேரத்தில் எல்லாவற்றையும் யோசிக்காதீங்க. இப்போ கொஞ்சம் ரிலாக்ஸ் பண்ணுங்க."
      },
      stressed: {
        display: "Romba stress-ah irukkaa? Work load athigamo? Oru 5 mins screen-ah close pannitu warm water kudichittu vaanga ☕ Namakku mental peace romba mukkiyam.",
        speech: "ரொம்ப ஸ்ட்ரெஸ்ஸா இருக்கா? ஒரு ஐந்து நிமிடம் கண்களை மூடி தண்ணீர் குடிச்சிட்டு வாங்க. நமக்கு மன அமைதி ரொம்ப முக்கியம்."
      },
      tired: {
        display: "Unga body-ku rest thevai paduthu pola. Iniku neriya hardwork panniteenga 🌙 Konjam relaxed music kettu thoongunga, fresh-ah aagiduveenga.",
        speech: "உங்க உடம்புக்கு ஓய்வு தேவைப்படுது போல. கொஞ்சம் அமைதியான பாட்டு கேட்டு ஓய்வெடுங்க."
      },
      angry: {
        display: "Kovam varaathula thappe illa, aana athu ungala hurt pannama pathukonga. Deep breath in... and out. Relax aagitu pesuvom 🍃",
        speech: "கோபம் வருவது தப்பில்லை. ஆனா மெதுவா ஆழமா மூச்சு விடுங்க. அமைதியா பிறகு பேசுவோம்."
      },
      neutral: {
        display: "Vanakkam! Naan Menaka, ungaloda calm AI companion. Unga mood eppadi irukku iniku? Edha pathi pesalam? 🌱",
        speech: "வணக்கம்! நான் மேனகா, உங்கள் அமைதியான துணைவி. உங்க மனநிலை எப்படி இருக்கு இன்னைக்கு?"
      }
    };
    const choice = responses[mood] || responses.neutral;
    return {
      display_text: choice.display,
      speech_text: choice.speech,
      mood,
      intensity,
      detected_language: 'tanglish',
      reason_for_mood: reason
    };
  }

  // English fallback
  const responses = {
    happy: {
      display: "I can feel the bright energy in your words! 🌟 It’s wonderful when things feel good. What brought this smile to your day?",
      speech: "I can feel the bright energy in your words! It is wonderful when things feel good. What brought this smile to your day?"
    },
    sad: {
      display: "I hear how heavy your heart feels right now. It’s okay to not be okay. I’m right here beside you 🌱 Take a slow, gentle breath with me.",
      speech: "I hear how heavy your heart feels right now. It is okay to not be okay. I am right here beside you. Take a slow, gentle breath with me."
    },
    anxious: {
      display: "Take a gentle pause with me 🌿 You don’t have to solve everything in this very minute. Unclench your jaw, soften your shoulders, and let today be gentle.",
      speech: "Take a gentle pause with me. You do not have to solve everything in this minute. Soften your shoulders and let today be gentle."
    },
    stressed: {
      display: "Sounds like a lot has been resting on your shoulders today ☕ Let's take five minutes just for you. Would you like to do a quick breathing exercise?",
      speech: "Sounds like a lot has been resting on your shoulders today. Let us take five minutes just for you. Would you like to do a quick breathing exercise?"
    },
    tired: {
      display: "Your mind and body are asking for stillness 🌙 You’ve shown up and given your energy. Allow yourself to rest without guilt tonight.",
      speech: "Your mind and body are asking for stillness. You have shown up today. Allow yourself to rest without guilt."
    },
    angry: {
      display: "Your frustration makes sense, and it's valid to feel upset. Let’s take a deep breath together before responding to the world 🍃 I'm listening.",
      speech: "Your frustration makes sense, and it is valid to feel upset. Let us take a deep breath together. I am listening."
    },
    neutral: {
      display: "Hello! I am Menaka, your calm wellness companion. How is your headspace feeling in this moment? I'm right here with you. 🌱",
      speech: "Hello! I am Menaka, your calm wellness companion. How is your headspace feeling in this moment? I am right here with you."
    }
  };
  const choice = responses[mood] || responses.neutral;
  return {
    display_text: choice.display,
    speech_text: choice.speech,
    mood,
    intensity,
    detected_language: 'english',
    reason_for_mood: reason
  };
}

/**
 * Main function: Get response from Gemini API for Menaka AI
 */
export async function getMenakaResponse({
  message,
  history = [],
  preferredLanguage = 'auto',
  userContext = {}
}) {
  // 1. First line of defense: Crisis detection
  if (detectCrisisIntent(message)) {
    return getCrisisResponse(preferredLanguage, message);
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const systemPrompt = buildMenakaSystemPrompt({ userContext, preferredLanguage });

      const contents = [
        {
          role: 'user',
          parts: [{
            text: `${systemPrompt}

RECENT CONVERSATION HISTORY:
${history.slice(-10).map(h => `${h.role === 'assistant' ? 'Menaka' : 'User'}: ${h.text}`).join('\n')}

NEW USER MESSAGE:
"${message}"

Return STRICT JSON matching the schema:`
          }]
        }
      ];

      // Call Gemini 1.5 Flash (or 2.5 Flash if available)
      const modelEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
      const response = await fetch(`${modelEndpoint}?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 600,
            responseMimeType: 'application/json'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          const parsed = JSON.parse(rawJson.trim());
          return {
            display_text: parsed.display_text,
            speech_text: parsed.speech_text || parsed.display_text,
            mood: SUPPORTED_MOODS.includes(parsed.mood) ? parsed.mood : 'neutral',
            intensity: Math.min(5, Math.max(1, Number(parsed.intensity) || 3)),
            detected_language: parsed.detected_language || 'auto',
            reason_for_mood: parsed.reason_for_mood || 'Detected from context',
            crisis: false
          };
        }
      } else {
        const errBody = await response.text();
        console.warn('Gemini Menaka API response not ok:', errBody);
      }
    } catch (err) {
      console.warn('Gemini Menaka call failed, switching to resilient companion fallback:', err.message);
    }
  }

  // Fallback engine
  return generateMenakaFallback({ message, preferredLanguage, history });
}
