import { IdChugProject, TrackData, NoteItem, MasterChord, DrumBlock } from '../types/project';
import { audioEngine, AudioEngine } from './AudioEngine';
import { parseChord, ParsedChordInfo } from '../utils/chordTheory';

export type SchedulerStateCallback = (bar: number, beat: number, step16: number, isPlaying: boolean) => void;

/**
 * Lookahead方式の先行スケジューラ
 * 25ms周期でAudioContext.currentTimeより0.1秒先までのイベントを先行投入
 */
export class LookaheadScheduler {
  private engine: AudioEngine;
  private timerId: number | null = null;
  private animFrameId: number | null = null;

  // 再生設定
  private isRunning: boolean = false;
  private isMetronomeEnabled: boolean = false;
  private bpm: number = 140;
  private totalBars: number = 8;
  private currentTotal16thStep: number = 0; // 通算16分音符インデックス
  private nextStepTime: number = 0; // 次の16分音符が鳴るAudioContext時刻

  // Lookahead パラメータ
  private readonly lookaheadMs: number = 25;
  private readonly scheduleAheadTime: number = 0.12; // 0.12秒先までスケジュール

  // 再生中プロジェクト参照
  private project: IdChugProject | null = null;
  private chordCache: Map<string, ParsedChordInfo> = new Map();

  // UI コールバック
  private onStateChange: SchedulerStateCallback | null = null;

  constructor(engine: AudioEngine) {
    this.engine = engine;
  }

  public setProject(project: IdChugProject) {
    this.project = project;
    this.bpm = project.meta.bpm;
    // コード情報の事前パース
    this.chordCache.clear();
    project.chords.forEach((mc) => {
      if (!this.chordCache.has(mc.chord)) {
        this.chordCache.set(mc.chord, parseChord(mc.chord));
      }
    });

    // 最大小節数の計算
    let maxBar = 4;
    project.chords.forEach((c) => (maxBar = Math.max(maxBar, c.bar)));
    project.tracks.forEach((t) => {
      t.notes?.forEach((n) => (maxBar = Math.max(maxBar, n.bar)));
      t.drumBlocks?.forEach((b) => (maxBar = Math.max(maxBar, b.bar + b.lengthBars - 1)));
    });
    this.totalBars = Math.max(maxBar, 4);
  }

  public setOnStateChange(cb: SchedulerStateCallback) {
    this.onStateChange = cb;
  }

  public setBpm(newBpm: number) {
    this.bpm = Math.max(30, Math.min(300, newBpm));
  }

  public setMetronome(enabled: boolean) {
    this.isMetronomeEnabled = enabled;
  }

  public async start(startBar: number = 1) {
    const ctx = await this.engine.init();
    if (this.isRunning) return;

    this.isRunning = true;
    const startStep = (startBar - 1) * 16;
    this.currentTotal16thStep = startStep;
    this.nextStepTime = ctx.currentTime + 0.05; // わずかなオフセットで開始

    this.timerId = window.setInterval(() => {
      this.schedulerTick();
    }, this.lookaheadMs);

    this.startUiUpdateLoop();
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.currentTotal16thStep = 0;
    this.notifyUi(1, 0, 0);
  }

  public pause() {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    const currentBar = Math.floor(this.currentTotal16thStep / 16) + 1;
    const stepInBar = this.currentTotal16thStep % 16;
    const beat = stepInBar / 4;
    this.notifyUi(currentBar, beat, stepInBar);
  }

  public seek(bar: number) {
    this.currentTotal16thStep = (bar - 1) * 16;
    const ctx = this.engine.getContext();
    if (ctx) {
      this.nextStepTime = ctx.currentTime + 0.02;
    }
    const stepInBar = this.currentTotal16thStep % 16;
    this.notifyUi(bar, stepInBar / 4, stepInBar);
  }

  public get playing(): boolean {
    return this.isRunning;
  }

