/**
 * VocalSynth - ボカロ（初音ミク風）フォルマント歌声シンセサイザー
 * 
 * 特徴:
 * 1. 日本語歌詞（ひらがな/カタカナ）から母音（あ・い・う・え・お）を自動解析
 * 2. 母音ごとの3連フォルマントフィルタ（F1/F2/F3）による明瞭な発音
 * 3. 初音ミク特有のハイトーンの抜け（3.2kHz シンガーズフォルマント＆倍音ブレンド）
 * 4. ボカロらしい立ち上がりのしゃくり（Pitch Scoop）と、5.8Hzの電子ビブラート
 * 5. パルス波＋ノコギリ波＋三角波の合成によるキュートで抜けの良い電子歌姫トーン
 */

export type Vowel = 'a' | 'i' | 'u' | 'e' | 'o';

interface FormantParams {
  f1: number;
  q1: number;
  f2: number;
  q2: number;
  f3: number;
  q3: number;
}

// 初音ミク（女性高音・アニメ声・ボカロ）をモデルにしたフォルマント周波数設定
const MIKU_FORMANTS: Record<Vowel, FormantParams> = {
  a: { f1: 850, q1: 4.0, f2: 1550, q2: 4.5, f3: 2950, q3: 3.5 }, // 「あ」: 明るく開放的な広がり
  i: { f1: 320, q1: 4.5, f2: 2650, q2: 5.5, f3: 3300, q3: 4.0 }, // 「い」: 高域が強く尖った抜け
  u: { f1: 380, q1: 4.5, f2: 1350, q2: 5.0, f3: 2600, q3: 4.0 }, // 「う」: こもったタイトなトーン
  e: { f1: 540, q1: 4.2, f2: 2150, q2: 5.0, f3: 3050, q3: 4.0 }, // 「え」: 明るい前歯音
  o: { f1: 480, q1: 4.0, f2: 1050, q2: 4.8, f3: 2700, q3: 3.8 }  // 「お」: 丸みのある中低域
};

export class VocalSynth {
  private ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  /**
   * 歌詞テキストから母音 (a, i, u, e, o) を検出
   */
  public detectVowel(lyric?: string): Vowel {
    if (!lyric || lyric.trim().length === 0) return 'a';
    const firstChar = lyric.trim()[0];

    // あ行 / カタカナ / アルファベット
    if (/[あかがさざただなはばぱまやらわアカガサザタダナハバパマヤラワaA]/.test(firstChar)) return 'a';
    if (/[いきぎしじちぢにひびぴみりイキギシジチヂニヒビピミリiIyY]/.test(firstChar)) return 'i';
    if (/[うくぐすずつづぬふぶぷむゆるウクグスズツヅヌフブプムユルuUwW]/.test(firstChar)) return 'u';
    if (/[えけげせぜてでねへべぺめれエケゲセゼテデネヘベペメレeE]/.test(firstChar)) return 'e';
    if (/[おこごそぞとどのほぼぽもよろをオコゴソゾトドノホボポモヨロヲoO]/.test(firstChar)) return 'o';

    return 'a';
  }

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
    const vowel = this.detectVowel(lyric);
    const formants = MIKU_FORMANTS[vowel];

    // 1. ビブラート用LFO (初音ミク特有の約5.8Hz電子ビブラート)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(5.8, time);

    // ノート開始直後は安定させ、0.16秒後から自然に揺れを深める
    lfoGain.gain.setValueAtTime(0, time);
    lfoGain.gain.setValueAtTime(0, time + 0.16);
    lfoGain.gain.linearRampToValueAtTime(targetFreq * 0.022, time + Math.min(duration, 0.55));

    // 2. 音源オシレーター群（ボカロ声のキラキラした質感をハイブリッド合成）
    // (A) メイン倍音 (Sawtooth)
    const oscSaw = ctx.createOscillator();
    oscSaw.type = 'sawtooth';

    // (B) ボカロ特有のパルス成分 (Square) - アニメ声・ロボ声のキラキラ感
    const oscPulse = ctx.createOscillator();
    oscPulse.type = 'square';

    // (C) 声の芯・温かみ (Triangle)
    const oscTri = ctx.createOscillator();
    oscTri.type = 'triangle';

    // ボカロ特有の「ピッチしゃくり (Attack Scoop)」: 開始45msで-0.8半音から立ち上がる
    const scoopStartFreq = targetFreq * Math.pow(2, -0.8 / 12);
    const attackTime = Math.min(0.045, duration * 0.3);

