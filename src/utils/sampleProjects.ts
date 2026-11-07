import { IdChugProject, NoteItem } from '../types/project';
import { createBlockFromPreset } from './drumPresets';

/**
 * サンプル曲1: 「Chug & Sparkle (アイドルChugデモ)」
 * 哀愁感のある王道Am進行に重低音Chugとキャッチーなサビメロディ
 */
const DEMO_1_NOTES_VOCAL: NoteItem[] = [
  // Bar 1 (Am): 「ずっと信じてた」
  { id: 'v1_1', bar: 1, offsetBeats: 0.0, durationBeats: 0.5, pitch: 69, velocity: 110, lyric: 'ずっ' }, // A4
  { id: 'v1_2', bar: 1, offsetBeats: 0.5, durationBeats: 0.5, pitch: 69, velocity: 105, lyric: 'と' }, // A4
  { id: 'v1_3', bar: 1, offsetBeats: 1.0, durationBeats: 1.0, pitch: 72, velocity: 115, lyric: 'しん' }, // C5
  { id: 'v1_4', bar: 1, offsetBeats: 2.0, durationBeats: 0.5, pitch: 71, velocity: 110, lyric: 'じ' }, // B4
  { id: 'v1_5', bar: 1, offsetBeats: 2.5, durationBeats: 1.5, pitch: 69, velocity: 115, lyric: 'てた' }, // A4

  // Bar 2 (F): 「未来へのパスポート」
  { id: 'v2_1', bar: 2, offsetBeats: 0.0, durationBeats: 0.5, pitch: 65, velocity: 105, lyric: 'み' }, // F4
  { id: 'v2_2', bar: 2, offsetBeats: 0.5, durationBeats: 0.5, pitch: 69, velocity: 110, lyric: 'らい' }, // A4
  { id: 'v2_3', bar: 2, offsetBeats: 1.0, durationBeats: 0.5, pitch: 72, velocity: 115, lyric: 'へ' }, // C5
  { id: 'v2_4', bar: 2, offsetBeats: 1.5, durationBeats: 0.5, pitch: 74, velocity: 115, lyric: 'の' }, // D5
  { id: 'v2_5', bar: 2, offsetBeats: 2.0, durationBeats: 1.0, pitch: 72, velocity: 120, lyric: 'パ' }, // C5
  { id: 'v2_6', bar: 2, offsetBeats: 3.0, durationBeats: 1.0, pitch: 69, velocity: 105, lyric: 'ス' }, // A4

  // Bar 3 (C): 「胸の鼓動は」
  { id: 'v3_1', bar: 3, offsetBeats: 0.0, durationBeats: 0.5, pitch: 67, velocity: 110, lyric: 'む' }, // G4
  { id: 'v3_2', bar: 3, offsetBeats: 0.5, durationBeats: 0.5, pitch: 72, velocity: 115, lyric: 'ね' }, // C5
  { id: 'v3_3', bar: 3, offsetBeats: 1.0, durationBeats: 0.5, pitch: 74, velocity: 115, lyric: 'の' }, // D5
  { id: 'v3_4', bar: 3, offsetBeats: 1.5, durationBeats: 1.0, pitch: 76, velocity: 120, lyric: 'こ' }, // E5
  { id: 'v3_5', bar: 3, offsetBeats: 2.5, durationBeats: 1.5, pitch: 72, velocity: 115, lyric: 'どう' }, // C5

  // Bar 4 (G): 「鳴り止まない」
  { id: 'v4_1', bar: 4, offsetBeats: 0.0, durationBeats: 0.5, pitch: 71, velocity: 110, lyric: 'な' }, // B4
  { id: 'v4_2', bar: 4, offsetBeats: 0.5, durationBeats: 0.5, pitch: 67, velocity: 105, lyric: 'り' }, // G4
  { id: 'v4_3', bar: 4, offsetBeats: 1.0, durationBeats: 1.0, pitch: 71, velocity: 115, lyric: 'やま' }, // B4
  { id: 'v4_4', bar: 4, offsetBeats: 2.0, durationBeats: 2.0, pitch: 69, velocity: 110, lyric: 'ない' }, // A4

  // Bar 5 (Am): 「キミと出会えた」
  { id: 'v5_1', bar: 5, offsetBeats: 0.0, durationBeats: 0.5, pitch: 69, velocity: 115, lyric: 'き' }, // A4
  { id: 'v5_2', bar: 5, offsetBeats: 0.5, durationBeats: 0.5, pitch: 72, velocity: 115, lyric: 'み' }, // C5
  { id: 'v5_3', bar: 5, offsetBeats: 1.0, durationBeats: 0.5, pitch: 74, velocity: 115, lyric: 'と' }, // D5
  { id: 'v5_4', bar: 5, offsetBeats: 1.5, durationBeats: 1.0, pitch: 76, velocity: 120, lyric: 'で' }, // E5
  { id: 'v5_5', bar: 5, offsetBeats: 2.5, durationBeats: 0.5, pitch: 74, velocity: 110, lyric: 'あ' }, // D5
  { id: 'v5_6', bar: 5, offsetBeats: 3.0, durationBeats: 1.0, pitch: 72, velocity: 115, lyric: 'え' }, // C5

  // Bar 6 (F): 「この場所から」
  { id: 'v6_1', bar: 6, offsetBeats: 0.0, durationBeats: 0.5, pitch: 77, velocity: 125, lyric: 'こ' }, // F5
  { id: 'v6_2', bar: 6, offsetBeats: 0.5, durationBeats: 0.5, pitch: 76, velocity: 120, lyric: 'の' }, // E5
  { id: 'v6_3', bar: 6, offsetBeats: 1.0, durationBeats: 0.5, pitch: 74, velocity: 115, lyric: 'ば' }, // D5
  { id: 'v6_4', bar: 6, offsetBeats: 1.5, durationBeats: 1.0, pitch: 72, velocity: 115, lyric: 'しょ' }, // C5
  { id: 'v6_5', bar: 6, offsetBeats: 2.5, durationBeats: 1.5, pitch: 74, velocity: 115, lyric: 'から' }, // D5

  // Bar 7 (C): 「光の彼方へ」
  { id: 'v7_1', bar: 7, offsetBeats: 0.0, durationBeats: 0.5, pitch: 72, velocity: 115, lyric: 'ひ' }, // C5
  { id: 'v7_2', bar: 7, offsetBeats: 0.5, durationBeats: 0.5, pitch: 74, velocity: 115, lyric: 'か' }, // D5
  { id: 'v7_3', bar: 7, offsetBeats: 1.0, durationBeats: 1.0, pitch: 76, velocity: 120, lyric: 'り' }, // E5
  { id: 'v7_4', bar: 7, offsetBeats: 2.0, durationBeats: 0.5, pitch: 79, velocity: 125, lyric: 'の' }, // G5
  { id: 'v7_5', bar: 7, offsetBeats: 2.5, durationBeats: 1.5, pitch: 76, velocity: 120, lyric: 'かな' }, // E5

  // Bar 8 (Em): 「走り出そう！」
  { id: 'v8_1', bar: 8, offsetBeats: 0.0, durationBeats: 0.5, pitch: 74, velocity: 120, lyric: 'は' }, // D5
  { id: 'v8_2', bar: 8, offsetBeats: 0.5, durationBeats: 0.5, pitch: 72, velocity: 115, lyric: 'し' }, // C5
  { id: 'v8_3', bar: 8, offsetBeats: 1.0, durationBeats: 1.0, pitch: 71, velocity: 115, lyric: 'り' }, // B4
  { id: 'v8_4', bar: 8, offsetBeats: 2.0, durationBeats: 2.0, pitch: 69, velocity: 125, lyric: 'だそう' } // A4
];

