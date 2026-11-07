/**
 * GuitarSynth - エレキギター音源
 * ディストーション（WaveShaperNode）とLPF（ブリッジミュート/オープン）による
 * 重厚なモダンハイゲイン・ギターサウンドを合成
 */
export class GuitarSynth {
  private ctx: AudioContext;
  private distortionCurve: Float32Array;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.distortionCurve = this.makeDistortionCurve(60); // 歪み度合い
  }

  // ソフトクリッピング/ハードクリッピング用カーブ生成
  private makeDistortionCurve(amount: number): Float32Array {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      // 高域の倍音が出るソフトサチュレーション
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  /**
   * 単音またはコードを演奏
   * @param pitches MIDIノート番号の配列
   * @param time 発音時刻
   * @param duration 持続時間（秒）
   * @param velocity ベロシティ (0.0〜1.0)
   * @param isMuted ブリッジミュート (P.M.) かどうか
   * @param outputNode 接続先ノード
   */
  public playNotes(
    pitches: number[],
    time: number,
    duration: number,
    velocity: number = 0.8,
    isMuted: boolean = false,
    outputNode: AudioNode
  ) {
    const ctx = this.ctx;

    // トラッキング用バス
    const voiceBus = ctx.createGain();

    // ディストーション（WaveShaper）
    const shaper = ctx.createWaveShaper();
    shaper.curve = this.distortionCurve as any;
    shaper.oversample = '4x';

    // キャビネット/トーン用LPF
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';

    // 存在感を出すピーキングイコライザー（ミッドブースト）
    const midEq = ctx.createBiquadFilter();
    midEq.type = 'peaking';
    midEq.frequency.setValueAtTime(2200, time);
    midEq.Q.setValueAtTime(1.5, time);
    midEq.gain.setValueAtTime(4, time);

    // エンベロープゲイン
    const envGain = ctx.createGain();

    if (isMuted) {
      // ブリッジミュート (Palm Mute / Chug):
      // LPFカットオフを絞り（約1000〜1400Hz）、短いディケイ（約0.18秒）でタイトに減衰
      filter.frequency.setValueAtTime(1400, time);
      filter.Q.setValueAtTime(3.0, time); // ギュッと詰まったレゾナンス

      // アタック〜ディケイ
      const muteDuration = Math.min(duration, 0.22);
      envGain.gain.setValueAtTime(0.0001, time);
      envGain.gain.linearRampToValueAtTime(velocity * 1.1, time + 0.004); // アタック
      envGain.gain.exponentialRampToValueAtTime(0.0001, time + muteDuration);
    } else {
      // オープンストローク / 通常:
      // LPFカットオフを高め（約5500〜6500Hz）にし、サステインを持たせる
      filter.frequency.setValueAtTime(5800, time);
      filter.frequency.exponentialRampToValueAtTime(3000, time + duration);
      filter.Q.setValueAtTime(1.2, time);

      envGain.gain.setValueAtTime(0.0001, time);
      envGain.gain.linearRampToValueAtTime(velocity, time + 0.008);
      // サステインとリリース
      const decayTime = Math.max(duration - 0.05, 0.05);
      envGain.gain.exponentialRampToValueAtTime(velocity * 0.65, time + decayTime);
      envGain.gain.exponentialRampToValueAtTime(0.0001, time + duration + 0.08);
    }

    // 接続: voiceBus -> shaper -> filter -> midEq -> envGain -> outputNode
    voiceBus.connect(shaper);
    shaper.connect(filter);
    filter.connect(midEq);
    midEq.connect(envGain);
    envGain.connect(outputNode);

    // ピッチごとにオシレータ（ノコギリ波＋パルス波の複合）を起動
    pitches.forEach((midi) => {
      const freq = 440 * Math.pow(2, (midi - 69) / 12);

      // Sawtooth (ザラザラした倍音)
      const saw = ctx.createOscillator();
      saw.type = 'sawtooth';
      saw.frequency.setValueAtTime(freq, time);
      // 少しデチューンして太さを出す
      saw.detune.setValueAtTime(-4, time);

      // Square/Pulse (コシのある芯)
      const sq = ctx.createOscillator();
      sq.type = 'square';
      sq.frequency.setValueAtTime(freq, time);
      sq.detune.setValueAtTime(4, time);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.5 / pitches.length, time);

      saw.connect(oscGain);
      sq.connect(oscGain);
      oscGain.connect(voiceBus);

      const stopTime = time + duration + 0.12;
      saw.start(time);
      sq.start(time);
      saw.stop(stopTime);
      sq.stop(stopTime);
    });
  }
}