  /**
   * Lookahead スケジューラループ
   */
  private schedulerTick() {
    const ctx = this.engine.getContext();
    if (!ctx || !this.project) return;

    const secondsPer16th = 60 / this.bpm / 4;

    // 現在時刻 + scheduleAheadTime まで先行投入
    while (this.nextStepTime < ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentTotal16thStep, this.nextStepTime, secondsPer16th);

      this.nextStepTime += secondsPer16th;
      this.currentTotal16thStep++;

      // ループ終端処理 (totalBars 小節でループ)
      const maxSteps = this.totalBars * 16;
      if (this.currentTotal16thStep >= maxSteps) {
        this.currentTotal16thStep = 0;
      }
    }
  }

  /**
   * 1つの16分音符ステップにおける全トラックの発音処理
   */
  private scheduleStep(totalStep: number, time: number, secondsPer16th: number) {
    if (!this.project) return;

    const bar = Math.floor(totalStep / 16) + 1; // 1始まり
    const stepInBar = totalStep % 16; // 0〜15
    const beatInBar = stepInBar / 4; // 0.0〜3.75

    // 現在のコードを取得
    const chordObj = this.project.chords.find((c) => c.bar === bar);
    const chordName = chordObj ? chordObj.chord : 'C';
    let chordInfo = this.chordCache.get(chordName);
    if (!chordInfo) {
      chordInfo = parseChord(chordName);
      this.chordCache.set(chordName, chordInfo);
    }

    // メトロノームクリック音 (4分音符ごと: step 0, 4, 8, 12)
    if (this.isMetronomeEnabled && stepInBar % 4 === 0) {
      this.engine.playClick(time, stepInBar === 0);
    }

    const anySolo = this.project.tracks.some((t) => t.isSolo);

    for (const track of this.project.tracks) {
      // ソロ/ミュート判定
      if (track.isMuted) continue;
      if (anySolo && !track.isSolo) continue;

      const channel = this.engine.getOrCreateChannel(track.id, track.type);
      const outputNode = channel.gainNode;

      switch (track.type) {
        case 'drums':
          this.scheduleDrums(track, bar, stepInBar, time, outputNode);
          break;

        case 'rhythm_gt':
          this.scheduleRhythmGuitar(track, chordInfo, stepInBar, time, secondsPer16th, outputNode);
          break;

        case 'bass':
          this.scheduleBass(track, chordInfo, stepInBar, time, secondsPer16th, outputNode);
          break;

        case 'lead_gt':
          this.scheduleLeadGuitar(track, bar, beatInBar, time, secondsPer16th, outputNode);
          break;

        case 'vocal':
          this.scheduleVocal(track, bar, beatInBar, time, secondsPer16th, outputNode);
          break;

        case 'keys':
          this.scheduleKeys(track, chordInfo, bar, beatInBar, stepInBar, time, secondsPer16th, outputNode);
          break;
      }
    }
  }

  /**
   * ドラムの発音
   */
  private scheduleDrums(track: TrackData, bar: number, stepInBar: number, time: number, outputNode: AudioNode) {
    if (!track.drumBlocks) return;
    // 現在の小節に合致するドラムブロックを探索
    const block = track.drumBlocks.find((b) => bar >= b.bar && bar < b.bar + b.lengthBars);
    if (!block) return;

    for (const step of block.steps) {
      if (step.step === stepInBar) {
        this.engine.drumSampler.trigger(step.instrument, time, step.velocity / 127, outputNode);
      }
    }
  }

  /**
   * リズムギターの発音 (パワーコード + P.M. ブリッジミュート)
   */
  private scheduleRhythmGuitar(
    track: TrackData,
    chordInfo: ParsedChordInfo,
    stepInBar: number,
    time: number,
    secondsPer16th: number,
    outputNode: AudioNode
  ) {
    const style = track.rhythmStyle || 'power_chug_8th';

    if (style === 'power_chug_8th') {
      // 8分音符ごとのトリガー (step 0, 2, 4, 6, 8, 10, 12, 14)
      if (stepInBar % 2 === 0) {
        // パターン: 1拍目・3拍目の頭(step 0, 8)はオープン(Open)で重低音を響かせ、他はタイトなP.M.(Chug)
        const isOpen = stepInBar === 0 || stepInBar === 8;
        const duration = isOpen ? secondsPer16th * 3.8 : secondsPer16th * 1.8;
        const velocity = isOpen ? 0.95 : 0.85;

        this.engine.guitarSynth.playNotes(
          chordInfo.powerChordMidis,
          time,
          duration,
          velocity,
          !isOpen, // isMuted
          outputNode
        );
      }
    } else if (style === 'open_strum_8th') {
      if (stepInBar % 2 === 0) {
        const duration = secondsPer16th * 2.2;
        const velocity = stepInBar === 0 || stepInBar === 8 ? 0.9 : 0.75;
        this.engine.guitarSynth.playNotes(chordInfo.fullChordMidis, time, duration, velocity, false, outputNode);
      }
    } else if (style === 'clean_arpeggio') {
      // 16分音符でアルペジオ
      const noteIdx = stepInBar % chordInfo.fullChordMidis.length;
      const pitch = chordInfo.fullChordMidis[noteIdx];
      this.engine.guitarSynth.playNotes([pitch], time, secondsPer16th * 3.0, 0.7, false, outputNode);
    }
  }

  /**
   * ベースの発音 (ルート音8分刻み)
   */
  private scheduleBass(
    _track: TrackData,
    chordInfo: ParsedChordInfo,
    stepInBar: number,
    time: number,
    secondsPer16th: number,
    outputNode: AudioNode
  ) {
    // 8分音符でタイトに刻む (step 0, 2, 4, 6, 8, 10, 12, 14)
    if (stepInBar % 2 === 0) {
      let pitch = chordInfo.bassMidi;
      // 4拍目の裏 (step 14) でオクターブ上や5度を交えてグルーヴを出す
      if (stepInBar === 14) {
        pitch += 7; // 5th音で次小節へリード
      }

      const duration = secondsPer16th * 1.7; // 8分音符より少しスタッカート気味にタイト
      const vel = stepInBar === 0 || stepInBar === 8 ? 0.95 : 0.8;

      this.engine.bassSynth.playNote(pitch, time, duration, vel, outputNode);
    }
  }

  /**
   * リードギターの発音
   */
  private scheduleLeadGuitar(
    track: TrackData,
    bar: number,
    beatInBar: number,
    time: number,
    secondsPer16th: number,
    outputNode: AudioNode
  ) {
    if (!track.notes) return;
    for (const note of track.notes) {
      if (note.bar === bar && Math.abs(note.offsetBeats - beatInBar) < 0.05) {
        const durationSeconds = note.durationBeats * 4 * secondsPer16th;
        this.engine.guitarSynth.playNotes([note.pitch], time, durationSeconds, note.velocity / 127, false, outputNode);
      }
    }
  }

  /**
   * ボーカルの発音 (WORLD ボコーダー音声分析合成エンジン)
   */
  private scheduleVocal(
    track: TrackData,
    bar: number,
    beatInBar: number,
    time: number,
    secondsPer16th: number,
    outputNode: AudioNode
  ) {
    if (!track.notes) return;

    for (const note of track.notes) {
      if (note.bar === bar && Math.abs(note.offsetBeats - beatInBar) < 0.05) {
        const durationSeconds = note.durationBeats * 4 * secondsPer16th;
        this.engine.worldVocoder.playNote(
          note.pitch,
          time,
          durationSeconds,
          note.velocity / 127,
          outputNode,
          note.lyric
        );
      }
    }
  }

  /**
   * キーボードの発音
   */
  private scheduleKeys(
    track: TrackData,
    chordInfo: ParsedChordInfo,
    bar: number,
    beatInBar: number,
    stepInBar: number,
    time: number,
    secondsPer16th: number,
    outputNode: AudioNode
  ) {
    if (track.notes && track.notes.length > 0) {
      // 個別ノートが配置されていればそちらを演奏
      for (const note of track.notes) {
        if (note.bar === bar && Math.abs(note.offsetBeats - beatInBar) < 0.05) {
          const durationSeconds = note.durationBeats * 4 * secondsPer16th;
          this.engine.keysSynth.playNotes([note.pitch], time, durationSeconds, note.velocity / 127, outputNode);
        }
      }
    } else {
      // 個別ノートがない場合、コードトラックの美しいパッド/エレピバッキング (2分音符ごと)
      if (stepInBar === 0 || stepInBar === 8) {
        const duration = secondsPer16th * 7.5;
        this.engine.keysSynth.playNotes(chordInfo.fullChordMidis, time, duration, 0.65, outputNode);
      }
    }
  }

  /**
   * UI更新用requestAnimationFrameループ
   */
  private startUiUpdateLoop() {
    const update = () => {
      if (!this.isRunning) return;

      const currentBar = Math.floor(this.currentTotal16thStep / 16) + 1;
      const stepInBar = this.currentTotal16thStep % 16;
      const beat = stepInBar / 4;

      this.notifyUi(currentBar, beat, stepInBar);
      this.animFrameId = requestAnimationFrame(update);
    };
    this.animFrameId = requestAnimationFrame(update);
  }

  private notifyUi(bar: number, beat: number, step16: number) {
    if (this.onStateChange) {
      this.onStateChange(bar, beat, step16, this.isRunning);
    }
  }
}

export const scheduler = new LookaheadScheduler(audioEngine);