const DEMO_1_NOTES_LEAD: NoteItem[] = [
  // イントロ・裏メロディのギターリフ (エモーショナルなオブリガート)
  { id: 'l1_1', bar: 1, offsetBeats: 0.0, durationBeats: 1.0, pitch: 69, velocity: 110 }, // A4
  { id: 'l1_2', bar: 1, offsetBeats: 1.0, durationBeats: 1.0, pitch: 76, velocity: 115 }, // E5
  { id: 'l1_3', bar: 1, offsetBeats: 2.0, durationBeats: 0.5, pitch: 74, velocity: 105 }, // D5
  { id: 'l1_4', bar: 1, offsetBeats: 2.5, durationBeats: 1.5, pitch: 72, velocity: 110 }, // C5

  { id: 'l2_1', bar: 2, offsetBeats: 0.0, durationBeats: 1.0, pitch: 65, velocity: 110 }, // F4
  { id: 'l2_2', bar: 2, offsetBeats: 1.0, durationBeats: 1.0, pitch: 72, velocity: 115 }, // C5
  { id: 'l2_3', bar: 2, offsetBeats: 2.0, durationBeats: 0.5, pitch: 71, velocity: 105 }, // B4
  { id: 'l2_4', bar: 2, offsetBeats: 2.5, durationBeats: 1.5, pitch: 69, velocity: 110 }, // A4

  { id: 'l3_1', bar: 3, offsetBeats: 0.0, durationBeats: 1.0, pitch: 67, velocity: 110 }, // G4
  { id: 'l3_2', bar: 3, offsetBeats: 1.0, durationBeats: 1.0, pitch: 76, velocity: 115 }, // E5
  { id: 'l3_3', bar: 3, offsetBeats: 2.0, durationBeats: 0.5, pitch: 74, velocity: 110 }, // D5
  { id: 'l3_4', bar: 3, offsetBeats: 2.5, durationBeats: 1.5, pitch: 76, velocity: 115 }, // E5

  { id: 'l4_1', bar: 4, offsetBeats: 0.0, durationBeats: 1.0, pitch: 79, velocity: 120 }, // G5
  { id: 'l4_2', bar: 4, offsetBeats: 1.0, durationBeats: 1.0, pitch: 76, velocity: 115 }, // E5
  { id: 'l4_3', bar: 4, offsetBeats: 2.0, durationBeats: 2.0, pitch: 74, velocity: 110 }, // D5

  { id: 'l5_1', bar: 5, offsetBeats: 0.0, durationBeats: 1.0, pitch: 81, velocity: 125 }, // A5
  { id: 'l5_2', bar: 5, offsetBeats: 1.0, durationBeats: 1.0, pitch: 79, velocity: 120 }, // G5
  { id: 'l5_3', bar: 5, offsetBeats: 2.0, durationBeats: 2.0, pitch: 76, velocity: 115 }, // E5

  { id: 'l6_1', bar: 6, offsetBeats: 0.0, durationBeats: 0.5, pitch: 77, velocity: 120 }, // F5
  { id: 'l6_2', bar: 6, offsetBeats: 0.5, durationBeats: 0.5, pitch: 76, velocity: 115 }, // E5
  { id: 'l6_3', bar: 6, offsetBeats: 1.0, durationBeats: 1.0, pitch: 74, velocity: 115 }, // D5
  { id: 'l6_4', bar: 6, offsetBeats: 2.0, durationBeats: 2.0, pitch: 72, velocity: 110 }, // C5

  { id: 'l7_1', bar: 7, offsetBeats: 0.0, durationBeats: 0.5, pitch: 72, velocity: 115 }, // C5
  { id: 'l7_2', bar: 7, offsetBeats: 0.5, durationBeats: 0.5, pitch: 74, velocity: 115 }, // D5
  { id: 'l7_3', bar: 7, offsetBeats: 1.0, durationBeats: 1.0, pitch: 76, velocity: 120 }, // E5
  { id: 'l7_4', bar: 7, offsetBeats: 2.0, durationBeats: 2.0, pitch: 79, velocity: 125 }, // G5

  { id: 'l8_1', bar: 8, offsetBeats: 0.0, durationBeats: 1.0, pitch: 81, velocity: 125 }, // A5
  { id: 'l8_2', bar: 8, offsetBeats: 1.0, durationBeats: 1.0, pitch: 76, velocity: 120 }, // E5
  { id: 'l8_3', bar: 8, offsetBeats: 2.0, durationBeats: 2.0, pitch: 69, velocity: 115 }  // A4
];

