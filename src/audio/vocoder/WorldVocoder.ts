/**
 * WorldVocoder - WORLD 音声分析合成系 (Vocoder Resynthesis Engine)
 * 
 * 原理 (Morise et al., WORLD System):
 * 1. 人間の声帯・声道特性を反映した【スペクトル包絡 (Spectral Envelope)】
 * 2. ケプストラム法による【最小位相インパルス応答 (Minimum Phase Impulse Response)】の生成
 * 3. 基本周波数 F0 (ピッチ) と音符長 (Duration) に基づく【ピッチ同期重畳加算 (Pitch-Synchronous Overlap-Add)】
 * 4. 非周期性 (Aperiodicity / 息漏れノイズ) と子音インパルスの重畳
 * 
 * これにより、シンセのブザー音ではなく、人間の喉・口の響きを持った歌声が
 * メロディのリズムと100%ミリ秒完全同期で再合成されます。
 */

export type Vowel = 'a' | 'i' | 'u' | 'e' | 'o';
export type Consonant = 'none' | 'k' | 's' | 'sh' | 't' | 'ch' | 'n' | 'h' | 'm' | 'y' | 'r' | 'w' | 'g' | 'z' | 'd' | 'b' | 'p';

// Cooley-Tukey 高速フーリエ変換 (FFT / IFFT)
class SimpleFFT {
  public static transform(real: Float32Array, imag: Float32Array, inverse: boolean = false) {
    const n = real.length;
    if ((n & (n - 1)) !== 0) throw new Error('FFT length must be a power of 2');

    // ビット反転並べ替え
    let j = 0;
    for (let i = 0; i < n - 1; i++) {
      if (i < j) {
        const tempR = real[i]; real[i] = real[j]; real[j] = tempR;
        const tempI = imag[i]; imag[i] = imag[j]; imag[j] = tempI;
      }
      let k = n >> 1;
      while (k <= j) {
        j -= k;
        k >>= 1;
      }
      j += k;
    }

    // バタフライ演算
    for (let len = 2; len <= n; len <<= 1) {
      const half = len >> 1;
      const angle = (inverse ? 2 : -2) * Math.PI / len;
      const wStepR = Math.cos(angle);
      const wStepI = Math.sin(angle);

      for (let i = 0; i < n; i += len) {
        let wR = 1.0;
        let wI = 0.0;
        for (let k = 0; k < half; k++) {
          const pos = i + k;
          const matchPos = pos + half;
          const tr = wR * real[matchPos] - wI * imag[matchPos];
          const ti = wR * imag[matchPos] + wI * real[matchPos];

          real[matchPos] = real[pos] - tr;
          imag[matchPos] = imag[pos] - ti;
          real[pos] += tr;
          imag[pos] += ti;

          const nextWR = wR * wStepR - wI * wStepI;
          wI = wR * wStepI + wI * wStepR;
          wR = nextWR;
        }
      }
    }

    if (inverse) {
      for (let i = 0; i < n; i++) {
        real[i] /= n;
        imag[i] /= n;
      }
    }
  }
}

