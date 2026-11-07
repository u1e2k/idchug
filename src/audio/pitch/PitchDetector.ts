import { NoteItem } from '../../types/project';
import { AudioToMidiService, PitchFrame } from './interfaces';

/**
 * 自己相関（Autocorrelation法）を用いたピッチ検出器 & Audio-to-MIDIサービス
 */
export class AutocorrelationPitchDetector implements AudioToMidiService {
  public name = 'Autocorrelation (Browser Native)';
  private audioCtx: AudioContext;

  constructor(audioCtx?: AudioContext) {
    this.audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  /**
   * 単一バッファに対する自己相関ピッチ検出
   * @param buffer タイムドメインサンプル配列 (Float32Array)
   * @param sampleRate サンプリングレート
   * @returns { pitchHz, clarity, rms }
   */
  public static detectPitch(
    buffer: Float32Array,
    sampleRate: number
  ): { pitchHz: number | null; clarity: number; rms: number } {
    const size = buffer.length;

    // 1. RMS (音量) 計算
    let sumSquares = 0;
    for (let i = 0; i < size; i++) {
      sumSquares += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sumSquares / size);

    // 無音判定（閾値 0.015）
    if (rms < 0.015) {
      return { pitchHz: null, clarity: 0, rms };
    }

    // 2. 探索範囲の決定 (80Hz 〜 1000Hz)
    const minPeriod = Math.floor(sampleRate / 1000); // ~44 samples @ 44.1kHz
    const maxPeriod = Math.floor(sampleRate / 80);   // ~550 samples @ 44.1kHz

    if (maxPeriod >= size) {
      return { pitchHz: null, clarity: 0, rms };
    }

    // 3. 正規化自己相関 (Normalized Square Difference)
    let bestOffset = -1;
    let maxCorrelation = -1;

    for (let offset = minPeriod; offset <= maxPeriod; offset++) {
      let correlation = 0;
      let norm1 = 0;
      let norm2 = 0;

      for (let i = 0; i < size - offset; i++) {
        const s1 = buffer[i];
        const s2 = buffer[i + offset];
        correlation += s1 * s2;
        norm1 += s1 * s1;
        norm2 += s2 * s2;
      }

      const denom = Math.sqrt(norm1 * norm2);
      if (denom > 0) {
        const normalized = correlation / denom;
        if (normalized > maxCorrelation) {
          maxCorrelation = normalized;
          bestOffset = offset;
        }
      }
    }

    // 明確さの閾値（0.65以上を有声とみなす）
    if (maxCorrelation < 0.65 || bestOffset === -1) {
      return { pitchHz: null, clarity: maxCorrelation, rms };
    }

    // 4. 放物線補間（Parabolic Interpolation）によるサブサンプル精度
    let refinedOffset = bestOffset;
    if (bestOffset > minPeriod && bestOffset < maxPeriod) {
      // 周辺3点の相関を再計算
      const getCorr = (off: number) => {
        let c = 0, n1 = 0, n2 = 0;
        for (let i = 0; i < size - off; i++) {
          c += buffer[i] * buffer[i + off];
          n1 += buffer[i] * buffer[i + off];
          n2 += buffer[i + off] * buffer[i + off];
        }
        return c / (Math.sqrt(n1 * n2) || 1);
      };
      const alpha = getCorr(bestOffset - 1);
      const beta = maxCorrelation;
      const gamma = getCorr(bestOffset + 1);

      const delta = (gamma - alpha) / (2 * (2 * beta - alpha - gamma) || 1);
      refinedOffset = bestOffset + delta;
    }

    const pitchHz = sampleRate / refinedOffset;
    return { pitchHz, clarity: maxCorrelation, rms };
  }

  /**
   * 周波数(Hz)をMIDIノート番号（小数）に変換
   */
  public static hzToMidi(hz: number): number {
    return 69 + 12 * Math.log2(hz / 440);
  }

  /**
   * 録音されたオーディオBlobからMIDI NoteItem列への変換
   */
  public async transcribe(audioBlob: Blob, bpm: number): Promise<NoteItem[]> {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);

    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    // 25msのウィンドウ、12.5msのホップ
    const windowSize = Math.floor(sampleRate * 0.035);
    const hopSize = Math.floor(sampleRate * 0.015);
    const totalHops = Math.floor((channelData.length - windowSize) / hopSize);

    const frames: PitchFrame[] = [];

    for (let i = 0; i < totalHops; i++) {
      const startSample = i * hopSize;
      const window = channelData.subarray(startSample, startSample + windowSize);
      const timeSeconds = startSample / sampleRate;

      const { pitchHz, clarity, rms } = AutocorrelationPitchDetector.detectPitch(window, sampleRate);
      const midiNote = pitchHz ? Math.round(AutocorrelationPitchDetector.hzToMidi(pitchHz)) : null;

      frames.push({
        timeSeconds,
        pitchHz,
        midiNote,
        clarity,
        rms
      });
    }

    // フレームからノートセグメントへ変換
    return this.segmentFramesToNotes(frames, bpm);
  }

