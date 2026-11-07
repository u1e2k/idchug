/**
 * KeysSynth - ピアノ/エレピ/シンセパッド音源
 * バンドアレンジを支えるキーボードパート
 */
export class KeysSynth {
  private ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  public playNotes(
    pitches: number[],
    time: number,
    duration: number,
    velocity: number = 0.75,
    outputNode: AudioNode
  ) {
    const ctx = this.ctx;

    pitches.forEach((pitch) => {
      const freq = 440 * Math.pow(2, (pitch - 69) / 12);

      // サイン波 + 微弱なサイン2倍音 (エレピ風のベル感)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, time);

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq, time);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, time);
      filter.frequency.exponentialRampToValueAtTime(1000, time + duration);

      const envGain = ctx.createGain();
      envGain.gain.setValueAtTime(0.0001, time);
      envGain.gain.linearRampToValueAtTime((velocity * 0.7) / pitches.length, time + 0.01);
      envGain.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, ((velocity * 0.4) / pitches.length)),
        time + Math.max(0.05, duration * 0.7)
      );
      envGain.gain.exponentialRampToValueAtTime(0.0001, time + duration + 0.1);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(envGain);
      envGain.connect(outputNode);

      osc1.start(time);
      osc2.start(time);

      const stopTime = time + duration + 0.12;
      osc1.stop(stopTime);
      osc2.stop(stopTime);
    });
  }
}

