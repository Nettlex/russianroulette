export class AudioManager {
  private static instance: AudioManager;
  private sounds: Map<string, HTMLAudioElement | (() => void)> = new Map();
  private isEnabled: boolean = true;
  private audioContext: AudioContext | null = null;
  private useWebAudio: boolean = true; // Set to false to use MP3 files

  private constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.initSounds();
    }
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private initSounds() {
    if (this.useWebAudio) {
      // Use Web Audio API (works immediately, no files needed)
      this.sounds.set('click', this.createClickSound.bind(this));
      this.sounds.set('spin', this.createSpinSound.bind(this));
      this.sounds.set('shot', this.createShotSound.bind(this));
      this.sounds.set('emptyClick', this.createEmptyClickSound.bind(this));
    } else {
      // Use audio files (better quality, but need to provide files)
      this.loadAudioFiles();
    }
  }

  private loadAudioFiles() {
    // Load audio files from /sounds/ directory
    const soundFiles = {
      click: '/sounds/click.mp3',
      spin: '/sounds/spin.mp3',
      shot: '/sounds/shot.mp3',
      emptyClick: '/sounds/empty.mp3',
    };

    Object.entries(soundFiles).forEach(([key, path]) => {
      try {
        const audio = new Audio(path);
        audio.preload = 'auto';
        audio.volume = 0.7;
        this.sounds.set(key, audio);
      } catch (error) {
        console.warn(`Failed to load sound: ${key}`, error);
        // Fallback to Web Audio
        this.useWebAudio = true;
      }
    });
  }

  private createClickSound() {
    // Gun mechanism click sound
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquadFilter();
    
    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = 200;
    oscillator.type = 'square';
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 1000;
    
    gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  private createSpinSound() {
    // Spinning chamber sound - ratcheting effect (enhanced)
    if (!this.audioContext) return;
    
    const duration = 1.5;
    const clicks = 16; // More clicks for smoother spin
    
    for (let i = 0; i < clicks; i++) {
      const progress = i / clicks;
      const time = this.audioContext.currentTime + (progress * duration);
      
      // Create oscillator for click
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Varying frequency for mechanical feel
      oscillator.frequency.value = 180 + Math.random() * 40 + (progress * 30);
      oscillator.type = 'square';
      
      filter.type = 'highpass';
      filter.frequency.value = 100 + (progress * 100);
      
      // Volume envelope with slight acceleration feel
      const volume = 0.15 + (progress * 0.1);
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(volume, time + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.04);
      
      oscillator.start(time);
      oscillator.stop(time + 0.04);
    }
    
    // Add whoosh sound
    const noise = this.audioContext.createBufferSource();
    const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < output.length; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.1;
    }
    
    noise.buffer = noiseBuffer;
    
    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 400;
    noiseFilter.Q.value = 0.5;
    
    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.audioContext.destination);
    
    noise.start(this.audioContext.currentTime);
    noise.stop(this.audioContext.currentTime + duration);
  }

  private createShotSound() {
    // Enhanced gunshot sound - realistic explosion
    if (!this.audioContext) return;
    
    const duration = 0.8;
    const now = this.audioContext.currentTime;
    
    // Low frequency boom
    const bass = this.audioContext.createOscillator();
    const bassGain = this.audioContext.createGain();
    bass.connect(bassGain);
    bassGain.connect(this.audioContext.destination);
    
    bass.frequency.setValueAtTime(80, now);
    bass.frequency.exponentialRampToValueAtTime(30, now + 0.1);
    bass.type = 'sine';
    
    bassGain.gain.setValueAtTime(0.5, now);
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    bass.start(now);
    bass.stop(now + 0.3);
    
    // Main explosion noise
    const noise = this.audioContext.createBufferSource();
    const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < output.length; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.audioContext.sampleRate * 0.1));
    }
    
    noise.buffer = noiseBuffer;
    
    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(400, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.2);
    noiseFilter.Q.value = 1;
    
    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.9, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.audioContext.destination);
    
    noise.start(now);
    noise.stop(now + duration);
    
    // Sharp attack "crack"
    const crack = this.audioContext.createOscillator();
    const crackGain = this.audioContext.createGain();
    const crackFilter = this.audioContext.createBiquadFilter();
    
    crack.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(this.audioContext.destination);
    
    crack.frequency.setValueAtTime(1000, now);
    crack.frequency.exponentialRampToValueAtTime(100, now + 0.05);
    crack.type = 'square';
    
    crackFilter.type = 'highpass';
    crackFilter.frequency.value = 500;
    
    crackGain.gain.setValueAtTime(0.3, now);
    crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    crack.start(now);
    crack.stop(now + 0.05);
  }

  private createEmptyClickSound() {
    // Empty chamber click - lighter than full click
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = 180;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.25, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.08);
  }

  play(soundName: string) {
    if (!this.isEnabled) return;
    
    const sound = this.sounds.get(soundName);
    if (sound) {
      try {
        if (sound instanceof HTMLAudioElement) {
          // Clone and play audio element (allows overlapping sounds)
          const clone = sound.cloneNode() as HTMLAudioElement;
          clone.volume = sound.volume;
          clone.play().catch(e => console.warn('Audio play failed:', e));
        } else if (typeof sound === 'function') {
          // Call Web Audio generator function
          sound();
        }
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    }
  }

  playClick() {
    this.play('click');
  }

  playSpin() {
    this.play('spin');
  }

  playShot() {
    this.play('shot');
  }

  playEmptyClick() {
    this.play('emptyClick');
  }

  toggle() {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
}

export const audioManager = typeof window !== 'undefined' ? AudioManager.getInstance() : null;

