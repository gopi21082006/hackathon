/**
 * Text-to-Speech (TTS) Provider Adapter Service
 * 
 * Supports:
 * - Google Cloud Text-to-Speech / Gemini TTS with ta-IN female voice
 * - ElevenLabs custom voice provider adapter (extensible for licensed/custom voice)
 * - Browser fallback indicator when no external provider is configured
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

/**
 * Base Adapter Interface
 */
class BaseTTSAdapter {
  async synthesize({ text, languageCode = 'ta-IN', gender = 'FEMALE' }) {
    throw new Error('Not implemented');
  }
}

/**
 * Google Cloud Text-to-Speech Adapter
 * Uses Google Cloud TTS REST API (or Gemini TTS credentials)
 */
export class GoogleTTSAdapter extends BaseTTSAdapter {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey || process.env.TTS_API_KEY || process.env.GEMINI_API_KEY;
  }

  async synthesize({ text, languageCode = 'ta-IN', gender = 'FEMALE' }) {
    if (!this.apiKey) {
      return { success: false, fallbackToBrowser: true, reason: 'No Google TTS API key configured' };
    }

    try {
      // Pick voice name based on languageCode
      let voiceName = 'ta-IN-Standard-A';
      if (languageCode.startsWith('en')) {
        voiceName = 'en-IN-Wavenet-A';
      } else if (languageCode.startsWith('ta')) {
        voiceName = 'ta-IN-Wavenet-A';
      }

      const requestBody = {
        input: { text },
        voice: {
          languageCode: languageCode.startsWith('ta') ? 'ta-IN' : 'en-IN',
          name: voiceName,
          ssmlGender: gender
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 0.95,
          pitch: 1.0
        }
      };

      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Google Cloud TTS returned non-200:', errorText);
        return { success: false, fallbackToBrowser: true, reason: errorText };
      }

      const data = await response.json();
      if (data.audioContent) {
        return {
          success: true,
          audioBase64: data.audioContent,
          contentType: 'audio/mp3',
          provider: 'google'
        };
      }

      return { success: false, fallbackToBrowser: true, reason: 'No audio content in response' };
    } catch (err) {
      console.warn('Google TTS synthesis failed:', err.message);
      return { success: false, fallbackToBrowser: true, reason: err.message };
    }
  }
}

/**
 * ElevenLabs Adapter (Ready for custom licensed voice)
 */
export class ElevenLabsTTSAdapter extends BaseTTSAdapter {
  constructor(apiKey, voiceId) {
    super();
    this.apiKey = apiKey || process.env.ELEVENLABS_API_KEY || process.env.TTS_API_KEY;
    this.voiceId = voiceId || process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Default Rachel / custom
  }

  async synthesize({ text }) {
    if (!this.apiKey) {
      return { success: false, fallbackToBrowser: true, reason: 'No ElevenLabs API key configured' };
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, fallbackToBrowser: true, reason: errText };
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return {
        success: true,
        audioBase64: base64,
        contentType: 'audio/mpeg',
        provider: 'elevenlabs'
      };
    } catch (err) {
      console.warn('ElevenLabs TTS error:', err.message);
      return { success: false, fallbackToBrowser: true, reason: err.message };
    }
  }
}

/**
 * Factory function to get active TTS provider
 */
export function getTTSProvider() {
  const providerType = (process.env.TTS_PROVIDER || 'google').toLowerCase();

  switch (providerType) {
    case 'elevenlabs':
      return new ElevenLabsTTSAdapter();
    case 'google':
    default:
      return new GoogleTTSAdapter();
  }
}

/**
 * High-level TTS synthesizer helper
 */
export async function synthesizeSpeech({ text, languageCode = 'ta-IN' }) {
  if (!text || !text.trim()) {
    return { success: false, fallbackToBrowser: true, reason: 'Empty text' };
  }

  const provider = getTTSProvider();
  return provider.synthesize({ text, languageCode, gender: 'FEMALE' });
}
