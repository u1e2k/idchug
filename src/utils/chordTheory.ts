import { Chord, Note } from '@tonaljs/tonal';

export interface ParsedChordInfo {
  chordName: string;
  rootName: string;
  rootMidi: number; // 例: A2 = 45
  bassMidi: number; // 低音域 A1 = 33 / A2 = 45
  powerChordMidis: number[]; // [Root, 5th, Octave]
  fullChordMidis: number[]; // 全構成音 (ミドルオクターブ)
}

/**
 * コードネームからギター・ベース用のMIDIノート情報を解析
 */
export function parseChord(chordName: string): ParsedChordInfo {
  const cleanName = chordName.trim() || 'C';
  const c = Chord.get(cleanName);

  const rootName = c.root || 'C';
  // Note.midi("C3") = 48
  let rawRootMidi = Note.midi(`${rootName}3`) || 48;
  // ベース用の低いMIDI (MIDI 28(E1) 〜 47(B2))
  let bassMidi = rawRootMidi - 12;
  if (bassMidi < 28) bassMidi += 12;
  if (bassMidi > 47) bassMidi -= 12;

  // ギターパワーコード用ルート (MIDI 40(E2) 〜 52(E3))
  let gtRootMidi = rawRootMidi;
  if (gtRootMidi > 52) gtRootMidi -= 12;
  if (gtRootMidi < 40) gtRootMidi += 12;

  const fifthMidi = gtRootMidi + 7;
  const octaveMidi = gtRootMidi + 12;
  const powerChordMidis = [gtRootMidi, fifthMidi, octaveMidi];

  // フルコード音
  const notes = c.notes && c.notes.length > 0 ? c.notes : [rootName];
  const fullChordMidis = notes.map((noteName, idx) => {
    let m = Note.midi(`${noteName}3`);
    if (!m) m = 60;
    // 重なりすぎないよう適度にボイシング
    if (idx >= 2 && m < 60) m += 12;
    return m;
  });

  return {
    chordName: cleanName,
    rootName,
    rootMidi: gtRootMidi,
    bassMidi,
    powerChordMidis,
    fullChordMidis
  };
}

