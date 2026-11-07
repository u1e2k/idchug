import { TrackType, DrumInstrument } from '../types/project';
import { GuitarSynth } from './synths/GuitarSynth';
import { BassSynth } from './synths/BassSynth';
import { DrumSampler } from './synths/DrumSampler';
import { VocalSynth } from './synths/VocalSynth';
import { VocalSampler } from './synths/VocalSampler';
import { WorldVocoder } from './vocoder/WorldVocoder';
import { KeysSynth } from './synths/KeysSynth';

export interface TrackChannel {
  id: string;
  type: TrackType;
  gainNode: GainNode;
  panNode: StereoPannerNode;
  sendToReverbNode: GainNode;
}

/**
 * AudioEngine - Web Audio API のマスター・トラックルーティング管理
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;

  // スタジオ・リバーブ
  private convolver: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;

  // 各パート音源
  public guitarSynth!: GuitarSynth;
  public bassSynth!: BassSynth;
  public drumSampler!: DrumSampler;
  public vocalSynth!: VocalSynth;
  public vocalSampler!: VocalSampler;
  public worldVocoder!: WorldVocoder;
  public keysSynth!: KeysSynth;

  private trackChannels: Map<string, TrackChannel> = new Map();

  // マスターゲイン
  private currentMasterVolume: number = 0.85;

  constructor() {
    // ユーザー操作時に初期化
  }

  public setMasterVolume(vol: number) {
    this.currentMasterVolume = Math.max(0, Math.min(1.0, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.currentMasterVolume, this.ctx.currentTime);
    }
  }

  public getMasterVolume(): number {
    return this.currentMasterVolume;
  }

  public async init(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      // リミッター (過大入力によるクリッピング防止)
      this.limiter = this.ctx.createDynamicsCompressor();
      this.limiter.threshold.setValueAtTime(-1.0, this.ctx.currentTime);
      this.limiter.knee.setValueAtTime(0.0, this.ctx.currentTime);
      this.limiter.ratio.setValueAtTime(20.0, this.ctx.currentTime);
      this.limiter.attack.setValueAtTime(0.001, this.ctx.currentTime);
      this.limiter.release.setValueAtTime(0.1, this.ctx.currentTime);

      // マスターゲイン
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.currentMasterVolume, this.ctx.currentTime);

      // スタジオリバーブ (Room/Plate 空間演出)
      this.convolver = this.ctx.createConvolver();
      this.convolver.buffer = this.buildImpulseResponse(1.2, 2.5); // 1.2秒のナチュラルなスタジオ響き
      this.reverbGain = this.ctx.createGain();
      this.reverbGain.gain.setValueAtTime(0.22, this.ctx.currentTime); // ほんのり空間を付与

      this.convolver.connect(this.reverbGain);
      this.reverbGain.connect(this.masterGain);

      this.masterGain.connect(this.limiter);
      this.limiter.connect(this.ctx.destination);

      // シンセ初期化
      this.guitarSynth = new GuitarSynth(this.ctx);
      this.bassSynth = new BassSynth(this.ctx);
      this.drumSampler = new DrumSampler(this.ctx);
      this.vocalSynth = new VocalSynth(this.ctx);
      this.vocalSampler = new VocalSampler(this.ctx);
      this.worldVocoder = new WorldVocoder(this.ctx);
      this.keysSynth = new KeysSynth(this.ctx);
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    return this.ctx;
  }

  /**
   * スタジオの反射音をシミュレートするプロシージャル・インパルス応答生成
   */
  private buildImpulseResponse(durationSec: number, decay: number): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext missing');
    const rate = this.ctx.sampleRate;
    const length = rate * durationSec;
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const factor = Math.exp(-n * decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public get currentTime(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  /**
   * トラックチャンネルの作成または取得
   */
  public getOrCreateChannel(trackId: string, trackType: TrackType): TrackChannel {
    if (!this.ctx || !this.masterGain || !this.convolver) {
      throw new Error('AudioEngine is not initialized.');
    }

    let channel = this.trackChannels.get(trackId);
    if (!channel) {
      const gainNode = this.ctx.createGain();
      const panNode = this.ctx.createStereoPanner();
      const sendToReverb = this.ctx.createGain();

      // リバーブセンド量（パートによって調整）
      let sendLevel = 0.2;
      if (trackType === 'vocal') sendLevel = 0.45;
      if (trackType === 'lead_gt') sendLevel = 0.35;
      if (trackType === 'keys') sendLevel = 0.4;
      if (trackType === 'bass') sendLevel = 0.05; // ベースは低域を濁らせないため少なめ
      if (trackType === 'drums') sendLevel = 0.18;

      sendToReverb.gain.setValueAtTime(sendLevel, this.ctx.currentTime);

      gainNode.connect(panNode);
      panNode.connect(this.masterGain);

      // リバーブへセンド
      panNode.connect(sendToReverb);
      sendToReverb.connect(this.convolver);

      channel = {
        id: trackId,
        type: trackType,
        gainNode,
        panNode,
        sendToReverbNode: sendToReverb
      };
      this.trackChannels.set(trackId, channel);
    }
    return channel;
  }

  /**
   * トラックパラメータ更新 (Volume, Pan, Mute, Solo)
   */
  public updateTrackParams(
    trackId: string,
    params: { volume: number; pan: number; isMuted: boolean; isSolo: boolean; anySolo: boolean }
  ) {
    const channel = this.trackChannels.get(trackId);
    if (!channel || !this.ctx) return;

    let targetVolume = params.volume;
    if (params.isMuted) {
      targetVolume = 0;
    } else if (params.anySolo && !params.isSolo) {
      targetVolume = 0;
    }

    channel.gainNode.gain.setValueAtTime(targetVolume, this.ctx.currentTime);
    channel.panNode.pan.setValueAtTime(params.pan, this.ctx.currentTime);
  }

  /**
   * メトロノームクリック音の発音
   */
  public playClick(time: number, isAccent: boolean) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 1600 : 880, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(isAccent ? 0.4 : 0.22, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  /**
   * 即時プレビュー発音（ドラム単音）
   */
  public previewDrum(instrument: DrumInstrument) {
    if (!this.ctx || !this.masterGain) return;
    this.drumSampler.trigger(instrument, this.ctx.currentTime, 0.9, this.masterGain);
  }

  /**
   * 即時プレビュー発音（ギター・ベース等の単音/コード）
   */
  public previewNote(type: TrackType, pitch: number, isMuted: boolean = false) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    switch (type) {
      case 'rhythm_gt':
      case 'lead_gt':
        this.guitarSynth.playNotes([pitch, pitch + 7, pitch + 12], now, 0.4, 0.8, isMuted, this.masterGain);
        break;
      case 'bass':
        this.bassSynth.playNote(pitch, now, 0.35, 0.9, this.masterGain);
        break;
      case 'vocal':
        this.worldVocoder.playNote(pitch, now, 0.4, 0.8, this.masterGain);
        break;
      case 'keys':
        this.keysSynth.playNotes([pitch, pitch + 4, pitch + 7], now, 0.5, 0.8, this.masterGain);
        break;
    }
  }
}

export const audioEngine = new AudioEngine();
