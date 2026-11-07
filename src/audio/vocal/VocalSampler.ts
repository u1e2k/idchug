/**
 * VocalSampler.ts - UTAU単独音 (CV) 実録歌声エンジン (ASCIIローマ字ファイル名対応)
 * 
 * 特徴:
 * 1. 【ASCIIローマ字ファイル名による堅牢性】
 *    ファイル名をすべて英小文字 (a.wav, ka.wav, zu.wav, sho.wav 等) で統一。
 *    Windows/Mac/Linux間のNFC/NFD濁点文字化けやURLエンコード事故を100%防止。
 * 2. 【歌詞対応・実音素サンプリング】
 *    歌詞のひらがな (「ず」「し」「て」「み」「ら」等) から対応するローマ字WAVを直接再生。
 * 3. 【オンデマンド & 一括プリロード】
 *    曲中で使われている歌詞のWAVを非同期で自動フェッチし、メモリ内にキャッシュ。
 * 4. 【ピッチシフト & ループ】
 *    原音キー (重音テト: D#4=63) からノートのMIDI番号へ正確にリサンプリング。
 *    定常部をループさせて音符の長さに完全同期。
 */

import { parseLyricToPhoneme, Vowel, Consonant } from './phonemeMap';
import { VocalSynthFallback } from './VocalSynthFallback';

export class VocalSampler {
  private ctx: AudioContext;
  private baseMidi: number = 63; // 重音テト(単独音)の基準キー: D#4
  private fallback: VocalSynthFallback;
  
  // ローマ字音素キーごとの実録AudioBufferキャッシュ (例: "a", "zu", "shi", "te", "ra" 等)
  private phonemeBuffers: Map<string, AudioBuffer> = new Map();
  // 読み込み中Promiseキャッシュ (二重fetch防止)
  private loadingPromises: Map<string, Promise<AudioBuffer | null>> = new Map();

  private isTetoReady: boolean = false;
  private voiceName: string = 'UTAU 重音テト (単独音)';

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.fallback = new VocalSynthFallback(ctx);

