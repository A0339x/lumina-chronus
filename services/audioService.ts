export class AudioService {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private isMuted: boolean = true;
  private initialized: boolean = false;
  private oscillators: OscillatorNode[] = []; // Keep references to prevent GC issues

  // Initialize audio context - MUST be called from a user interaction event
  async init() {
    if (this.initialized) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.context = new AudioContextClass();
    
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
    // Start at 0, we will ramp up if unmuted
    this.masterGain.gain.setValueAtTime(0, this.context.currentTime);

    this.setupAmbientSound();
    this.initialized = true;

    // If we are initialized while unmuted (shouldn't happen usually, but for safety)
    if (!this.isMuted) {
        await this.context.resume();
        this.fadeIn();
    }
  }

  private setupAmbientSound() {
    if (!this.context || !this.masterGain) return;

    this.ambientGain = this.context.createGain();
    this.ambientGain.gain.value = 0.3; // Increased base volume for ambient
    this.ambientGain.connect(this.masterGain);

    // Ethereal chord: Fmaj7 (F, A, C, E) spread out
    const frequencies = [174.61, 220.00, 261.63, 329.63, 523.25];
    
    frequencies.forEach((freq, i) => {
        if (!this.context) return;
        const osc = this.context.createOscillator();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        
        // Slight detune for richness
        osc.detune.value = (Math.random() * 10) - 5;

        // Individual gain for balance
        const oscGain = this.context.createGain();
        // Base gain
        const baseGain = 0.15 / frequencies.length;
        oscGain.gain.value = baseGain;
        
        // LFO for movement (Slow breathing effect)
        const lfo = this.context.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.05 + (Math.random() * 0.05); // Very slow
        
        const lfoGain = this.context.createGain();
        lfoGain.gain.value = baseGain * 0.3; // Modulate by 30% of base
        
        lfo.connect(lfoGain);
        lfoGain.connect(oscGain.gain);
        lfo.start();

        osc.connect(oscGain);
        oscGain.connect(this.ambientGain!);
        osc.start();

        this.oscillators.push(osc);
        this.oscillators.push(lfo);
    });

    // Add Pink Noise floor for texture (Air)
    const bufferSize = this.context.sampleRate * 2;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // Compensate for gain loss
    }

    const noise = this.context.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const noiseGain = this.context.createGain();
    noiseGain.gain.value = 0.04; // Increased noise floor slightly
    noise.connect(noiseGain);
    noiseGain.connect(this.ambientGain);
    noise.start();
  }

  async toggleMute(shouldMute: boolean) {
    this.isMuted = shouldMute;
    
    // Initialize on first unmute attempt
    if (!this.initialized && !shouldMute) {
        await this.init();
    }
    
    if (!this.context || !this.masterGain) return;

    if (!shouldMute) {
        // Always try to resume context when unmuting, just in case
        if (this.context.state === 'suspended') {
            await this.context.resume();
        }
        this.fadeIn();
        this.playInteractionSound(); // Immediate feedback
    } else {
        this.fadeOut();
    }
  }

  private fadeIn() {
      if (!this.context || !this.masterGain) return;
      const t = this.context.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
      this.masterGain.gain.linearRampToValueAtTime(0.5, t + 0.5); // Faster ramp to 0.5
  }

  private fadeOut() {
      if (!this.context || !this.masterGain) return;
      const t = this.context.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
      this.masterGain.gain.linearRampToValueAtTime(0, t + 0.3);
  }

  // A simple "blip" to confirm audio is working
  private playInteractionSound() {
      if (!this.context || !this.masterGain) return;
      const t = this.context.currentTime;
      
      const osc = this.context.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.1);
      
      const gain = this.context.createGain();
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.1);
  }

  playCelebration() {
    if (this.isMuted || !this.context || !this.masterGain) return;
    const t = this.context.currentTime;

    // 1. The "Thud" / Launch
    const osc = this.context.createOscillator();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.5);
    const oscGain = this.context.createGain();
    oscGain.gain.setValueAtTime(0.5, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.5);

    // 2. The "Sparkle" / Crackle
    for (let i = 0; i < 8; i++) {
        const delay = Math.random() * 0.3;
        this.createNoiseBurst(t + delay);
    }
  }

  private createNoiseBurst(startTime: number) {
     if (!this.context || !this.masterGain) return;
     const bufferSize = this.context.sampleRate * 0.5;
     const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
     const data = buffer.getChannelData(0);
     for (let i = 0; i < bufferSize; i++) {
         data[i] = Math.random() * 2 - 1;
     }

     const noise = this.context.createBufferSource();
     noise.buffer = buffer;
     
     const filter = this.context.createBiquadFilter();
     filter.type = 'highpass';
     filter.frequency.value = 1000;

     const gain = this.context.createGain();
     gain.gain.setValueAtTime(0.1, startTime);
     gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

     noise.connect(filter);
     filter.connect(gain);
     gain.connect(this.masterGain);
     
     noise.start(startTime);
     noise.stop(startTime + 0.4);
  }

  playTick() {
      if (this.isMuted || !this.context || !this.masterGain) return;
      const t = this.context.currentTime;
      
      const osc = this.context.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);
      
      const gain = this.context.createGain();
      gain.gain.setValueAtTime(0.1, t); // Increased tick volume
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.05);
  }
}

export const audioService = new AudioService();
