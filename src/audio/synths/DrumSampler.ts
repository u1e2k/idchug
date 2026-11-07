import { DrumInstrument } from '../../types/project';

/**
 * DrumSampler - プロシージャル合成ドラム音源
 * Kick, Snare, HiHat (Close/Open), Crash, Tomsを高品質なアルゴリズム合成で再生
 */
export class DrumSampler {
  private ctx: AudioContext;
  private noiseBuffer: AudioBuffer;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.noiseBuffer = this.createNoiseBuffer(2.0); // 2秒分のホワイトノイズ
  }

  private createNoiseBuffer(durationSeconds: number): AudioBuffer {
    const bufferSize = this.ctx.sampleRate * durationSeconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * ドラム打音をトリガー
   */
  public trigger(
    instrument: DrumInstrument,
    time: number,
    velocity: number = 0.8,
    outputNode: AudioNode
  ) {
    const vel = Math.max(0.1, Math.min(1.0, velocity));

    switch (instrument) {
      case 'kick':
        this.playKick(time, vel, outputNode);
        break;
      case 'snare':
        this.playSnare(time, vel, outputNode);
        break;
      case 'hihat_c':
        this.playHiHat(time, vel, false, outputNode);
        break;
      case 'hihat_o':
        this.playHiHat(time, vel, true, outputNode);
        break;
      case 'crash':
        this.playCrash(time, vel, outputNode);
        break;
      case 'tom_h':
        this.playTom(time, 180, 80, vel, outputNode);
        break;
      case 'tom_l':
        this.playTom(time, 120, 55, vel, outputNode);
        break;
    }
  }

  private playKick(time: number, vel: number, out: AudioNode) {
    const ctx = this.ctx;

    // ボディ（ピッチ急降下サイン波）
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.08);

    oscGain.gain.setValueAtTime(vel * 1.3, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(oscGain);
    oscGain.connect(out);

    // アタックのクリック（beater click）
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(320, time);
    clickOsc.frequency.exponentialRampToValueAtTime(60, time + 0.02);

    clickGain.gain.setValueAtTime(vel * 0.8, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);

    clickOsc.connect(clickGain);
    clickGain.connect(out);

    osc.start(time);
    clickOsc.start(time);
    osc.stop(time + 0.4);
    clickOsc.stop(time + 0.03);
  }

  private playSnare(time: number, vel: number, out: AudioNode) {
    const ctx = this.ctx;

    // トーン成分（ドラムシェル胴鳴り）
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(130, time + 0.07);

    oscGain.gain.setValueAtTime(vel * 0.7, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc.connect(oscGain);
    oscGain.connect(out);

    // ノイズ成分（スナッピー鳴り響き）
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1200, time);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(vel * 0.9, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(out);

    osc.start(time);
    noiseSource.start(time);
    osc.stop(time + 0.2);
    noiseSource.stop(time + 0.25);
  }

  private playHiHat(time: number, vel: number, isOpen: boolean, out: AudioNode) {
    const ctx = this.ctx;
    const duration = isOpen ? 0.35 : 0.055;

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;

    // メタリックバンドパス
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(8500, time);
    bpf.Q.setValueAtTime(4.0, time);

    // ハイパスで余分な低域カット
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(6500, time);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(vel * 0.8, time);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    noiseSource.connect(bpf);
    bpf.connect(hpf);
    hpf.connect(gainNode);
    gainNode.connect(out);

    noiseSource.start(time);
    noiseSource.stop(time + duration + 0.02);
  }

  private playCrash(time: number, vel: number, out: AudioNode) {
    const ctx = this.ctx;
    const duration = 1.4;

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;

    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(4500, time);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(vel * 0.9, time);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    noiseSource.connect(hpf);
    hpf.connect(gainNode);
    gainNode.connect(out);

    noiseSource.start(time);
    noiseSource.stop(time + duration + 0.05);
  }

  private playTom(time: number, startFreq: number, endFreq: number, vel: number, out: AudioNode) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.14);

    gainNode.gain.setValueAtTime(vel * 1.1, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

    osc.connect(gainNode);
    gainNode.connect(out);

    osc.start(time);
    osc.stop(time + 0.3);
  }
}