    [oscSaw, oscPulse, oscTri].forEach((osc) => {
      osc.frequency.setValueAtTime(scoopStartFreq, time);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, time + attackTime);
      lfoGain.connect(osc.frequency);
    });

    lfo.connect(lfoGain);

    // オシレータのミックス比率 (Saw 55%, Pulse 25%, Triangle 20%)
    const sawGain = ctx.createGain();
    sawGain.gain.setValueAtTime(0.55, time);
    const pulseGain = ctx.createGain();
    pulseGain.gain.setValueAtTime(0.25, time);
    const triGain = ctx.createGain();
    triGain.gain.setValueAtTime(0.20, time);

    oscSaw.connect(sawGain);
    oscPulse.connect(pulseGain);
    oscTri.connect(triGain);

    const oscMix = ctx.createGain();
    sawGain.connect(oscMix);
    pulseGain.connect(oscMix);
    triGain.connect(oscMix);

    // 3. 母音フォルマントフィルター (F1, F2, F3 並列共鳴)
    const f1Filter = ctx.createBiquadFilter();
    f1Filter.type = 'bandpass';
    f1Filter.frequency.setValueAtTime(formants.f1, time);
    f1Filter.Q.setValueAtTime(formants.q1, time);

    const f2Filter = ctx.createBiquadFilter();
    f2Filter.type = 'bandpass';
    f2Filter.frequency.setValueAtTime(formants.f2, time);
    f2Filter.Q.setValueAtTime(formants.q2, time);

    const f3Filter = ctx.createBiquadFilter();
    f3Filter.type = 'bandpass';
    f3Filter.frequency.setValueAtTime(formants.f3, time);
    f3Filter.Q.setValueAtTime(formants.q3, time);

    // フォルマントゲイン調整 (F1はふくよかさ、F2/F3はクリアさ)
    const f1Gain = ctx.createGain();
    f1Gain.gain.setValueAtTime(1.1, time);
    const f2Gain = ctx.createGain();
    f2Gain.gain.setValueAtTime(0.9, time);
    const f3Gain = ctx.createGain();
    f3Gain.gain.setValueAtTime(0.65, time);

    oscMix.connect(f1Filter);
    oscMix.connect(f2Filter);
    oscMix.connect(f3Filter);

    f1Filter.connect(f1Gain);
    f2Filter.connect(f2Gain);
    f3Filter.connect(f3Gain);

    const formantSum = ctx.createGain();
    f1Gain.connect(formantSum);
    f2Gain.connect(formantSum);
    f3Gain.connect(formantSum);

    // 4. 初音ミク特有のシンガーズフォルマント（約3.2kHzをブーストしてバンドで抜けるキラキラ感）
    const presenceFilter = ctx.createBiquadFilter();
    presenceFilter.type = 'peaking';
    presenceFilter.frequency.setValueAtTime(3200, time);
    presenceFilter.Q.setValueAtTime(2.5, time);
    presenceFilter.gain.setValueAtTime(5.5, time); // +5.5dB

    formantSum.connect(presenceFilter);

    // 5. アタック子音クリック（微細なアタックノイズで「子音」の歯切れを出す）
    const attackGain = ctx.createGain();
    attackGain.gain.setValueAtTime(0.12 * velocity, time);
    attackGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.018);
    oscMix.connect(attackGain);
    attackGain.connect(presenceFilter);

    // 6. 音量エンベロープ (ADSR)
    const mainEnv = ctx.createGain();
    mainEnv.gain.setValueAtTime(0.0001, time);
    // ボカロ特有の俊敏で明るいアタック (15ms)
    mainEnv.gain.linearRampToValueAtTime(velocity * 0.95, time + 0.015);
    // サステイン
    mainEnv.gain.setValueAtTime(velocity * 0.90, time + Math.max(0.03, duration - 0.05));
    // リリース (歯切れよく自然に切れる)
    mainEnv.gain.exponentialRampToValueAtTime(0.0001, time + duration + 0.04);

    presenceFilter.connect(mainEnv);
    mainEnv.connect(outputNode);

    // 発音スタート
    lfo.start(time);
    oscSaw.start(time);
    oscPulse.start(time);
    oscTri.start(time);

    const stopTime = time + duration + 0.06;
    lfo.stop(stopTime);
    oscSaw.stop(stopTime);
    oscPulse.stop(stopTime);
    oscTri.stop(stopTime);
  }
}
