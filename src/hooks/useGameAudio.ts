import { useEffect, useRef, useCallback } from 'react';

export type SoundEffect = 'CORRECT_SWISH' | 'BAT_CRACK' | 'WHISTLE' | 'CROWD_CHEER' | 'GLITCH_SFX';

export const useGameAudio = () => {
  const audioContext = useRef<AudioContext | null>(null);
  const tensionOscillator = useRef<OscillatorNode | null>(null);
  const tensionGain = useRef<GainNode | null>(null);

  useEffect(() => {
    return () => {
      audioContext.current?.close();
    };
  }, []);

  const initAudio = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContext.current.state === 'suspended') {
      audioContext.current.resume();
    }
  }, []);

  const playSFX = useCallback((type: SoundEffect, volume: number = 0.5) => {
    initAudio();
    const ctx = audioContext.current!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'CORRECT_SWISH':
        // High frequency sweep down (Swish)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'BAT_CRACK':
        // Percussive burst
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'WHISTLE':
        // Two-tone high frequency
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.setValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'CROWD_CHEER':
        // White noise-like cheer logic (simplified)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100 + Math.random() * 50, now);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
        osc.start(now);
        osc.stop(now + 1.0);
        break;
      case 'GLITCH_SFX':
        // Chaotic glitch sound
        osc.type = 'square';
        osc.frequency.setValueAtTime(50, now);
        for(let i = 0; i < 10; i++) {
            osc.frequency.setValueAtTime(Math.random() * 1000, now + i * 0.02);
        }
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
    }
  }, [initAudio]);

  const startTensionLoop = useCallback(() => {
    initAudio();
    const ctx = audioContext.current!;
    if (tensionOscillator.current) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    tensionOscillator.current = osc;
    tensionGain.current = gain;
  }, [initAudio]);

  const updateTension = useCallback((timeLeft: number) => {
    if (!tensionOscillator.current || !tensionGain.current || !audioContext.current) return;
    
    const ctx = audioContext.current;
    const factor = Math.max(0, (24 - timeLeft) / 24); // 0 to 1 as time decreases
    
    // Increase frequency and volume as time runs out
    const freq = 100 + (factor * 300);
    const vol = 0.05 + (factor * 0.15);
    
    tensionOscillator.current.frequency.setTargetAtTime(freq, ctx.currentTime, 0.1);
    tensionGain.current.gain.setTargetAtTime(vol, ctx.currentTime, 0.1);
  }, []);

  const stopTensionLoop = useCallback(() => {
    if (tensionOscillator.current) {
      tensionOscillator.current.stop();
      tensionOscillator.current.disconnect();
      tensionOscillator.current = null;
      tensionGain.current = null;
    }
  }, []);

  return { playSFX, startTensionLoop, updateTension, stopTensionLoop };
};