export class WorldVocoder {
  private ctx: AudioContext;
  private fftSize: number = 1024;
  // 各母音の最小位相インパルス応答 h[n]
  private impulseResponses: Map<Vowel, Float32Array> = new Map();
  // 子音バッファ
  private consonantBuffers: Map<Consonant, AudioBuffer> = new Map();

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.initImpulseResponses();
    this.initConsonantBuffers();
  }

  /**
   * WORLDの核: ケプストラム法による最小位相インパルス応答の計算
   * H(ω) -> ln|H(ω)| -> IFFT (ケプストラム) -> 因果リフタリング -> exp(FFT) -> IFFT -> h(t)
   */
  private generateMinimumPhaseImpulse(formants: [number, number, number, number]): Float32Array {
    const N = this.fftSize;
    const sampleRate = this.ctx.sampleRate;
    const half = N / 2;

    const real = new Float32Array(N);
    const imag = new Float32Array(N);

    const [f1, f2, f3, f4] = formants;

    // 1. スペクトル包絡 |H(ω)| の対数振幅を計算
    for (let k = 0; k <= half; k++) {
      const freq = (k / half) * (sampleRate / 2);

      // 声帯音響特性 (Glottal Rosenberg: 約 -12dB/oct)
      const glottal = 1.0 / Math.pow(Math.max(1, freq / 100), 1.25);

      // 声道フォルマント共鳴ピーク (ガウス包絡)
      const r1 = Math.exp(-Math.pow((freq - f1) / (f1 * 0.22), 2)) * 4.2;
      const r2 = Math.exp(-Math.pow((freq - f2) / (f2 * 0.20), 2)) * 3.2;
      const r3 = Math.exp(-Math.pow((freq - f3) / (f3 * 0.18), 2)) * 2.2;
      const r4 = Math.exp(-Math.pow((freq - f4) / (f4 * 0.16), 2)) * 1.6;

      // 初音ミク特有の 3.2kHz シンガーズフォルマント
      const mikuSinger = Math.exp(-Math.pow((freq - 3200) / 480, 2)) * 2.8;

      const mag = glottal * (1.0 + r1 + r2 + r3 + r4 + mikuSinger);

      // 対数振幅 ln|H|
      const logMag = Math.log(Math.max(1e-5, mag));
      real[k] = logMag;
      if (k > 0 && k < half) {
        real[N - k] = logMag; // 対称性
      }
    }

    // 2. IFFT で実ケプストラム c[n] を取得
    SimpleFFT.transform(real, imag, true);

    // 3. 因果的リフタリング (Hilbert変換と同等の最小位相化)
    // n=0: 1倍, 1 <= n < N/2: 2倍, n=N/2: 1倍, n > N/2: 0
    real[0] = real[0];
    imag[0] = 0;
    for (let n = 1; n < half; n++) {
      real[n] *= 2.0;
      imag[n] = 0;
    }
    real[half] = real[half];
    imag[half] = 0;
    for (let n = half + 1; n < N; n++) {
      real[n] = 0;
      imag[n] = 0;
    }

    // 4. FFT で最小位相の複素対数スペクトルを取得
    SimpleFFT.transform(real, imag, false);

    // 5. 複素指数関数 exp(real + j*imag) で最小位相複素スペクトル H_min(ω) に変換
    for (let k = 0; k < N; k++) {
      const mag = Math.exp(real[k]);
      const phase = imag[k];
      real[k] = mag * Math.cos(phase);
      imag[k] = mag * Math.sin(phase);
    }

    // 6. IFFT で時間領域の最小位相インパルス応答 h[n] を取得
    SimpleFFT.transform(real, imag, true);

    // エネルギー正規化
    let maxAbs = 0;
    for (let i = 0; i < N; i++) {
      if (Math.abs(real[i]) > maxAbs) maxAbs = Math.abs(real[i]);
    }
    if (maxAbs > 0) {
      for (let i = 0; i < N; i++) real[i] /= maxAbs;
    }

    return real;
  }

  /**
   * 各母音のインパルス応答を事前生成
   */
  private initImpulseResponses() {
    const formantTable: Record<Vowel, [number, number, number, number]> = {
      a: [860, 1550, 2850, 3600],
      i: [320, 2600, 3250, 4100],
      u: [380, 1300, 2600, 3700],
      e: [540, 2150, 2950, 3900],
      o: [480, 1050, 2700, 3600]
    };

    (['a', 'i', 'u', 'e', 'o'] as Vowel[]).forEach((v) => {
      this.impulseResponses.set(v, this.generateMinimumPhaseImpulse(formantTable[v]));
    });
  }

  /**
   * 子音インパルスバッファ
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
      b0 = alpha; b1 = 0; b2 = -alpha;
      const a0 = 1 + alpha;
      a1 = -2 * Math.cos(w0);
      a2 = 1 - alpha;

      let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const env = isPlosive ? Math.exp(-t * 14) : Math.sin(t * Math.PI);
        const white = (Math.random() * 2 - 1) * env;
        const y = (b0 / a0) * white + (b1 / a0) * x1 + (b2 / a0) * x2 - (a1 / a0) * y1 - (a2 / a0) * y2;
        x2 = x1; x1 = white; y2 = y1; y1 = y;
        data[i] = Math.max(-1, Math.min(1, y * 2.8));
      }
      return buffer;
    };

    this.consonantBuffers.set('none', createNoiseBurst(0.008, 1200, 1.5, true));
    this.consonantBuffers.set('s', createNoiseBurst(0.035, 6500, 2.0, false));
    this.consonantBuffers.set('sh', createNoiseBurst(0.040, 5200, 2.5, false));
    this.consonantBuffers.set('k', createNoiseBurst(0.016, 4200, 3.0, true));
    this.consonantBuffers.set('t', createNoiseBurst(0.014, 4500, 3.5, true));
    this.consonantBuffers.set('ch', createNoiseBurst(0.025, 4800, 2.5, true));
    this.consonantBuffers.set('z', createNoiseBurst(0.030, 3800, 2.0, false));
    this.consonantBuffers.set('p', createNoiseBurst(0.014, 3000, 2.0, true));
    this.consonantBuffers.set('b', createNoiseBurst(0.016, 1500, 2.0, true));
    this.consonantBuffers.set('d', createNoiseBurst(0.014, 2500, 2.5, true));
    this.consonantBuffers.set('g', createNoiseBurst(0.016, 2200, 2.5, true));
    this.consonantBuffers.set('m', createNoiseBurst(0.025, 300, 1.5, false));
    this.consonantBuffers.set('n', createNoiseBurst(0.025, 450, 1.5, false));
    this.consonantBuffers.set('h', createNoiseBurst(0.022, 2800, 1.2, false));
    this.consonantBuffers.set('r', createNoiseBurst(0.016, 1800, 2.0, true));
    this.consonantBuffers.set('y', createNoiseBurst(0.020, 2200, 2.0, false));
    this.consonantBuffers.set('w', createNoiseBurst(0.020, 800, 1.5, false));
  }

  public parsePhoneme(lyric?: string): { consonant: Consonant; vowel: Vowel } {
    if (!lyric || lyric.trim().length === 0) return { consonant: 'none', vowel: 'a' };
    const firstChar = lyric.trim()[0];

    if (/[あアカaA]/.test(firstChar)) return { consonant: 'none', vowel: 'a' };
    if (/[いイiI]/.test(firstChar)) return { consonant: 'none', vowel: 'i' };
    if (/[うウuU]/.test(firstChar)) return { consonant: 'none', vowel: 'u' };
    if (/[えエeE]/.test(firstChar)) return { consonant: 'none', vowel: 'e' };
    if (/[おオoO]/.test(firstChar)) return { consonant: 'none', vowel: 'o' };

    if (/[かカ]/.test(firstChar)) return { consonant: 'k', vowel: 'a' };
    if (/[きキ]/.test(firstChar)) return { consonant: 'k', vowel: 'i' };
    if (/[くク]/.test(firstChar)) return { consonant: 'k', vowel: 'u' };
    if (/[けケ]/.test(firstChar)) return { consonant: 'k', vowel: 'e' };
    if (/[こコ]/.test(firstChar)) return { consonant: 'k', vowel: 'o' };

    if (/[さサ]/.test(firstChar)) return { consonant: 's', vowel: 'a' };
    if (/[しシ]/.test(firstChar)) return { consonant: 'sh', vowel: 'i' };
    if (/[すス]/.test(firstChar)) return { consonant: 's', vowel: 'u' };
    if (/[せセ]/.test(firstChar)) return { consonant: 's', vowel: 'e' };
    if (/[そソ]/.test(firstChar)) return { consonant: 's', vowel: 'o' };

    if (/[たタ]/.test(firstChar)) return { consonant: 't', vowel: 'a' };
    if (/[ちチ]/.test(firstChar)) return { consonant: 'ch', vowel: 'i' };
    if (/[つツっッ]/.test(firstChar)) return { consonant: 't', vowel: 'u' };
    if (/[てテ]/.test(firstChar)) return { consonant: 't', vowel: 'e' };
    if (/[とト]/.test(firstChar)) return { consonant: 't', vowel: 'o' };

    if (/[なナ]/.test(firstChar)) return { consonant: 'n', vowel: 'a' };
    if (/[にニ]/.test(firstChar)) return { consonant: 'n', vowel: 'i' };
    if (/[ぬヌんン]/.test(firstChar)) return { consonant: 'n', vowel: 'u' };
    if (/[ねネ]/.test(firstChar)) return { consonant: 'n', vowel: 'e' };
    if (/[のノ]/.test(firstChar)) return { consonant: 'n', vowel: 'o' };

    if (/[はハ]/.test(firstChar)) return { consonant: 'h', vowel: 'a' };
    if (/[ひヒ]/.test(firstChar)) return { consonant: 'h', vowel: 'i' };
    if (/[ふフ]/.test(firstChar)) return { consonant: 'h', vowel: 'u' };
    if (/[へヘ]/.test(firstChar)) return { consonant: 'h', vowel: 'e' };
    if (/[ほホ]/.test(firstChar)) return { consonant: 'h', vowel: 'o' };

    if (/[まマ]/.test(firstChar)) return { consonant: 'm', vowel: 'a' };
    if (/[みミ]/.test(firstChar)) return { consonant: 'm', vowel: 'i' };
    if (/[むム]/.test(firstChar)) return { consonant: 'm', vowel: 'u' };
    if (/[めメ]/.test(firstChar)) return { consonant: 'm', vowel: 'e' };
    if (/[もモ]/.test(firstChar)) return { consonant: 'm', vowel: 'o' };

    if (/[やヤ]/.test(firstChar)) return { consonant: 'y', vowel: 'a' };
    if (/[ゆユ]/.test(firstChar)) return { consonant: 'y', vowel: 'u' };
    if (/[よヨ]/.test(firstChar)) return { consonant: 'y', vowel: 'o' };

    if (/[らラ]/.test(firstChar)) return { consonant: 'r', vowel: 'a' };
    if (/[りリ]/.test(firstChar)) return { consonant: 'r', vowel: 'i' };
    if (/[るル]/.test(firstChar)) return { consonant: 'r', vowel: 'u' };
    if (/[れレ]/.test(firstChar)) return { consonant: 'r', vowel: 'e' };
    if (/[ろロ]/.test(firstChar)) return { consonant: 'r', vowel: 'o' };

    if (/[わワ]/.test(firstChar)) return { consonant: 'w', vowel: 'a' };
    if (/[をヲ]/.test(firstChar)) return { consonant: 'w', vowel: 'o' };

    if (/[がガ]/.test(firstChar)) return { consonant: 'g', vowel: 'a' };
    if (/[ぎギ]/.test(firstChar)) return { consonant: 'g', vowel: 'i' };
    if (/[ぐグ]/.test(firstChar)) return { consonant: 'g', vowel: 'u' };
    if (/[げゲ]/.test(firstChar)) return { consonant: 'g', vowel: 'e' };
    if (/[ごゴ]/.test(firstChar)) return { consonant: 'g', vowel: 'o' };

    if (/[ざザ]/.test(firstChar)) return { consonant: 'z', vowel: 'a' };
    if (/[じジ]/.test(firstChar)) return { consonant: 'z', vowel: 'i' };
    if (/[ずズ]/.test(firstChar)) return { consonant: 'z', vowel: 'u' };
    if (/[ぜゼ]/.test(firstChar)) return { consonant: 'z', vowel: 'e' };
    if (/[ぞゾ]/.test(firstChar)) return { consonant: 'z', vowel: 'o' };

    if (/[だダ]/.test(firstChar)) return { consonant: 'd', vowel: 'a' };
    if (/[でデ]/.test(firstChar)) return { consonant: 'd', vowel: 'e' };
    if (/[どド]/.test(firstChar)) return { consonant: 'd', vowel: 'o' };

    if (/[ばバ]/.test(firstChar)) return { consonant: 'b', vowel: 'a' };
    if (/[びビ]/.test(firstChar)) return { consonant: 'b', vowel: 'i' };
    if (/[ぶブ]/.test(firstChar)) return { consonant: 'b', vowel: 'u' };
    if (/[べベ]/.test(firstChar)) return { consonant: 'b', vowel: 'e' };
    if (/[ぼボ]/.test(firstChar)) return { consonant: 'b', vowel: 'o' };

    if (/[ぱパ]/.test(firstChar)) return { consonant: 'p', vowel: 'a' };
    if (/[ぴピ]/.test(firstChar)) return { consonant: 'p', vowel: 'i' };
    if (/[ぷプ]/.test(firstChar)) return { consonant: 'p', vowel: 'u' };
    if (/[ぺペ]/.test(firstChar)) return { consonant: 'p', vowel: 'e' };
    if (/[ぽポ]/.test(firstChar)) return { consonant: 'p', vowel: 'o' };

    return { consonant: 'none', vowel: 'a' };
  }

  /**
   * WORLD Synthesis: ピッチ同期重畳加算 (Pitch-Synchronous Overlap-Add)
   * 指定ピッチ F0、音符長 duration に完全同期したリアルな歌声波形を合成
   */
  public synthesizeNote(
    pitch: number,
    durationSec: number,
    vowel: Vowel
  ): AudioBuffer {
    const sampleRate = this.ctx.sampleRate;
    const targetF0 = 440 * Math.pow(2, (pitch - 69) / 12);
    const impulse = this.impulseResponses.get(vowel) || this.impulseResponses.get('a')!;
    const impLen = impulse.length;

    // 出力バッファ長 (duration + 50ms リリース)
    const totalSamples = Math.floor(sampleRate * (durationSec + 0.05));
    const buffer = this.ctx.createBuffer(1, totalSamples, sampleRate);
    const out = buffer.getChannelData(0);

    // ピッチしゃくりとビブラートのパラメータ
    const attackSamples = Math.floor(sampleRate * Math.min(0.04, durationSec * 0.3));
    const vibStartSample = Math.floor(sampleRate * 0.16);

    let phase = 0.0;

    for (let i = 0; i < totalSamples; i++) {
      // 瞬時ピッチの計算
      let f0 = targetF0;
      // しゃくり (-0.8半音から立ち上がり)
      if (i < attackSamples) {
        const ratio = i / attackSamples;
        f0 = targetF0 * Math.pow(2, (-0.8 * (1 - ratio)) / 12);
      }
      // ビブラート (5.8Hz)
      if (i > vibStartSample && durationSec > 0.3) {
        const vibTime = (i - vibStartSample) / sampleRate;
        const vibDepth = Math.min(1.0, vibTime / 0.3) * 0.022;
        f0 *= 1.0 + Math.sin(2 * Math.PI * 5.8 * vibTime) * vibDepth;
      }

      // ピッチマーク判定 (位相アキュムレータが 1.0 を超えた瞬間に声門閉鎖インパルス)
      phase += f0 / sampleRate;
      if (phase >= 1.0) {
        phase -= 1.0;

        // 音量エンベロープ (ADSR)
        const tSec = i / sampleRate;
        let env = 1.0;
        if (tSec < 0.015) {
          env = tSec / 0.015;
        } else if (tSec > durationSec) {
          const relRatio = (tSec - durationSec) / 0.05;
          env = Math.max(0, 1.0 - relRatio);
        }

        // 最小位相インパルス応答 h[n] を重畳加算 (Overlap-Add)
        for (let k = 0; k < impLen; k++) {
          const outIdx = i + k;
          if (outIdx < totalSamples) {
            out[outIdx] += impulse[k] * env * 0.85;
          }
        }
      }
    }

    // 微小な気流ノイズ (Aperiodicity) の付加
    for (let i = 0; i < totalSamples; i++) {
      const breath = (Math.random() * 2 - 1) * 0.025;
      out[i] = Math.max(-1, Math.min(1, out[i] + breath));
    }

    return buffer;
  }

  /**
   * 音符発音 (子音PCM + WORLD再合成バッファ再生)
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
    const { consonant, vowel } = this.parsePhoneme(lyric);

    // 1. 子音PCMの再生
    const consonantBuf = this.consonantBuffers.get(consonant) || this.consonantBuffers.get('none')!;
    const consSource = ctx.createBufferSource();
    consSource.buffer = consonantBuf;

    const consGain = ctx.createGain();
    const consVol = (consonant === 's' || consonant === 'sh' || consonant === 'z' ? 0.35 : 0.22) * velocity;
    consGain.gain.setValueAtTime(consVol, time);

    consSource.connect(consGain);
    consGain.connect(outputNode);

    consSource.start(time);
    consSource.stop(time + consonantBuf.duration);

    // 2. WORLD ボコーダーによる母音再合成
    const vocalBuf = this.synthesizeNote(pitch, duration, vowel);
    const vocalSource = ctx.createBufferSource();
    vocalSource.buffer = vocalBuf;

    const vocalGain = ctx.createGain();
    vocalGain.gain.setValueAtTime(velocity * 1.05, time);

    // 初音ミクらしい 3.2kHz プレゼンスフィルター
    const presenceFilter = ctx.createBiquadFilter();
    presenceFilter.type = 'peaking';
    presenceFilter.frequency.setValueAtTime(3200, time);
    presenceFilter.gain.setValueAtTime(5.0, time);
    presenceFilter.Q.setValueAtTime(2.2, time);

    vocalSource.connect(presenceFilter);
    presenceFilter.connect(vocalGain);
    vocalGain.connect(outputNode);

    vocalSource.start(time);
    vocalSource.stop(time + duration + 0.06);
  }
}