  /**
   * 連続するピッチフレームをグループ化してノート化 & クオンタイズ
   */
  private segmentFramesToNotes(frames: PitchFrame[], bpm: number): NoteItem[] {
    const notes: NoteItem[] = [];
    const secondsPerBeat = 60 / bpm;

    let currentMidi: number | null = null;
    let noteStartTime = 0;
    let noteFramesCount = 0;
    let accumulatedVelocity = 0;

    const commitNote = (endTime: number) => {
      if (currentMidi !== null && noteFramesCount >= 3) {
        const rawDuration = endTime - noteStartTime;
        // 最低発話時間 (0.08秒)
        if (rawDuration >= 0.08) {
          // 拍単位に変換
          const startBeatTotal = noteStartTime / secondsPerBeat;
          const durationBeatsRaw = rawDuration / secondsPerBeat;

          // 16分音符グリッド (0.25拍単位) にクオンタイズ
          const quantizedStartBeat = Math.round(startBeatTotal * 4) / 4;
          const quantizedDuration = Math.max(0.25, Math.round(durationBeatsRaw * 4) / 4);

          // 小節(1始まり)と小節内拍(0.0〜3.75)に分解 (4/4拍子想定)
          const bar = Math.floor(quantizedStartBeat / 4) + 1;
          const offsetBeats = quantizedStartBeat % 4;

          const avgRms = accumulatedVelocity / noteFramesCount;
          const velocity = Math.min(127, Math.max(40, Math.round(avgRms * 350 + 60)));

          notes.push({
            id: `hum_${Date.now()}_${notes.length}_${Math.random().toString(36).substr(2, 4)}`,
            bar,
            offsetBeats,
            durationBeats: quantizedDuration,
            pitch: currentMidi,
            velocity
          });
        }
      }
      currentMidi = null;
      noteFramesCount = 0;
      accumulatedVelocity = 0;
    };

    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];

      if (f.midiNote !== null) {
        // 同一ピッチ（または半音以内の揺れをマージ）
        if (currentMidi === null) {
          currentMidi = f.midiNote;
          noteStartTime = f.timeSeconds;
          noteFramesCount = 1;
          accumulatedVelocity = f.rms;
        } else if (Math.abs(f.midiNote - currentMidi) <= 0.8) {
          noteFramesCount++;
          accumulatedVelocity += f.rms;
        } else {
          // ピッチが変わった場合、前の音を確定して新しい音を開始
          commitNote(f.timeSeconds);
          currentMidi = f.midiNote;
          noteStartTime = f.timeSeconds;
          noteFramesCount = 1;
          accumulatedVelocity = f.rms;
        }
      } else {
        // 無声区間
        if (currentMidi !== null) {
          commitNote(f.timeSeconds);
        }
      }
    }

    if (currentMidi !== null && frames.length > 0) {
      commitNote(frames[frames.length - 1].timeSeconds);
    }

    return notes;
  }
}