export const DEMO_PROJECT_1: IdChugProject = {
  version: '1.0.0',
  meta: {
    title: 'Chug & Sparkle (アイドルChugデモ)',
    bpm: 152,
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
      name: 'Vocal (Miku Synth)',
      volume: 0.9,
      pan: 0,
      isMuted: false,
      isSolo: false,
      notes: DEMO_1_NOTES_VOCAL
    },
    {
      id: 'trk_lead_gt',
      type: 'lead_gt',
      name: 'Lead Gt',
      volume: 0.85,
      pan: 0.25,
      isMuted: false,
      isSolo: false,
      notes: DEMO_1_NOTES_LEAD
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
        createBlockFromPreset('8beat-drive', 1),
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
};

/**
 * サンプル曲2: 「Sunset Drive (爽快王道アイドルロック)」
 * F - G - Em - Am 王道進行、疾走するギターとキャッチーなサビ
 */
const DEMO_2_NOTES_VOCAL: NoteItem[] = [
  // Bar 1 (F)
  { id: 'd2_v1', bar: 1, offsetBeats: 0.0, durationBeats: 1.0, pitch: 72, velocity: 115, lyric: 'き' },
  { id: 'd2_v2', bar: 1, offsetBeats: 1.0, durationBeats: 1.0, pitch: 74, velocity: 115, lyric: 'み' },
  { id: 'd2_v3', bar: 1, offsetBeats: 2.0, durationBeats: 2.0, pitch: 76, velocity: 120, lyric: 'と' },

  // Bar 2 (G)
  { id: 'd2_v4', bar: 2, offsetBeats: 0.0, durationBeats: 1.0, pitch: 79, velocity: 120, lyric: 'み' },
  { id: 'd2_v5', bar: 2, offsetBeats: 1.0, durationBeats: 1.0, pitch: 76, velocity: 115, lyric: 'た' },
  { id: 'd2_v6', bar: 2, offsetBeats: 2.0, durationBeats: 2.0, pitch: 74, velocity: 115, lyric: 'ゆめ' },

  // Bar 3 (Em)
  { id: 'd2_v7', bar: 3, offsetBeats: 0.0, durationBeats: 1.0, pitch: 76, velocity: 115, lyric: 'お' },
  { id: 'd2_v8', bar: 3, offsetBeats: 1.0, durationBeats: 1.0, pitch: 74, velocity: 110, lyric: 'ぼ' },
  { id: 'd2_v9', bar: 3, offsetBeats: 2.0, durationBeats: 2.0, pitch: 72, velocity: 115, lyric: 'えてる' },

  // Bar 4 (Am)
  { id: 'd2_v10', bar: 4, offsetBeats: 0.0, durationBeats: 1.0, pitch: 69, velocity: 115, lyric: 'か' },
  { id: 'd2_v11', bar: 4, offsetBeats: 1.0, durationBeats: 3.0, pitch: 72, velocity: 120, lyric: 'な' },

  // Bar 5 (F)
  { id: 'd2_v12', bar: 5, offsetBeats: 0.0, durationBeats: 1.0, pitch: 77, velocity: 125, lyric: 'あ' },
  { id: 'd2_v13', bar: 5, offsetBeats: 1.0, durationBeats: 1.0, pitch: 76, velocity: 120, lyric: 'の' },
  { id: 'd2_v14', bar: 5, offsetBeats: 2.0, durationBeats: 2.0, pitch: 74, velocity: 115, lyric: 'ひ' },

  // Bar 6 (G)
  { id: 'd2_v15', bar: 6, offsetBeats: 0.0, durationBeats: 1.0, pitch: 76, velocity: 115, lyric: 'か' },
  { id: 'd2_v16', bar: 6, offsetBeats: 1.0, durationBeats: 1.0, pitch: 74, velocity: 115, lyric: 'わ' },
  { id: 'd2_v17', bar: 6, offsetBeats: 2.0, durationBeats: 2.0, pitch: 72, velocity: 120, lyric: 'した' },

  // Bar 7 (C)
  { id: 'd2_v18', bar: 7, offsetBeats: 0.0, durationBeats: 1.0, pitch: 79, velocity: 125, lyric: 'や' },
  { id: 'd2_v19', bar: 7, offsetBeats: 1.0, durationBeats: 1.0, pitch: 76, velocity: 120, lyric: 'く' },
  { id: 'd2_v20', bar: 7, offsetBeats: 2.0, durationBeats: 2.0, pitch: 72, velocity: 120, lyric: 'そく' },

  // Bar 8 (C)
  { id: 'd2_v21', bar: 8, offsetBeats: 0.0, durationBeats: 4.0, pitch: 72, velocity: 120, lyric: 'を' }
];

export const DEMO_PROJECT_2: IdChugProject = {
  version: '1.0.0',
  meta: {
    title: 'Sunset Drive (爽快王道アイドルロック)',
    bpm: 168,
    key: 'C',
    timeSignature: [4, 4]
  },
  chords: [
    { bar: 1, chord: 'F' },
    { bar: 2, chord: 'G' },
    { bar: 3, chord: 'Em' },
    { bar: 4, chord: 'Am' },
    { bar: 5, chord: 'F' },
    { bar: 6, chord: 'G' },
    { bar: 7, chord: 'C' },
    { bar: 8, chord: 'C' }
  ],
  tracks: [
    {
      id: 'trk_vocal',
      type: 'vocal',
      name: 'Vocal (Miku Synth)',
      volume: 0.9,
      pan: 0,
      isMuted: false,
      isSolo: false,
      notes: DEMO_2_NOTES_VOCAL
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
        { id: 'l2_1', bar: 1, offsetBeats: 0.0, durationBeats: 2.0, pitch: 72, velocity: 110 },
        { id: 'l2_2', bar: 1, offsetBeats: 2.0, durationBeats: 2.0, pitch: 76, velocity: 115 },
        { id: 'l2_3', bar: 2, offsetBeats: 0.0, durationBeats: 2.0, pitch: 74, velocity: 110 },
        { id: 'l2_4', bar: 2, offsetBeats: 2.0, durationBeats: 2.0, pitch: 79, velocity: 120 },
        { id: 'l2_5', bar: 3, offsetBeats: 0.0, durationBeats: 2.0, pitch: 76, velocity: 115 },
        { id: 'l2_6', bar: 3, offsetBeats: 2.0, durationBeats: 2.0, pitch: 72, velocity: 110 },
        { id: 'l2_7', bar: 4, offsetBeats: 0.0, durationBeats: 4.0, pitch: 69, velocity: 120 },
        { id: 'l2_8', bar: 5, offsetBeats: 0.0, durationBeats: 2.0, pitch: 77, velocity: 125 },
        { id: 'l2_9', bar: 5, offsetBeats: 2.0, durationBeats: 2.0, pitch: 76, velocity: 120 },
        { id: 'l2_10', bar: 6, offsetBeats: 0.0, durationBeats: 2.0, pitch: 74, velocity: 115 },
        { id: 'l2_11', bar: 6, offsetBeats: 2.0, durationBeats: 2.0, pitch: 79, velocity: 125 },
        { id: 'l2_12', bar: 7, offsetBeats: 0.0, durationBeats: 4.0, pitch: 84, velocity: 130 },
        { id: 'l2_13', bar: 8, offsetBeats: 0.0, durationBeats: 4.0, pitch: 72, velocity: 115 }
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
      rhythmStyle: 'open_strum_8th'
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
        createBlockFromPreset('4-on-the-floor', 1),
        createBlockFromPreset('4-on-the-floor', 2),
        createBlockFromPreset('4-on-the-floor', 3),
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
      volume: 0.75,
      pan: 0.4,
      isMuted: false,
      isSolo: false,
      notes: []
    }
  ]
};

/**
 * サンプル曲3: 「Cyber Breakdown (爆速ラウド＆Chug)」
 * BPM 178、Dm進行、ブレイクダウン＆疾走パンクビート
 */
export const DEMO_PROJECT_3: IdChugProject = {
  version: '1.0.0',
  meta: {
    title: 'Cyber Breakdown (爆速ラウド＆Chug)',
    bpm: 178,
    key: 'Dm',
    timeSignature: [4, 4]
  },
  chords: [
    { bar: 1, chord: 'Dm' },
    { bar: 2, chord: 'Bb' },
    { bar: 3, chord: 'C' },
    { bar: 4, chord: 'A7' },
    { bar: 5, chord: 'Dm' },
    { bar: 6, chord: 'Bb' },
    { bar: 7, chord: 'C' },
    { bar: 8, chord: 'Dm' }
  ],
  tracks: [
    {
      id: 'trk_vocal',
      type: 'vocal',
      name: 'Vocal (Miku Synth)',
      volume: 0.9,
      pan: 0,
      isMuted: false,
      isSolo: false,
      notes: [
        { id: 'v3_1', bar: 1, offsetBeats: 0.0, durationBeats: 1.0, pitch: 74, velocity: 120, lyric: 'BREAK' },
        { id: 'v3_2', bar: 1, offsetBeats: 2.0, durationBeats: 1.0, pitch: 72, velocity: 115, lyric: 'IT' },
        { id: 'v3_3', bar: 2, offsetBeats: 0.0, durationBeats: 2.0, pitch: 70, velocity: 125, lyric: 'DOWN' },
        { id: 'v3_4', bar: 3, offsetBeats: 0.0, durationBeats: 1.0, pitch: 72, velocity: 115, lyric: 'GO' },
        { id: 'v3_5', bar: 3, offsetBeats: 2.0, durationBeats: 1.0, pitch: 74, velocity: 120, lyric: 'NOW' },
        { id: 'v3_6', bar: 4, offsetBeats: 0.0, durationBeats: 2.0, pitch: 69, velocity: 125, lyric: 'YEAH' },
        { id: 'v3_7', bar: 5, offsetBeats: 0.0, durationBeats: 1.0, pitch: 74, velocity: 120, lyric: 'SHOUT' },
        { id: 'v3_8', bar: 5, offsetBeats: 2.0, durationBeats: 1.0, pitch: 77, velocity: 125, lyric: 'OUT' },
        { id: 'v3_9', bar: 6, offsetBeats: 0.0, durationBeats: 2.0, pitch: 74, velocity: 120, lyric: 'LOUD' },
        { id: 'v3_10', bar: 7, offsetBeats: 0.0, durationBeats: 1.0, pitch: 76, velocity: 125, lyric: 'FIRE' },
        { id: 'v3_11', bar: 8, offsetBeats: 0.0, durationBeats: 2.0, pitch: 74, velocity: 130, lyric: 'CHUG' }
      ]
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
        { id: 'lg3_1', bar: 1, offsetBeats: 0.0, durationBeats: 0.5, pitch: 62, velocity: 120 },
        { id: 'lg3_2', bar: 1, offsetBeats: 0.5, durationBeats: 0.5, pitch: 74, velocity: 125 },
        { id: 'lg3_3', bar: 1, offsetBeats: 1.0, durationBeats: 0.5, pitch: 72, velocity: 115 },
        { id: 'lg3_4', bar: 1, offsetBeats: 1.5, durationBeats: 0.5, pitch: 74, velocity: 120 },
        { id: 'lg3_5', bar: 2, offsetBeats: 0.0, durationBeats: 0.5, pitch: 70, velocity: 120 },
        { id: 'lg3_6', bar: 2, offsetBeats: 1.0, durationBeats: 1.0, pitch: 77, velocity: 125 },
        { id: 'lg3_7', bar: 3, offsetBeats: 0.0, durationBeats: 0.5, pitch: 72, velocity: 120 },
        { id: 'lg3_8', bar: 3, offsetBeats: 1.0, durationBeats: 1.0, pitch: 76, velocity: 125 },
        { id: 'lg3_9', bar: 4, offsetBeats: 0.0, durationBeats: 2.0, pitch: 69, velocity: 130 },
        { id: 'lg3_10', bar: 5, offsetBeats: 0.0, durationBeats: 0.5, pitch: 74, velocity: 120 },
        { id: 'lg3_11', bar: 5, offsetBeats: 1.0, durationBeats: 1.0, pitch: 77, velocity: 125 },
        { id: 'lg3_12', bar: 6, offsetBeats: 0.0, durationBeats: 2.0, pitch: 82, velocity: 130 },
        { id: 'lg3_13', bar: 7, offsetBeats: 0.0, durationBeats: 2.0, pitch: 79, velocity: 125 },
        { id: 'lg3_14', bar: 8, offsetBeats: 0.0, durationBeats: 2.0, pitch: 74, velocity: 130 }
      ]
    },
    {
      id: 'trk_rhythm_gt',
      type: 'rhythm_gt',
      name: 'Rhythm Gt (Chug)',
      volume: 1.0,
      pan: -0.4,
      isMuted: false,
      isSolo: false,
      rhythmStyle: 'power_chug_8th'
    },
    {
      id: 'trk_bass',
      type: 'bass',
      name: 'Bass (Ba)',
      volume: 1.0,
      pan: 0,
      isMuted: false,
      isSolo: false
    },
    {
      id: 'trk_drums',
      type: 'drums',
      name: 'Drums (Dr)',
      volume: 0.95,
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
    {
      id: 'trk_keys',
      type: 'keys',
      name: 'Keys / Synth',
      volume: 0.65,
      pan: 0.4,
      isMuted: false,
      isSolo: false,
      notes: []
    }
  ]
};

export const SAMPLE_PROJECTS = [
  { id: 'demo1', name: 'Chug & Sparkle (アイドルChug)', project: DEMO_PROJECT_1 },
  { id: 'demo2', name: 'Sunset Drive (爽快王道アイドルロック)', project: DEMO_PROJECT_2 },
  { id: 'demo3', name: 'Cyber Breakdown (爆速ラウド＆Chug)', project: DEMO_PROJECT_3 }
];

