import { DrumStep, DrumBlock } from '../types/project';

export interface DrumPreset {
  name: string;
  label: string;
  description: string;
  steps: DrumStep[];
}

export const DRUM_PRESETS: DrumPreset[] = [
  {
    name: '8beat-basic',
    label: '8-Beat Basic',
    description: '王道の8ビート。1・3拍キック＆2・4拍スネア',
    steps: [
      { instrument: 'kick', step: 0, velocity: 110 },
      { instrument: 'kick', step: 8, velocity: 105 },
      { instrument: 'snare', step: 4, velocity: 115 },
      { instrument: 'snare', step: 12, velocity: 115 },
      { instrument: 'hihat_c', step: 0, velocity: 85 },
      { instrument: 'hihat_c', step: 2, velocity: 75 },
      { instrument: 'hihat_c', step: 4, velocity: 85 },
      { instrument: 'hihat_c', step: 6, velocity: 75 },
      { instrument: 'hihat_c', step: 8, velocity: 85 },
      { instrument: 'hihat_c', step: 10, velocity: 75 },
      { instrument: 'hihat_c', step: 12, velocity: 85 },
      { instrument: 'hihat_c', step: 14, velocity: 75 }
    ]
  },
  {
    name: '8beat-drive',
    label: '8-Beat Drive',
    description: 'キックを食い込ませた疾走感のあるドライブビート',
    steps: [
      { instrument: 'kick', step: 0, velocity: 115 },
      { instrument: 'kick', step: 6, velocity: 100 },
      { instrument: 'kick', step: 8, velocity: 110 },
      { instrument: 'kick', step: 14, velocity: 95 },
      { instrument: 'snare', step: 4, velocity: 120 },
      { instrument: 'snare', step: 12, velocity: 120 },
      { instrument: 'hihat_c', step: 0, velocity: 90 },
      { instrument: 'hihat_c', step: 2, velocity: 80 },
      { instrument: 'hihat_c', step: 4, velocity: 90 },
      { instrument: 'hihat_c', step: 6, velocity: 80 },
      { instrument: 'hihat_c', step: 8, velocity: 90 },
      { instrument: 'hihat_c', step: 10, velocity: 80 },
      { instrument: 'hihat_c', step: 12, velocity: 90 },
      { instrument: 'hihat_c', step: 14, velocity: 80 }
    ]
  },
  {
    name: 'punk-fast',
    label: 'Punk / Fast Chug',
    description: '2ビート＆裏打ちオープンハイハットの疾走パンクビート',
    steps: [
      { instrument: 'kick', step: 0, velocity: 120 },
      { instrument: 'snare', step: 4, velocity: 120 },
      { instrument: 'kick', step: 6, velocity: 110 },
      { instrument: 'kick', step: 8, velocity: 115 },
      { instrument: 'snare', step: 12, velocity: 120 },
      { instrument: 'kick', step: 14, velocity: 105 },
      { instrument: 'hihat_o', step: 2, velocity: 90 },
      { instrument: 'hihat_o', step: 6, velocity: 90 },
      { instrument: 'hihat_o', step: 10, velocity: 90 },
      { instrument: 'hihat_o', step: 14, velocity: 90 },
      { instrument: 'crash', step: 0, velocity: 110 }
    ]
  },
  {
    name: '4-on-the-floor',
    label: '4 on the Floor',
    description: '4つ打ちキックと裏打ちオープンハットのダンサブルビート',
    steps: [
      { instrument: 'kick', step: 0, velocity: 120 },
      { instrument: 'kick', step: 4, velocity: 115 },
      { instrument: 'kick', step: 8, velocity: 120 },
      { instrument: 'kick', step: 12, velocity: 115 },
      { instrument: 'snare', step: 4, velocity: 115 },
      { instrument: 'snare', step: 12, velocity: 115 },
      { instrument: 'hihat_c', step: 0, velocity: 80 },
      { instrument: 'hihat_o', step: 2, velocity: 95 },
      { instrument: 'hihat_c', step: 4, velocity: 80 },
      { instrument: 'hihat_o', step: 6, velocity: 95 },
      { instrument: 'hihat_c', step: 8, velocity: 80 },
      { instrument: 'hihat_o', step: 10, velocity: 95 },
      { instrument: 'hihat_c', step: 12, velocity: 80 },
      { instrument: 'hihat_o', step: 14, velocity: 95 }
    ]
  },
  {
    name: 'fill-01',
    label: 'Fill-In: Tom Roll',
    description: 'スネアからタムタムへと駆け下りる定番フィルイン',
    steps: [
      { instrument: 'kick', step: 0, velocity: 110 },
      { instrument: 'snare', step: 0, velocity: 90 },
      { instrument: 'snare', step: 2, velocity: 95 },
      { instrument: 'snare', step: 4, velocity: 105 },
      { instrument: 'snare', step: 6, velocity: 110 },
      { instrument: 'tom_h', step: 8, velocity: 115 },
      { instrument: 'tom_h', step: 10, velocity: 115 },
      { instrument: 'tom_l', step: 12, velocity: 120 },
      { instrument: 'tom_l', step: 14, velocity: 125 }
    ]
  },
  {
    name: 'fill-crash-break',
    label: 'Fill-In: Crash Accent',
    description: 'クラッシュシンバルとキックでアクセントをつけるブレイク',
    steps: [
      { instrument: 'crash', step: 0, velocity: 125 },
      { instrument: 'kick', step: 0, velocity: 125 },
      { instrument: 'snare', step: 8, velocity: 100 },
      { instrument: 'snare', step: 10, velocity: 105 },
      { instrument: 'snare', step: 12, velocity: 115 },
      { instrument: 'snare', step: 14, velocity: 120 }
    ]
  }
];

export function createBlockFromPreset(presetName: string, bar: number): DrumBlock {
  const preset = DRUM_PRESETS.find((p) => p.name === presetName) || DRUM_PRESETS[0];
  return {
    id: `drum_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    bar,
    lengthBars: 1,
    presetName: preset.name,
    steps: JSON.parse(JSON.stringify(preset.steps))
  };
}

