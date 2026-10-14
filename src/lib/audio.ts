// Web Audio API Synthesizer for Precision Mechanical Feedback

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Precision hardware button click
  public playClick() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Audio not permitted without gesture or unavailable
    }
  }

  // Cinematic Machine Powering-On Sweep
  public playInitiateSweep() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Sub-bass rumble
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(45, now);
      subOsc.frequency.linearRampToValueAtTime(110, now + 3.0);
      subGain.gain.setValueAtTime(0.0, now);
      subGain.gain.linearRampToValueAtTime(0.25, now + 1.2);
      subGain.gain.linearRampToValueAtTime(0.3, now + 2.8);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 3.4);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 3.4);

      // Machined harmonic whine / power ring sweep
      const sweepOsc = this.ctx.createOscillator();
      const sweepGain = this.ctx.createGain();
      sweepOsc.type = 'sawtooth';
      sweepOsc.frequency.setValueAtTime(220, now + 0.5);
      sweepOsc.frequency.exponentialRampToValueAtTime(880, now + 2.5);
      sweepGain.gain.setValueAtTime(0.0, now + 0.5);
      sweepGain.gain.linearRampToValueAtTime(0.05, now + 1.8);
      sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

      // Filter to keep it silky and industrial
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now + 0.5);
      filter.frequency.linearRampToValueAtTime(2400, now + 2.8);

      sweepOsc.connect(filter);
      filter.connect(sweepGain);
      sweepGain.connect(this.ctx.destination);

      sweepOsc.start(now + 0.5);
      sweepOsc.stop(now + 3.3);

      // Final lock-in chime
      const lockOsc = this.ctx.createOscillator();
      const lockGain = this.ctx.createGain();
      lockOsc.type = 'sine';
      lockOsc.frequency.setValueAtTime(523.25, now + 3.0); // C5
      lockGain.gain.setValueAtTime(0.18, now + 3.0);
      lockGain.gain.exponentialRampToValueAtTime(0.001, now + 4.2);

      lockOsc.connect(lockGain);
      lockGain.connect(this.ctx.destination);
      lockOsc.start(now + 3.0);
      lockOsc.stop(now + 4.2);
    } catch {
      // Audio context restricted
    }
  }

  // Precision tick for the final 10 seconds
  public playCountdownTick(second: number) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // Pitch slightly rises as it gets closer to 0
      const pitch = 440 + (10 - second) * 35;
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Audio context restricted
    }
  }

  // Completion chime
  public playCompletionChime() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25]; // C major chord

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.08, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + 2.5);
      });
    } catch {
      // Audio context restricted
    }
  }
}

export const sound = new SoundSynthesizer();
