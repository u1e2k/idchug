export interface ProjectMeta {
  title: string;
  bpm: number;
  key: string;
  timeSignature: [number, number];
}

export interface MasterChord {
  bar: number; // 1始まり
  chord: string; // 例: "Am", "F", "C", "G"
}

export type TrackType = 'vocal' | 'lead_gt' | 'rhythm_gt' | 'bass' | 'drums' | 'keys';

export interface NoteItem {
  id: string;
  bar: number;
  offsetBeats: number; // 小節内の開始拍 (0.0〜3.75)
  durationBeats: number; // 長さ
  pitch: number; // MIDIノート番号 (60 = C4)
  velocity: number; // 0〜127
  lyric?: string; // ボーカル用（ひらがな）
}

export type DrumInstrument = 'kick' | 'snare' | 'hihat_c' | 'hihat_o' | 'crash' | 'tom_h' | 'tom_l';

export interface DrumStep {
  instrument: DrumInstrument;
  step: number; // 0〜15 (16分音符)
  velocity: number; // 0〜127
}

export interface DrumBlock {
  id: string;
  bar: number;
  lengthBars: number;
  presetName?: string; // 未編集の場合のみ
  steps: DrumStep[];
}

export type RhythmGtStyle = 'power_chug_8th' | 'open_strum_8th' | 'clean_arpeggio';

export interface TrackData {
  id: string;
  type: TrackType;
  name: string;
  volume: number; // 0.0〜1.0
  pan: number; // -1.0〜1.0
  isMuted: boolean;
  isSolo: boolean;
  notes?: NoteItem[];
  drumBlocks?: DrumBlock[];
  rhythmStyle?: RhythmGtStyle;
}

export interface IdChugProject {
  version: '1.0.0';
  meta: ProjectMeta;
  chords: MasterChord[];
  tracks: TrackData[];
}

