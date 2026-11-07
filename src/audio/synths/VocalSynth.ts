/**
 * VocalSynth - ハイブリッド合成音声モデル (Vocaloid / UTAU 方式歌声エンジン)
 * 
 * アーキテクチャ:
 * 1. 【案1: 子音PCMサンプラー】
 *    歌詞の頭文字から子音 (k, s, t, n, m, r, z, etc.) を抽出し、
 *    音符の開始タイミングに完全同期して過渡的な子音PCMインパルスを発音。
 * 2. 【案2: 母音実声倍音ウェーブテーブル (PeriodicWave)】
 *    あ・い・う・え・お の各母音ごとの声帯パルス＋声道フォルマント共鳴スペクトルを
 *    フーリエ級数 (n=1〜64) で事前合成した専用ウェーブテーブル。
 * 3. 【ボカロ調声エンジン】
 *    音符開始時のピッチしゃくり (Attack Scoop: -0.8半音) ＆ 5.8Hz電子ビブラート、
 *    3.2kHzシンガーズフォルマント（初音ミク特有のキラキラした抜け感）。
 * 4. 【ミリ秒精度のリズム同期】
 *    Web Audio API のスケジューラにより、メロディの開始・長さ・タイミングに100%完全同期。
 */

export type Vowel = 'a' | 'i' | 'u' | 'e' | 'o';
export type Consonant = 'none' | 'k' | 's' | 'sh' | 't' | 'ch' | 'n' | 'h' | 'm' | 'y' | 'r' | 'w' | 'g' | 'z' | 'd' | 'b' | 'p';

export interface Phoneme {
  consonant: Consonant;
  vowel: Vowel;
}

