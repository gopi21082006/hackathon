/**
 * Voice Service: Web Speech API Input (STT) + Text-to-Speech (TTS)
 * 
 * Features:
 * - SpeechRecognition (ta-IN and en-IN) with graceful fallback
 * - Hybrid TTS Player:
 *    1. Calls backend /api/tts (Google Cloud ta-IN female / ElevenLabs adapter)
 *    2. Seamlessly falls back to browser window.speechSynthesis
 * - Audio playback state tracking & waveform animation subscribers
 */

export type SpeechLanguage = 'ta-IN' | 'en-IN' | 'auto';

type SpeakingStateListener = (isSpeaking: boolean) => void;

class VoiceService {
  private recognition: any = null;
  private isListening: boolean = false;
  private activeAudio: HTMLAudioElement | null = null;
  private isCurrentlySpeaking: boolean = false;
  private listeners: Set<SpeakingStateListener> = new Set();

  constructor() {
    this.initSpeechRecognition();
  }

  /**
   * Initialize Web Speech Recognition
   */
  private initSpeechRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    }
  }

  public isSpeechRecognitionSupported(): boolean {
    return Boolean(this.recognition);
  }

  /**
   * Start listening for voice input
   */
  public startListening({
    language = 'ta-IN',
    onResult,
    onError,
    onEnd
  }: {
    language?: SpeechLanguage;
    onResult: (transcript: string, isFinal: boolean) => void;
    onError?: (err: string) => void;
    onEnd?: () => void;
  }) {
    if (!this.recognition) {
      if (onError) onError('Speech recognition is not supported in this browser. Please use text input.');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    try {
      this.recognition.lang = language === 'auto' ? 'ta-IN' : language;
      this.isListening = true;

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        onResult(text, Boolean(finalTranscript));
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        console.warn('Speech recognition error:', event.error);
        if (onError) onError(event.error || 'Voice input interrupted');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (onEnd) onEnd();
      };

      this.recognition.start();
    } catch (err: any) {
      this.isListening = false;
      if (onError) onError(err.message || 'Could not start microphone');
    }
  }

  /**
   * Stop listening
   */
  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignored
      }
      this.isListening = false;
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Subscribe to speaking state (for waveform & avatar animation)
   */
  public onSpeakingChange(listener: SpeakingStateListener): () => void {
    this.listeners.add(listener);
    listener(this.isCurrentlySpeaking);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifySpeakingState(speaking: boolean) {
    this.isCurrentlySpeaking = speaking;
    this.listeners.forEach(fn => fn(speaking));
  }

  public isSpeaking(): boolean {
    return this.isCurrentlySpeaking;
  }

  /**
   * Speak text using Backend TTS or Browser Fallback
   */
  public async speakText({
    text,
    speechText,
    languageCode = 'ta-IN',
    onStart,
    onEnd,
    onError
  }: {
    text: string;
    speechText?: string;
    languageCode?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }) {
    this.stopSpeaking();

    const textToSpeak = (speechText || text || '').trim();
    if (!textToSpeak) return;

    this.notifySpeakingState(true);
    if (onStart) onStart();

    // 1. Try Backend TTS Endpoint (/api/tts)
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          languageCode
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.audioBase64) {
          const audioUrl = `data:${data.contentType || 'audio/mp3'};base64,${data.audioBase64}`;
          const audio = new Audio(audioUrl);
          this.activeAudio = audio;

          audio.onended = () => {
            this.activeAudio = null;
            this.notifySpeakingState(false);
            if (onEnd) onEnd();
          };

          audio.onerror = () => {
            this.activeAudio = null;
            this.fallbackToBrowserTTS(textToSpeak, languageCode, onEnd, onError);
          };

          await audio.play();
          return;
        }
      }
    } catch (err) {
      console.warn('Backend TTS call failed, falling back to browser TTS:', err);
    }

    // 2. Fallback to Browser SpeechSynthesis
    this.fallbackToBrowserTTS(textToSpeak, languageCode, onEnd, onError);
  }

  /**
   * Browser SpeechSynthesis Fallback
   */
  private fallbackToBrowserTTS(
    text: string,
    languageCode: string,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      this.notifySpeakingState(false);
      if (onError) onError('Speech synthesis is not supported on this browser');
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = languageCode.startsWith('ta') ? 'ta-IN' : 'en-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      // Try selecting a Tamil voice or natural female voice
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => 
        v.lang === utterance.lang || 
        v.lang.startsWith(utterance.lang.slice(0, 2)) ||
        (utterance.lang.startsWith('ta') && /tamil|ta/i.test(v.name))
      );

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => {
        this.notifySpeakingState(false);
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        this.notifySpeakingState(false);
        if (onError) onError(e);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      this.notifySpeakingState(false);
      if (onError) onError(err);
    }
  }

  /**
   * Stop speaking and cancel ongoing playback
   */
  public stopSpeaking() {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
      this.activeAudio = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    this.notifySpeakingState(false);
  }
}

export const voiceService = new VoiceService();