    // 基本母音 (a, i, u, e, o, n) を初期プリロード
    this.preloadPhonemes(['a', 'i', 'u', 'e', 'o', 'n']);
  }

  public getVoiceName(): string {
    return this.voiceName;
  }

  public isUsingRealWav(): boolean {
    return this.isTetoReady;
  }

  /**
   * 基本母音をプリロード (互換用エイリアス)
   */
  public async loadDefaultTetoVoices(): Promise<void> {
    await this.preloadPhonemes(['a', 'i', 'u', 'e', 'o', 'n']);
  }

  /**
   * 指定したローマ字音素 (例: "a", "zu", "sho") の実録WAVを取得 (未ロードなら自動fetch)
   */
  public async getOrFetchPhoneme(romaji: string): Promise<AudioBuffer | null> {
    if (this.phonemeBuffers.has(romaji)) {
      return this.phonemeBuffers.get(romaji)!;
    }

    if (this.loadingPromises.has(romaji)) {
      return this.loadingPromises.get(romaji)!;
    }

    const loadTask = (async () => {
      try {
        const url = `/voices/${romaji}.wav`;
        const res = await fetch(url);
        if (!res.ok) {
          return null;
        }
        const arrayBuf = await res.arrayBuffer();
        const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
        this.phonemeBuffers.set(romaji, audioBuf);
        this.isTetoReady = true;
        return audioBuf;
      } catch (err) {
        return null;
      } finally {
        this.loadingPromises.delete(romaji);
      }
    })();

    this.loadingPromises.set(romaji, loadTask);
    return loadTask;
  }

  /**
   * 複数のローマ字音素を一括事前ロード
   */
  public async preloadPhonemes(romajiList: string[]) {
    await Promise.all(
      romajiList.map(async (r) => {
        if (!r) return;
        await this.getOrFetchPhoneme(r);
      })
    );
  }

  /**
   * プロジェクト内の全ノートの歌詞から使われている音素を一括ロード
   */
  public async preloadLyrics(lyrics: (string | undefined)[]) {
    const list: string[] = [];
    lyrics.forEach((l) => {
      if (!l) return;
      const { romaji } = parseLyricToPhoneme(l);
      list.push(romaji);
    });
    const unique = Array.from(new Set(list));
    await this.preloadPhonemes(unique);
  }

  /**
   * ユーザー自作WAVを手動登録
   */
  public async loadWavFile(file: File, baseMidi: number = 63): Promise<{ phoneme: string; name: string }> {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);

    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/^_/, '');
    const { romaji, kana } = parseLyricToPhoneme(cleanName);

    this.phonemeBuffers.set(romaji, audioBuffer);
    this.phonemeBuffers.set(cleanName.toLowerCase(), audioBuffer);
    this.baseMidi = baseMidi;
    this.voiceName = file.name;
    this.isTetoReady = true;

    return { phoneme: kana || romaji, name: file.name };
  }

  /**
   * 実音素PCMサンプラーによる発音 (歌詞とメロディに完全同期)
   */
  public playNote(
    pitch: number,
    time: number,
    duration: number,
    velocity: number = 0.8,
    outputNode: AudioNode,
    lyric?: string
  ) {
    const ctx = this.ctx;
    const { romaji, vowel, consonant } = parseLyricToPhoneme(lyric);

    // 1. キャッシュから該当のローマ字実録WAVを取得
    let targetBuffer = this.phonemeBuffers.get(romaji);

    // まだキャッシュにない場合は非同期で次回用にfetch
    if (!targetBuffer) {
      this.getOrFetchPhoneme(romaji);
      // フォールバック: 母音バッファ (a, i, u, e, o)
      targetBuffer = this.phonemeBuffers.get(vowel) || this.fallback.getVowelBuffer(vowel);
    }

    if (!targetBuffer) return;

    // 2. 実音素WAVの再生 (AudioBufferSourceNode)
    const source = ctx.createBufferSource();
    source.buffer = targetBuffer;

    // リサンプリングによる音程制御
    const semitoneDiff = pitch - this.baseMidi;
    const targetPlaybackRate = Math.pow(2, semitoneDiff / 12);

    // サステインループ設定 (音符が長ければ定常部をループ)
    source.loop = true;
    const bufDuration = targetBuffer.duration;
    source.loopStart = Math.min(0.18, bufDuration * 0.25);
    source.loopEnd = Math.min(0.52, Math.max(source.loopStart + 0.1, bufDuration - 0.05));

    // ボカロ特有のピッチしゃくり
    const scoopRate = Math.pow(2, (semitoneDiff - 0.5) / 12);
    const attackTime = Math.min(0.035, duration * 0.25);
    source.playbackRate.setValueAtTime(scoopRate, time);
    source.playbackRate.exponentialRampToValueAtTime(targetPlaybackRate, time + attackTime);

    // 3. ビブラート付与 (ノート長が0.3秒以上の場合)
    if (duration > 0.3) {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(5.8, time);
      lfoGain.gain.setValueAtTime(0, time);
      lfoGain.gain.setValueAtTime(0, time + 0.16);
      lfoGain.gain.linearRampToValueAtTime(targetPlaybackRate * 0.016, time + Math.min(duration, 0.6));
      lfo.connect(lfoGain);
      lfoGain.connect(source.playbackRate);

      lfo.start(time);
      lfo.stop(time + duration + 0.06);
    }

    // 4. 自然な抜け感を作るプレゼンスEQ
    const presenceFilter = ctx.createBiquadFilter();
    presenceFilter.type = 'peaking';
    presenceFilter.frequency.setValueAtTime(3200, time);
    presenceFilter.gain.setValueAtTime(2.0, time);
    presenceFilter.Q.setValueAtTime(1.8, time);

    // 5. 音量エンベロープ (ADSR: 音符長に完全同期)
    const envGain = ctx.createGain();
    envGain.gain.setValueAtTime(0.0001, time);
    envGain.gain.linearRampToValueAtTime(velocity * 1.15, time + 0.012);
    envGain.gain.setValueAtTime(velocity * 1.0, time + Math.max(0.02, duration - 0.04));
    envGain.gain.exponentialRampToValueAtTime(0.0001, time + duration + 0.045);

    source.connect(presenceFilter);
    presenceFilter.connect(envGain);
    envGain.connect(outputNode);

    source.start(time);
    source.stop(time + duration + 0.05);

    // もし単独音WAVではなく母音フォールバックだった場合、子音ノイズバーストを補助
    if (!this.phonemeBuffers.has(romaji) && consonant !== 'none') {
      const consBuf = this.fallback.getConsonantBuffer(consonant);
      if (consBuf) {
        const consSource = ctx.createBufferSource();
        consSource.buffer = consBuf;
        const consGain = ctx.createGain();
        consGain.gain.setValueAtTime(0.25 * velocity, time);
        consSource.connect(consGain);
        consGain.connect(outputNode);
        consSource.start(time);
        consSource.stop(time + consBuf.duration);
      }
    }
  }
}