export class VocalSynth {
  private ctx: AudioContext;
  private vowelWaves: Map<Vowel, PeriodicWave> = new Map();
  private consonantBuffers: Map<Consonant, AudioBuffer> = new Map();

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.initVowelWaveTables();
    this.initConsonantBuffers();
  }

  /**
   * 歌詞テキストを子音と母音 (Phoneme) に分解
   */
  public parsePhoneme(lyric?: string): Phoneme {
    if (!lyric || lyric.trim().length === 0) {
      return { consonant: 'none', vowel: 'a' };
    }

    const firstChar = lyric.trim()[0];

    // あ行 / 母音のみ
    if (/[あアカaA]/.test(firstChar)) return { consonant: 'none', vowel: 'a' };
    if (/[いイiI]/.test(firstChar)) return { consonant: 'none', vowel: 'i' };
    if (/[うウuU]/.test(firstChar)) return { consonant: 'none', vowel: 'u' };
    if (/[えエeE]/.test(firstChar)) return { consonant: 'none', vowel: 'e' };
    if (/[おオoO]/.test(firstChar)) return { consonant: 'none', vowel: 'o' };

    // か行
    if (/[かカ]/.test(firstChar)) return { consonant: 'k', vowel: 'a' };
    if (/[きキ]/.test(firstChar)) return { consonant: 'k', vowel: 'i' };
    if (/[くク]/.test(firstChar)) return { consonant: 'k', vowel: 'u' };
    if (/[けケ]/.test(firstChar)) return { consonant: 'k', vowel: 'e' };
    if (/[こコ]/.test(firstChar)) return { consonant: 'k', vowel: 'o' };

    // さ行
    if (/[さサ]/.test(firstChar)) return { consonant: 's', vowel: 'a' };
    if (/[しシ]/.test(firstChar)) return { consonant: 'sh', vowel: 'i' };
    if (/[すス]/.test(firstChar)) return { consonant: 's', vowel: 'u' };
    if (/[せセ]/.test(firstChar)) return { consonant: 's', vowel: 'e' };
    if (/[そソ]/.test(firstChar)) return { consonant: 's', vowel: 'o' };

    // た行
    if (/[たタ]/.test(firstChar)) return { consonant: 't', vowel: 'a' };
    if (/[ちチ]/.test(firstChar)) return { consonant: 'ch', vowel: 'i' };
    if (/[つツっッ]/.test(firstChar)) return { consonant: 't', vowel: 'u' };
    if (/[てテ]/.test(firstChar)) return { consonant: 't', vowel: 'e' };
    if (/[とト]/.test(firstChar)) return { consonant: 't', vowel: 'o' };

    // な行
    if (/[なナ]/.test(firstChar)) return { consonant: 'n', vowel: 'a' };
    if (/[にニ]/.test(firstChar)) return { consonant: 'n', vowel: 'i' };
    if (/[ぬヌんン]/.test(firstChar)) return { consonant: 'n', vowel: 'u' };
    if (/[ねネ]/.test(firstChar)) return { consonant: 'n', vowel: 'e' };
    if (/[のノ]/.test(firstChar)) return { consonant: 'n', vowel: 'o' };

    // は行
    if (/[はハ]/.test(firstChar)) return { consonant: 'h', vowel: 'a' };
    if (/[ひヒ]/.test(firstChar)) return { consonant: 'h', vowel: 'i' };
    if (/[ふフ]/.test(firstChar)) return { consonant: 'h', vowel: 'u' };
    if (/[へヘ]/.test(firstChar)) return { consonant: 'h', vowel: 'e' };
    if (/[ほホ]/.test(firstChar)) return { consonant: 'h', vowel: 'o' };

    // ま行
    if (/[まマ]/.test(firstChar)) return { consonant: 'm', vowel: 'a' };
    if (/[みミ]/.test(firstChar)) return { consonant: 'm', vowel: 'i' };
    if (/[むム]/.test(firstChar)) return { consonant: 'm', vowel: 'u' };
    if (/[めメ]/.test(firstChar)) return { consonant: 'm', vowel: 'e' };
    if (/[もモ]/.test(firstChar)) return { consonant: 'm', vowel: 'o' };

    // や行
    if (/[やヤ]/.test(firstChar)) return { consonant: 'y', vowel: 'a' };
    if (/[ゆユ]/.test(firstChar)) return { consonant: 'y', vowel: 'u' };
    if (/[よヨ]/.test(firstChar)) return { consonant: 'y', vowel: 'o' };

    // ら行
    if (/[らラ]/.test(firstChar)) return { consonant: 'r', vowel: 'a' };
    if (/[りリ]/.test(firstChar)) return { consonant: 'r', vowel: 'i' };
    if (/[るル]/.test(firstChar)) return { consonant: 'r', vowel: 'u' };
    if (/[れレ]/.test(firstChar)) return { consonant: 'r', vowel: 'e' };
    if (/[ろロ]/.test(firstChar)) return { consonant: 'r', vowel: 'o' };

    // わ行
    if (/[わワ]/.test(firstChar)) return { consonant: 'w', vowel: 'a' };
    if (/[をヲ]/.test(firstChar)) return { consonant: 'w', vowel: 'o' };

    // が行
    if (/[がガ]/.test(firstChar)) return { consonant: 'g', vowel: 'a' };
    if (/[ぎギ]/.test(firstChar)) return { consonant: 'g', vowel: 'i' };
    if (/[ぐグ]/.test(firstChar)) return { consonant: 'g', vowel: 'u' };
    if (/[げゲ]/.test(firstChar)) return { consonant: 'g', vowel: 'e' };
    if (/[ごゴ]/.test(firstChar)) return { consonant: 'g', vowel: 'o' };

    // ざ行
    if (/[ざザ]/.test(firstChar)) return { consonant: 'z', vowel: 'a' };
    if (/[じジ]/.test(firstChar)) return { consonant: 'z', vowel: 'i' };
    if (/[ずズ]/.test(firstChar)) return { consonant: 'z', vowel: 'u' };
    if (/[ぜゼ]/.test(firstChar)) return { consonant: 'z', vowel: 'e' };
    if (/[ぞゾ]/.test(firstChar)) return { consonant: 'z', vowel: 'o' };

    // だ行
    if (/[だダ]/.test(firstChar)) return { consonant: 'd', vowel: 'a' };
    if (/[ぢヂ]/.test(firstChar)) return { consonant: 'z', vowel: 'i' };
    if (/[づヅ]/.test(firstChar)) return { consonant: 'z', vowel: 'u' };
    if (/[でデ]/.test(firstChar)) return { consonant: 'd', vowel: 'e' };
    if (/[どド]/.test(firstChar)) return { consonant: 'd', vowel: 'o' };

    // ば行
    if (/[ばバ]/.test(firstChar)) return { consonant: 'b', vowel: 'a' };
    if (/[びビ]/.test(firstChar)) return { consonant: 'b', vowel: 'i' };
    if (/[ぶブ]/.test(firstChar)) return { consonant: 'b', vowel: 'u' };
    if (/[べベ]/.test(firstChar)) return { consonant: 'b', vowel: 'e' };
    if (/[ぼボ]/.test(firstChar)) return { consonant: 'b', vowel: 'o' };

    // ぱ行
    if (/[ぱパ]/.test(firstChar)) return { consonant: 'p', vowel: 'a' };
    if (/[ぴピ]/.test(firstChar)) return { consonant: 'p', vowel: 'i' };
    if (/[ぷプ]/.test(firstChar)) return { consonant: 'p', vowel: 'u' };
    if (/[ぺペ]/.test(firstChar)) return { consonant: 'p', vowel: 'e' };
    if (/[ぽポ]/.test(firstChar)) return { consonant: 'p', vowel: 'o' };

    return { consonant: 'none', vowel: 'a' };
  }

  /**
   * 【案2】母音ごとの声帯＋フォルマント倍音ウェーブテーブル (PeriodicWave) 生成
   */
  private initVowelWaveTables() {
    const vowels: Vowel[] = ['a', 'i', 'u', 'e', 'o'];
    const formantTargets: Record<Vowel, [number, number, number]> = {
      a: [850, 1550, 2850],
      i: [310, 2550, 3250],
      u: [360, 1250, 2550],
      e: [530, 2100, 2950],
      o: [460, 1000, 2650]
    };

    const numHarmonics = 64;
    // 基準周波数を C4 (約261.6Hz) と想定して各倍音周波数を計算
    const baseF0 = 261.63;

    for (const v of vowels) {
      const real = new Float32Array(numHarmonics);
      const imag = new Float32Array(numHarmonics);
      real[0] = 0;
      imag[0] = 0;

      const [f1, f2, f3] = formantTargets[v];

      for (let n = 1; n < numHarmonics; n++) {
        const freq = n * baseF0;

        // 声帯パルスの基本減衰 (Rosenberg波形: ~1/n^1.2)
        const glottalBase = 1.0 / Math.pow(n, 1.2);

        // ガウス型フォルマント共鳴関数
        const res1 = Math.exp(-Math.pow((freq - f1) / (f1 * 0.22), 2)) * 3.5;
        const res2 = Math.exp(-Math.pow((freq - f2) / (f2 * 0.20), 2)) * 2.5;
        const res3 = Math.exp(-Math.pow((freq - f3) / (f3 * 0.18), 2)) * 1.8;

        // 初音ミク特有の 3.2kHz シンガーズフォルマント共鳴
        const singersFormant = Math.exp(-Math.pow((freq - 3200) / 450, 2)) * 2.2;

        const totalAmp = glottalBase * (1.0 + res1 + res2 + res3 + singersFormant);
        imag[n] = totalAmp;
      }

      const wave = this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
      this.vowelWaves.set(v, wave);
    }
  }

  /**
   * 【案1】子音PCMサンプラーバッファの生成
   */
  private initConsonantBuffers() {
    const sampleRate = this.ctx.sampleRate;

    const createNoiseBurst = (durationSec: number, centerFreq: number, q: number, isPlosive: boolean): AudioBuffer => {
      const length = Math.floor(sampleRate * durationSec);
      const buffer = this.ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0, a1 = 0, a2 = 0;
      const w0 = (2 * Math.PI * centerFreq) / sampleRate;
      const alpha = Math.sin(w0) / (2 * q);
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
      const a0 = 1 + alpha;
      a1 = -2 * Math.cos(w0);
      a2 = 1 - alpha;

      let x1 = 0, x2 = 0, y1 = 0, y2 = 0;

      for (let i = 0; i < length; i++) {
        const t = i / length;
        // エンベロープ (破裂音は急峻な指数減衰、摩擦音は持続)
        const env = isPlosive ? Math.exp(-t * 12) : Math.sin(t * Math.PI);
        const white = (Math.random() * 2 - 1) * env;

        const y = (b0 / a0) * white + (b1 / a0) * x1 + (b2 / a0) * x2 - (a1 / a0) * y1 - (a2 / a0) * y2;
        x2 = x1;
        x1 = white;
        y2 = y1;
        y1 = y;

        data[i] = Math.max(-1, Math.min(1, y * 2.5));
      }
      return buffer;
    };

    // 子音ごとのPCMインパルス
    this.consonantBuffers.set('none', createNoiseBurst(0.008, 1200, 1.5, true)); // 声門アタック
    this.consonantBuffers.set('s', createNoiseBurst(0.035, 6500, 2.0, false));   // 「さ・す・せ・そ」摩擦
    this.consonantBuffers.set('sh', createNoiseBurst(0.040, 5200, 2.5, false));  // 「し」摩擦
    this.consonantBuffers.set('k', createNoiseBurst(0.016, 4200, 3.0, true));   // 「か・き・く・け・こ」破裂
    this.consonantBuffers.set('t', createNoiseBurst(0.014, 4500, 3.5, true));   // 「た・て・と」破裂
    this.consonantBuffers.set('ch', createNoiseBurst(0.025, 4800, 2.5, true));  // 「ち」破擦
    this.consonantBuffers.set('z', createNoiseBurst(0.030, 3800, 2.0, false));  // 「ざ・ず・ぜ・ぞ」有声摩擦
    this.consonantBuffers.set('p', createNoiseBurst(0.014, 3000, 2.0, true));   // 「ぱ・ぴ・ぷ・ぺ・ぽ」
    this.consonantBuffers.set('b', createNoiseBurst(0.016, 1500, 2.0, true));   // 「ば・び・ぶ・べ・ぼ」
    this.consonantBuffers.set('d', createNoiseBurst(0.014, 2500, 2.5, true));   // 「だ・で・ど」
    this.consonantBuffers.set('g', createNoiseBurst(0.016, 2200, 2.5, true));   // 「が・ぎ・ぐ・げ・ご」
    this.consonantBuffers.set('m', createNoiseBurst(0.025, 300, 1.5, false));   // 「ま・み・む・め・も」鼻音
    this.consonantBuffers.set('n', createNoiseBurst(0.025, 450, 1.5, false));   // 「な・に・ぬ・ね・の」
    this.consonantBuffers.set('h', createNoiseBurst(0.022, 2800, 1.2, false));  // 「は・ひ・ふ・へ・ほ」気流
    this.consonantBuffers.set('r', createNoiseBurst(0.016, 1800, 2.0, true));   // 「ら・り・る・れ・ろ」弾き
    this.consonantBuffers.set('y', createNoiseBurst(0.020, 2200, 2.0, false));  // 「や・ゆ・よ」
    this.consonantBuffers.set('w', createNoiseBurst(0.020, 800, 1.5, false));   // 「わ・を」
  }

  /**
   * 音符発音 (メロディーのリズムに100%ミリ秒完全同期)
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
    const targetFreq = 440 * Math.pow(2, (pitch - 69) / 12);
    const { consonant, vowel } = this.parsePhoneme(lyric);

    // 1. 【案1: 子音PCMサンプラー発音】
    // 音符の開始時刻 time に正確にトリガー
    const consonantBuf = this.consonantBuffers.get(consonant) || this.consonantBuffers.get('none')!;
    const consonantSource = ctx.createBufferSource();
    consonantSource.buffer = consonantBuf;

    const consonantGain = ctx.createGain();
    const consLevel = consonant === 's' || consonant === 'sh' || consonant === 'z' ? 0.32 : 0.22;
    consonantGain.gain.setValueAtTime(consLevel * velocity, time);

    consonantSource.connect(consonantGain);
    consonantGain.connect(outputNode);

    consonantSource.start(time);
    consonantSource.stop(time + consonantBuf.duration);

    // 2. 【案2: 母音ウェーブテーブル発音】
    const wave = this.vowelWaves.get(vowel) || this.vowelWaves.get('a')!;
    const oscVowel = ctx.createOscillator();
    oscVowel.setPeriodicWave(wave);

    // 初音ミクらしい微小なパルス波のブレンド (ロボ声・キラキラ感)
    const oscSquare = ctx.createOscillator();
    oscSquare.type = 'square';

    // 3. ボカロ特有のピッチアーティキュレーション
    // (A) ピッチしゃくり (Attack Scoop: -0.8半音から立ち上がる)
    const scoopStartFreq = targetFreq * Math.pow(2, -0.8 / 12);
    const attackTime = Math.min(0.038, duration * 0.35);

    // (B) 電子ビブラート (5.8Hz, 0.16秒後から自然に揺れる)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(5.8, time);
    lfoGain.gain.setValueAtTime(0, time);
    lfoGain.gain.setValueAtTime(0, time + 0.16);
    lfoGain.gain.linearRampToValueAtTime(targetFreq * 0.022, time + Math.min(duration, 0.55));
    lfo.connect(lfoGain);

    [oscVowel, oscSquare].forEach((osc) => {
      osc.frequency.setValueAtTime(scoopStartFreq, time);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, time + attackTime);
      lfoGain.connect(osc.frequency);
    });

    // オシレーターミックス (実声ウェーブテーブル 82% + パルス波 18%)
    const vowelGain = ctx.createGain();
    vowelGain.gain.setValueAtTime(0.82, time);
    const squareGain = ctx.createGain();
    squareGain.gain.setValueAtTime(0.18, time);

    oscVowel.connect(vowelGain);
    oscSquare.connect(squareGain);

    const voiceMix = ctx.createGain();
    vowelGain.connect(voiceMix);
    squareGain.connect(voiceMix);

    // 4. 初音ミクのシンガーズフォルマント (3.2kHz プレゼンスブースト)
    const mikuPresence = ctx.createBiquadFilter();
    mikuPresence.type = 'peaking';
    mikuPresence.frequency.setValueAtTime(3200, time);
    mikuPresence.gain.setValueAtTime(6.0, time); // +6dB
    mikuPresence.Q.setValueAtTime(2.5, time);

    // 超高域の滑らかさ (ローパス 8kHz)
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(8000, time);
    lowpass.Q.setValueAtTime(0.7, time);

    voiceMix.connect(mikuPresence);
    mikuPresence.connect(lowpass);

    // 5. 音価（音符の長さ duration）に100%同期したエンベロープ (ADSR)
    const mainEnv = ctx.createGain();
    mainEnv.gain.setValueAtTime(0.0001, time);
    // 子音と滑らかにクロスフェードするアタック (12ms)
    mainEnv.gain.linearRampToValueAtTime(velocity * 1.0, time + 0.012);
    // 音符の終わりまでサステイン
    mainEnv.gain.setValueAtTime(velocity * 0.94, time + Math.max(0.02, duration - 0.04));
    // リリース (自然な減衰: 40ms)
    mainEnv.gain.exponentialRampToValueAtTime(0.0001, time + duration + 0.04);

    lowpass.connect(mainEnv);
    mainEnv.connect(outputNode);

    // 発音スタート＆ストップ
    lfo.start(time);
    oscVowel.start(time);
    oscSquare.start(time);

    const stopTime = time + duration + 0.05;
    lfo.stop(stopTime);
    oscVowel.stop(stopTime);
    oscSquare.stop(stopTime);
  }
}
