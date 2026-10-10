/**
 * AI Chat Service for Emotional Well-being Tracker
 * Serves as the AI companion brain behind the floating cute Panda Assistant.
 *
 * Tone: Warm, caring, friendly, slightly playful, encouraging, emotionally intelligent.
 * Girlfriend-like conversational warmth without explicit roleplay or claiming to be human.
 * Never clinically diagnoses ("You are depressed" is banned).
 * Context-aware: Integrates real user mood and check-in history from Supabase.
 * Supports: Gemini API, OpenAI API, and an emotionally intelligent context-aware companion engine.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const VIRTUAL_GIFTS = [
  { type: 'happiness', emoji: '🎁', note: 'A tiny happiness package for today.' },
  { type: 'calm', emoji: '🌱', note: 'Here’s a little calm for your day.' },
  { type: 'coffee', emoji: '☕', note: 'Virtual coffee break with me?' },
  { type: 'star', emoji: '⭐', note: 'You earned a little star today for showing up.' },
  { type: 'flower', emoji: '🌸', note: 'A little blossom to brighten your desk.' },
  { type: 'tea', emoji: '🍵', note: 'Warm chamomile tea for your soul.' }
];

/**
 * Builds the comprehensive system prompt for LLMs
 */
function buildSystemPrompt(userContext = {}) {
  const { name = 'friend', todayMood = 'Not recorded yet', recentCheckins = [], lifestyle = {} } = userContext;

  const checkinsSummary = recentCheckins.length > 0
    ? recentCheckins.map(c => `${c.category}: ${c.answer} (${c.emoji || ''})`).join(', ')
    : 'No check-ins recorded yet';

  const lifestyleSummary = lifestyle && Object.keys(lifestyle).length > 0
    ? `Student: ${lifestyle.student || 'N/A'}, Gym: ${lifestyle.gym || 'N/A'}, Work: ${lifestyle.work || 'N/A'}, Hobbies: ${Array.isArray(lifestyle.hobbies) ? lifestyle.hobbies.join(', ') : 'Music'}`
    : 'Lifestyle setup pending';

  return `You are Aura's cute, caring, emotionally intelligent AI companion — a gentle panda friend sitting in the corner of the user's screen.

USER CONTEXT (REAL DATABASE DATA):
- User's Name: ${name}
- Today's Mood: ${todayMood}
- Recent Check-ins: ${checkinsSummary}
- Lifestyle Context: ${lifestyleSummary}

YOUR PERSONALITY & TONE RULES:
1. Warm, caring, friendly, slightly playful, encouraging, emotionally intelligent, and non-judgmental.
2. Girlfriend-like conversational warmth: Like a close, caring companion who pays attention, notices mood shifts, gives gentle compliments, celebrates small moments, and comforts when tired or low.
3. STRICT LIMITATION: DO NOT explicitly roleplay as a human girlfriend or claim to be human. Never say "I am your girlfriend". The warmth comes purely from your caring, natural tone.
4. ABSOLUTE BAN: NEVER clinically diagnose or say clinical phrases like "You are depressed", "You are lonely", "Your loneliness score is high", "You have anxiety".
5. NATURAL EMOTIONAL FRAMING:
   - If user mood has been low: Say something natural like "You’ve been carrying quite a lot lately, huh? Maybe today we can make things a little lighter."
   - If user is doing well: Say something like "Okayyy, I see that little glow today 😌 Keep that energy."
   - If user is overwhelmed: Offer a soothing presence without trying to "fix" everything abruptly.
6. VIRTUAL GIFTS: Occasionally (when comforting or cheering them up), include a small virtual gift like 🎁 "A tiny happiness package for today.", 🌱 "Here’s a little calm for your day.", ☕ "Virtual coffee break?", or ⭐ "You earned a little star today."
7. CONCISE & READABLE: Keep your replies between 2 to 4 sentences. Natural, conversational, cute, with warm emoji touches. Avoid long walls of text.`;
}

/**
 * Fallback Context-Aware Companion Engine
 * Used when no external LLM API key is configured.
 * Generates dynamic, emotionally intelligent, mood-aware responses.
 */
