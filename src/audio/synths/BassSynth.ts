/**
 * BassSynth - エレクトリック/シンセベース音源
 * サイン波＋三角波＋サチュレーションによる芯のある低音を生成
 */
export class BassSynth {
  private ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  /**
   * ベース単音を演奏
   */
  public playNote(
    midiPitch: number,
    time: number,
    duration: number,
    velocity: number = 0.85,
    outputNode: AudioNode
  ) {
    const ctx = this.ctx;
    const freq = 440 * Math.pow(2, (midiPitch - 69) / 12);

    // オシレータ1: サイン波 (太いサブベース)
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(freq, time);

    // オシレータ2: 三角波 (中域のコシとアタック感)
    const triOsc = ctx.createOscillator();
    triOsc.type = 'triangle';
    triOsc.frequency.setValueAtTime(freq, time);

    // ピッチドロップ（弦を弾いた瞬間のピッチベント）
    subOsc.frequency.setValueAtTime(freq * 1.05, time);
    subOsc.frequency.exponentialRampToValueAtTime(freq, time + 0.03);
    triOsc.frequency.setValueAtTime(freq * 1.05, time);
    triOsc.frequency.exponentialRampToValueAtTime(freq, time + 0.03);

    // フィルタ（ローパス）
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, time);
    // 指弾き/ピックのアタック感を出すエンベロープ
    filter.frequency.exponentialRampToValueAtTime(350, time + 0.12);
    filter.Q.setValueAtTime(2.0, time);

    // ゲインエンベロープ
    const gainNode = ctx.createGain();
    const effectiveDuration = Math.max(duration * 0.9, 0.05);

    gainNode.gain.setValueAtTime(0.0001, time);
    gainNode.gain.linearRampToValueAtTime(velocity * 1.2, time + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(velocity * 0.75, time + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + effectiveDuration);

    // 接続
    subOsc.connect(filter);
    triOsc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(outputNode);

    const stopTime = time + effectiveDuration + 0.05;
    subOsc.start(time);
    triOsc.start(time);
    subOsc.stop(stopTime);
    triOsc.stop(stopTime);
  }
}

