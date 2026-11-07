import { TrackType, DrumInstrument } from './project';

export interface ScheduledNoteEvent {
  time: number; // AudioContext.currentTime基準の絶対時刻 (秒)
  duration: number; // 秒
  pitch: number; // MIDIノート番号
  velocity: number; // 0〜1
  trackId: string;
  trackType: TrackType;
  isMuted?: boolean; // ギターのブリッジミュートなど
  lyric?: string;
}

export interface ScheduledDrumEvent {
  time: number; // 秒
  instrument: DrumInstrument;
  velocity: number; // 0〜1
  trackId: string;
}

export type PlaybackState = 'stopped' | 'playing' | 'paused';

export interface PlayheadPosition {
  currentBar: number; // 1始まり
  currentBeat: number; // 0〜3.99
  totalBeats: number;
  timeSeconds: number;
}