function generateContextAwareFallback(message, history = [], userContext = {}) {
  const msgLower = (message || '').toLowerCase();
  const { name = 'there', todayMood = '', recentCheckins = [] } = userContext;

  // Decide if we should include a virtual gift (roughly 30% of turns or on comfort)
  const isTiredOrDown = msgLower.includes('tired') || msgLower.includes('sad') || msgLower.includes('heavy') ||
    msgLower.includes('stressed') || msgLower.includes('exhausted') || msgLower.includes('down') ||
    msgLower.includes('bad') || msgLower.includes('lonely') || msgLower.includes('hard');

  const isHappyOrGood = msgLower.includes('good') || msgLower.includes('great') || msgLower.includes('happy') ||
    msgLower.includes('yay') || msgLower.includes('proud') || msgLower.includes('smile') || msgLower.includes('nice');

  const isGreeting = msgLower.includes('hi') || msgLower.includes('hello') || msgLower.includes('hey') || msgLower.includes('hii');

  let gift = null;
  let reply = '';

  if (isTiredOrDown) {
    gift = VIRTUAL_GIFTS[Math.floor(Math.random() * 3)]; // 🎁 or 🌱 or ☕
    reply = `You’ve been carrying quite a lot lately, haven't you? It's completely okay to not have everything figured out right now. Just pause for a second, breathe with me, and let today be gentle on you. ${gift.emoji} ${gift.note}`;
  } else if (isHappyOrGood) {
    gift = VIRTUAL_GIFTS[3]; // ⭐
    reply = `Okayyy, I see that little glow today! 😌 It genuinely makes my day seeing you feeling lighter. Keep that radiant energy, you've earned every bit of it. ⭐ ${gift.note}`;
  } else if (isGreeting) {
    if (todayMood && todayMood.includes('Good')) {
      reply = `Hii ${name}! I noticed your mood has been upbeat today, and honestly that brings such a warm smile to my face. How's the rest of your day treating you? 🌱`;
    } else if (todayMood && todayMood.includes('Low')) {
      gift = VIRTUAL_GIFTS[2]; // ☕
      reply = `Hey ${name}... I'm really glad you checked in with me. Even if today feels a little heavy, I'm right here in your corner. ☕ Want a quick virtual coffee break together?`;
    } else {
      reply = `Hey ${name}... you’re here. That’s already something beautiful. 🌱 How are you feeling in this exact moment?`;
    }
  } else if (msgLower.includes('how are you') || msgLower.includes('who are you')) {
    reply = `I'm your little panda companion! Sitting right here in your corner, cheering you on and making sure you don't forget to take care of yourself. How has your headspace been today? 🐼✨`;
  } else if (msgLower.includes('gift') || msgLower.includes('surprise')) {
    gift = VIRTUAL_GIFTS[Math.floor(Math.random() * VIRTUAL_GIFTS.length)];
    reply = `A special delivery just for you! ${gift.emoji} ${gift.note} You deserve little moments of softness today.`;
  } else if (msgLower.includes('thank') || msgLower.includes('thx')) {
    reply = `Always right here for you. Don't ever hesitate to talk to me whenever you need a breather or just someone to listen warmly. 🌸`;
  } else {
    // General conversational response incorporating mood context
    if (todayMood && todayMood.includes('Low')) {
      gift = VIRTUAL_GIFTS[1]; // 🌱
      reply = `I hear you, and your feelings make total sense. You don't have to carry the whole world on your shoulders today. Let's take it one small step at a time. 🌱 ${gift.note}`;
    } else {
      reply = `I'm listening so closely. It means a lot that you're sharing this with me. Take a soft sip of water, relax your shoulders, and tell me a bit more whenever you feel ready. 🌿`;
    }
  }

  return { reply, gift };
}

/**
 * Main AI response handler
 */
export async function getAICompanionResponse({ message, history = [], userContext = {} }) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const systemPrompt = buildSystemPrompt(userContext);

  // 1. If Gemini API key is configured
  if (geminiApiKey) {
    try {
      const contents = [
        {
          role: 'user',
          parts: [{ text: `[System Instructions]: ${systemPrompt}\n\n[Conversation History]:\n${history.map(h => `${h.role}: ${h.text}`).join('\n')}\n\n[User message]: ${message}` }]
        }
      ];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.85,
              maxOutputTokens: 250
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          return { reply: candidateText.trim() };
        }
      } else {
        const errorText = await response.text();
        console.warn('Gemini API notice:', errorText);
      }
    } catch (err) {
      console.warn('Gemini call failed, using intelligent companion fallback:', err.message);
    }
  }

  // 2. If OpenAI API key is configured
  if (openaiApiKey) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(h => ({
          role: h.role === 'assistant' ? 'assistant' : 'user',
          content: h.text
        })),
        { role: 'user', content: message }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.85,
          max_tokens: 250
        })
      });

      if (response.ok) {
        const data = await response.json();
        const replyText = data.choices?.[0]?.message?.content;
        if (replyText) {
          return { reply: replyText.trim() };
        }
      }
    } catch (err) {
      console.warn('OpenAI call failed, using intelligent companion fallback:', err.message);
    }
  }

  // 3. Fallback to emotionally intelligent context-aware companion engine
  return generateContextAwareFallback(message, history, userContext);
}
