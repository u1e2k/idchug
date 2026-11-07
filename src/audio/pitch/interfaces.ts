import { NoteItem } from '../../types/project';

export interface PitchFrame {
  timeSeconds: number;
  pitchHz: number | null; // null if unvoiced / silence
  midiNote: number | null;
  clarity: number; // 0.0〜1.0 (相関係数)
  rms: number; // 音量
}

/**
 * 鼻歌等のオーディオ入力からNoteItem列へ変換するプラガブル・インターフェース
 * クライアント側自己相関 (Autocorrelation) 実装や、将来的なサーバー側 AI モデル (Spotify basic-pitch, TorchCrepe等) を透過的に切り替え可能
 */
export interface AudioToMidiService {
  name: string;
  transcribe(audioBlob: Blob, bpm: number): Promise<NoteItem[]>;
}

