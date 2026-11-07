/**
 * VocalSynth - 簡易フォルマント・リードボーカル音源
 * パルス波/ノコギリ波 + 2基のフォルマント共鳴フィルタで人の母音感や豊かなリードトーンを生成
 */
export class VocalSynth {
  private ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  public playNote(
    pitch: number,
    time: number,
    duration: number,
    velocity: number = 0.8,
    outputNode: AudioNode
  ) {
    const ctx = this.ctx;
    const freq = 440 * Math.pow(2, (pitch - 69) / 12);

    // ビブラート用LFO (約5.5Hz)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(5.5, time);
    // 時間経過とともにビブラートが深くなる
    lfoGain.gain.setValueAtTime(0, time);
    lfoGain.gain.linearRampToValueAtTime(0, time + 0.15);
    lfoGain.gain.linearRampToValueAtTime(freq * 0.02, time + Math.min(duration, 0.6));

    // メインオシレータ（ノコギリ波＋三角波）
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // フォルマントフィルタ (F1: ~800Hz, F2: ~1800Hz 日本語の「あ〜お」の中間母音帯域)
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(750, time);
    f1.Q.setValueAtTime(4.0, time);

    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.setValueAtTime(1750, time);
    f2.Q.setValueAtTime(5.0, time);

    // ゲインエンベロープ
    const envGain = ctx.createGain();
    envGain.gain.setValueAtTime(0.0001, time);
    envGain.gain.linearRampToValueAtTime(velocity * 0.9, time + 0.03); // ソフトなアタック
    envGain.gain.setValueAtTime(velocity * 0.85, time + Math.max(0.05, duration - 0.08));
    envGain.gain.exponentialRampToValueAtTime(0.0001, time + duration + 0.05);

    osc.connect(f1);
    osc.connect(f2);
    f1.connect(envGain);
    f2.connect(envGain);
    envGain.connect(outputNode);

    lfo.start(time);
    osc.start(time);

    const stopTime = time + duration + 0.08;
    lfo.stop(stopTime);
    osc.stop(stopTime);
  }
}

