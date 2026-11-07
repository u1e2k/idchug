import { IdChugProject } from '../types/project';
import { createBlockFromPreset } from './drumPresets';

export interface DemoProjectOption {
  id: string;
  name: string;
  bpm: number;
  description: string;
  project: IdChugProject;
}

export const DEMO_PROJECTS: DemoProjectOption[] = [
  {
    id: 'demo-emo-rock',
    name: '🎸 Modern Emo / Rock (148 BPM)',
    bpm: 148,
    description: '王道のAm-F-C-G進行。タイトなChugギターとドライブドラム',
    project: {
      version: '1.0.0',
      meta: {
        title: 'Modern Emo Rock',
        bpm: 148,
        key: 'Am',
        timeSignature: [4, 4]
      },
      chords: [
        { bar: 1, chord: 'Am' },
        { bar: 2, chord: 'F' },
        { bar: 3, chord: 'C' },
        { bar: 4, chord: 'G' },
        { bar: 5, chord: 'Am' },
        { bar: 6, chord: 'F' },
        { bar: 7, chord: 'C' },
        { bar: 8, chord: 'Em' }
      ],
      tracks: [
        {
          id: 'trk_vocal',
          type: 'vocal',
          name: 'Vocal (Vo)',
          volume: 0.9,
          pan: 0,
          isMuted: false,
          isSolo: false,
          notes: []
        },
        {
          id: 'trk_lead_gt',
          type: 'lead_gt',
          name: 'Lead Gt',
          volume: 0.85,
          pan: 0.25,
          isMuted: false,
          isSolo: false,
          notes: [
            { id: 'n1', bar: 1, offsetBeats: 0, durationBeats: 1.5, pitch: 69, velocity: 110 },
            { id: 'n2', bar: 1, offsetBeats: 2, durationBeats: 1.5, pitch: 72, velocity: 110 },
            { id: 'n3', bar: 2, offsetBeats: 0, durationBeats: 3.5, pitch: 71, velocity: 115 },
            { id: 'n4', bar: 3, offsetBeats: 0, durationBeats: 1.5, pitch: 67, velocity: 110 },
            { id: 'n5', bar: 3, offsetBeats: 2, durationBeats: 1.5, pitch: 69, velocity: 110 },
            { id: 'n6', bar: 4, offsetBeats: 0, durationBeats: 3.5, pitch: 67, velocity: 105 }
          ]
        },
        {
          id: 'trk_rhythm_gt',
          type: 'rhythm_gt',
          name: 'Rhythm Gt (Chug)',
          volume: 0.95,
          pan: -0.4,
          isMuted: false,
          isSolo: false,
          rhythmStyle: 'power_chug_8th'
        },
        {
          id: 'trk_bass',
          type: 'bass',
          name: 'Bass (Ba)',
          volume: 0.95,
          pan: 0,
          isMuted: false,
          isSolo: false
        },
        {
          id: 'trk_drums',
          type: 'drums',
          name: 'Drums (Dr)',
          volume: 0.9,
          pan: 0,
          isMuted: false,
          isSolo: false,
          drumBlocks: [
            createBlockFromPreset('8beat-basic', 1),
            createBlockFromPreset('8beat-drive', 2),
            createBlockFromPreset('8beat-drive', 3),
            createBlockFromPreset('fill-01', 4),
            createBlockFromPreset('8beat-drive', 5),
            createBlockFromPreset('8beat-drive', 6),
            createBlockFromPreset('8beat-drive', 7),
            createBlockFromPreset('fill-crash-break', 8)
          ]
        },
        {
          id: 'trk_keys',
          type: 'keys',
          name: 'Keys / Synth',
          volume: 0.7,
          pan: 0.4,
          isMuted: false,
          isSolo: false,
          notes: []
        }
      ]
    }
  },
  {
    id: 'demo-punk-fast',
    name: '🔥 Fast Melocore / Punk (185 BPM)',
    bpm: 185,
    description: 'BPM185の超高速2ビート！疾走するパンクロック・スケッチ',
    project: {
      version: '1.0.0',
      meta: {
        title: 'Fast Melodic Punk',
        bpm: 185,
        key: 'C',
        timeSignature: [4, 4]
      },
      chords: [
        { bar: 1, chord: 'C' },
        { bar: 2, chord: 'G' },
        { bar: 3, chord: 'Am' },
        { bar: 4, chord: 'F' },
        { bar: 5, chord: 'C' },
        { bar: 6, chord: 'G' },
        { bar: 7, chord: 'F' },
        { bar: 8, chord: 'G' }
      ],
      tracks: [
        { id: 'trk_vocal', type: 'vocal', name: 'Vocal (Vo)', volume: 0.9, pan: 0, isMuted: false, isSolo: false, notes: [] },
        { id: 'trk_lead_gt', type: 'lead_gt', name: 'Lead Gt', volume: 0.85, pan: 0.2, isMuted: false, isSolo: false, notes: [] },
        { id: 'trk_rhythm_gt', type: 'rhythm_gt', name: 'Rhythm Gt (Chug)', volume: 0.95, pan: -0.4, isMuted: false, isSolo: false, rhythmStyle: 'power_chug_8th' },
        { id: 'trk_bass', type: 'bass', name: 'Bass (Ba)', volume: 0.95, pan: 0, isMuted: false, isSolo: false },
        {
          id: 'trk_drums',
          type: 'drums',
          name: 'Drums (Dr)',
          volume: 0.92,
          pan: 0,
          isMuted: false,
          isSolo: false,
          drumBlocks: [
            createBlockFromPreset('punk-fast', 1),
            createBlockFromPreset('punk-fast', 2),
            createBlockFromPreset('punk-fast', 3),
            createBlockFromPreset('fill-01', 4),
            createBlockFromPreset('punk-fast', 5),
            createBlockFromPreset('punk-fast', 6),
            createBlockFromPreset('punk-fast', 7),
            createBlockFromPreset('fill-crash-break', 8)
          ]
        },
        { id: 'trk_keys', type: 'keys', name: 'Keys / Synth', volume: 0.65, pan: 0.4, isMuted: false, isSolo: false, notes: [] }
      ]
    }
  },
  {
    id: 'demo-heavy-grunge',
    name: '⚡ Heavy Grunge / Alternative (128 BPM)',
    bpm: 128,
    description: 'ドロップ感のあるヘヴィパワーコードとタイトな4つ打ちドライブ',
    project: {
      version: '1.0.0',
      meta: {
        title: 'Heavy Grunge Groove',
        bpm: 128,
        key: 'D',
        timeSignature: [4, 4]
      },
      chords: [
        { bar: 1, chord: 'D5' },
        { bar: 2, chord: 'F5' },
        { bar: 3, chord: 'G5' },
        { bar: 4, chord: 'Bb5' }
      ],
      tracks: [
        { id: 'trk_vocal', type: 'vocal', name: 'Vocal (Vo)', volume: 0.9, pan: 0, isMuted: false, isSolo: false, notes: [] },
        { id: 'trk_lead_gt', type: 'lead_gt', name: 'Lead Gt', volume: 0.85, pan: 0.25, isMuted: false, isSolo: false, notes: [] },
        { id: 'trk_rhythm_gt', type: 'rhythm_gt', name: 'Rhythm Gt (Chug)', volume: 0.95, pan: -0.4, isMuted: false, isSolo: false, rhythmStyle: 'power_chug_8th' },
        { id: 'trk_bass', type: 'bass', name: 'Bass (Ba)', volume: 0.95, pan: 0, isMuted: false, isSolo: false },
        {
          id: 'trk_drums',
          type: 'drums',
          name: 'Drums (Dr)',
          volume: 0.9,
          pan: 0,
          isMuted: false,
          isSolo: false,
          drumBlocks: [
            createBlockFromPreset('8beat-drive', 1),
            createBlockFromPreset('8beat-drive', 2),
            createBlockFromPreset('4-on-the-floor', 3),
            createBlockFromPreset('fill-01', 4)
          ]
        },
        { id: 'trk_keys', type: 'keys', name: 'Keys / Synth', volume: 0.6, pan: 0.4, isMuted: false, isSolo: false, notes: [] }
      ]
    }
  }
];

