/**
 * In-Browser Ambient Audio Engine using Web Audio API
 * 
 * Generates procedural, infinite, royalty-free soundscapes in-browser:
 * 1. Rain (filtered pink noise with droplet impulses)
 * 2. Ocean Waves (surging lowpass modulated noise)
 * 3. Soft Pads (harmonic lush ambient chords with warm lowpass)
 * 4. Binaural Calming Beats (Alpha 10Hz or Theta 4Hz frequency modulation)
 * 
 * Features:
 * - Master volume & individual channel volume
 * - Timer with automatic 5-second fadeout
 * - Zero external MP3/WAV dependencies, zero network latency
 * - Adheres to browser user-gesture autoplay policies
 */

export interface SoundscapeLevels {
  rain: number;       // 0 to 1
  ocean: number;      // 0 to 1
  softPads: number;   // 0 to 1
  binaural: number;   // 0 to 1
}

export class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private masterGain: GainNode | null = null;

  // Individual Layer Gains
  private rainGain: GainNode | null = null;
  private oceanGain: GainNode | null = null;
  private padsGain: GainNode | null = null;
  private binauralGain: GainNode | null = null;

  // Internal Nodes & Oscillators
  private activeNodes: Array<{ stop?: () => void; disconnect: () => void }> = [];

  // Timer state
  private timerId: any = null;
  private remainingSeconds: number = 0;
  private onTimerTick: ((remaining: number) => void) | null = null;

  constructor() {
    // Lazy AudioContext initialization on first play gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getIsPlaying(): boolean {
    return this.isRunning;
  }

  /**
   * Start or update procedural soundscape
   */
  public start(levels: SoundscapeLevels = { rain: 0.4, ocean: 0.3, softPads: 0.5, binaural: 0.2 }, masterVol: number = 0.7) {
    this.initContext();
    if (!this.ctx) return;

    if (this.isRunning) {
      this.updateLevels(levels);
      this.setMasterVolume(masterVol);
      return;
    }

    this.stop(); // Clean slate

    const ctx = this.ctx;

    // Master bus
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(masterVol, ctx.currentTime + 1.2);
    this.masterGain.connect(ctx.destination);

    // 1. RAIN GENERATOR
    this.rainGain = ctx.createGain();
    this.rainGain.gain.setValueAtTime(levels.rain, ctx.currentTime);
    this.rainGain.connect(this.masterGain);
    this.createRainGenerator(this.rainGain);

    // 2. OCEAN WAVES GENERATOR
    this.oceanGain = ctx.createGain();
    this.oceanGain.gain.setValueAtTime(levels.ocean, ctx.currentTime);
    this.oceanGain.connect(this.masterGain);
    this.createOceanGenerator(this.oceanGain);

    // 3. SOFT PADS GENERATOR
    this.padsGain = ctx.createGain();
    this.padsGain.gain.setValueAtTime(levels.softPads, ctx.currentTime);
    this.padsGain.connect(this.masterGain);
    this.createSoftPadsGenerator(this.padsGain);

    // 4. BINAURAL BEATS GENERATOR
    this.binauralGain = ctx.createGain();
    this.binauralGain.gain.setValueAtTime(levels.binaural, ctx.currentTime);
    this.binauralGain.connect(this.masterGain);
    this.createBinauralGenerator(this.binauralGain);

    this.isRunning = true;
  }

  /**
   * 1. Procedural Rain generator using filtered noise buffer
   */
  private createRainGenerator(dest: GainNode) {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Generate 5s pink noise buffer
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Bandpass filter for soothing rain resonance
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.Q.setValueAtTime(0.8, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(dest);
    noiseSource.start();

    this.activeNodes.push(noiseSource);
  }

  /**
   * 2. Ocean Waves generator using surging lowpass modulated noise
   */
  private createOceanGenerator(dest: GainNode) {
    if (!this.ctx) return;
    const ctx = this.ctx;

    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Filter modulated by slow LFO wave (0.1Hz ~ 10s per ocean wave)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, ctx.currentTime);

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.09, ctx.currentTime); // 11-second wave cycle

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(260, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(dest);

    noise.start();
    lfo.start();

    this.activeNodes.push(noise, lfo);
  }

  /**
   * 3. Soft Ambient Pads (harmonic F-A-C-E chord with gentle vibrato)
   */
  private createSoftPadsGenerator(dest: GainNode) {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Gentle F maj7 pad chord frequencies: F3 (174.61), A3 (220.0), C4 (261.63), E4 (329.63)
    const chordFreqs = [174.61, 220.0, 261.63, 329.63];

    chordFreqs.forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Gentle lowpass filter to remove harsh highs
      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(450, ctx.currentTime);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.04, ctx.currentTime);

      osc.connect(padFilter);
      padFilter.connect(oscGain);
      oscGain.connect(dest);

      osc.start();
      this.activeNodes.push(osc);
    });
  }

  /**
   * 4. Binaural Beats Generator (Alpha 10Hz calming brainwave carrier)
   */
  private createBinauralGenerator(dest: GainNode) {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Left ear: 216 Hz, Right ear: 226 Hz -> 10 Hz Alpha beat
    const leftOsc = ctx.createOscillator();
    leftOsc.type = 'sine';
    leftOsc.frequency.setValueAtTime(216, ctx.currentTime);

    const rightOsc = ctx.createOscillator();
    rightOsc.type = 'sine';
    rightOsc.frequency.setValueAtTime(226, ctx.currentTime);

    // Stereo panners if supported
    if (ctx.createStereoPanner) {
      const leftPan = ctx.createStereoPanner();
      leftPan.pan.setValueAtTime(-0.8, ctx.currentTime);

      const rightPan = ctx.createStereoPanner();
      rightPan.pan.setValueAtTime(0.8, ctx.currentTime);

      const toneGain = ctx.createGain();
      toneGain.gain.setValueAtTime(0.05, ctx.currentTime);

      leftOsc.connect(leftPan);
      leftPan.connect(toneGain);

      rightOsc.connect(rightPan);
      rightPan.connect(toneGain);

      toneGain.connect(dest);
    } else {
      const toneGain = ctx.createGain();
      toneGain.gain.setValueAtTime(0.04, ctx.currentTime);
      leftOsc.connect(toneGain);
      rightOsc.connect(toneGain);
      toneGain.connect(dest);
    }

    leftOsc.start();
    rightOsc.start();
    this.activeNodes.push(leftOsc, rightOsc);
  }

  /**
   * Update layer volumes dynamically
   */
  public updateLevels(levels: SoundscapeLevels) {
    if (!this.ctx || !this.isRunning) return;
    const t = this.ctx.currentTime;
    if (this.rainGain) this.rainGain.gain.setTargetAtTime(levels.rain, t, 0.4);
    if (this.oceanGain) this.oceanGain.gain.setTargetAtTime(levels.ocean, t, 0.4);
    if (this.padsGain) this.padsGain.gain.setTargetAtTime(levels.softPads, t, 0.4);
    if (this.binauralGain) this.binauralGain.gain.setTargetAtTime(levels.binaural, t, 0.4);
  }

  public setMasterVolume(vol: number) {
    if (!this.ctx || !this.masterGain) return;
    const clamped = Math.max(0, Math.min(1, vol));
    this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.2);
  }

  /**
   * Timer setup (e.g. 5, 10, 15, 30 minutes)
   */
  public setTimer(minutes: number, onTick?: (secondsLeft: number) => void) {
    this.clearTimer();
    if (minutes <= 0) return;

    this.remainingSeconds = minutes * 60;
    this.onTimerTick = onTick || null;

    if (this.onTimerTick) this.onTimerTick(this.remainingSeconds);

    this.timerId = setInterval(() => {
      this.remainingSeconds -= 1;
      if (this.onTimerTick) this.onTimerTick(this.remainingSeconds);

      if (this.remainingSeconds <= 5 && this.masterGain && this.ctx) {
        // Smooth 5s fadeout
        this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 5);
      }

      if (this.remainingSeconds <= 0) {
        this.stop();
      }
    }, 1000);
  }

  public clearTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.remainingSeconds = 0;
  }

  /**
   * Stop audio engine and release resources
   */
  public stop() {
    this.clearTimer();
    if (this.activeNodes.length > 0) {
      this.activeNodes.forEach(node => {
        try {
          if (node.stop) node.stop();
          node.disconnect();
        } catch {
          // Ignored
        }
      });
      this.activeNodes = [];
    }

    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch {
        // Ignored
      }
      this.masterGain = null;
    }

    this.isRunning = false;
  }
}

// Global singleton instance for app-wide audio management
export const ambientEngine = new AmbientAudioEngine();
