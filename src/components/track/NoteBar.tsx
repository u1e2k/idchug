import React from 'react';
import { NoteItem, TrackType } from '../../types/project';

interface NoteBarProps {
  type: TrackType;
  notes: NoteItem[];
  accentClass: string;
}

export const NoteBar: React.FC<NoteBarProps> = ({ type, notes, accentClass }) => {
  if (notes.length === 0) {
    if (type === 'keys') {
      return (
        <div className="w-full h-8 border border-dashed border-emerald-900/30 rounded flex items-center justify-center text-[10px] text-emerald-600/70 font-mono">
          Auto Chord Pad
        </div>
      );
    }
    return (
      <div className="w-full h-8 border border-dashed border-[#232a3c] rounded flex items-center justify-center text-[10px] text-gray-600">
        ノートなし
      </div>
    );
  }

  return (
    <div className="w-full h-10 relative bg-[#0e121b] border border-gray-800 rounded overflow-hidden">
      {notes.map((note) => {
        const leftPct = (note.offsetBeats / 4) * 100;
        const widthPct = Math.min(100 - leftPct, (note.durationBeats / 4) * 100);
        // ピッチに応じた縦位置 (MIDI 48〜84)
        const clampedPitch = Math.max(48, Math.min(84, note.pitch));
        const topPct = 100 - ((clampedPitch - 48) / 36) * 80 - 15;

        return (
          <div
            key={note.id}
            className={`absolute h-3.5 rounded text-[8px] font-bold text-white flex items-center justify-center px-1 truncate shadow border border-white/20 ${accentClass}`}
            style={{
              left: `${leftPct}%`,
              width: `${Math.max(widthPct, 6)}%`,
              top: `${Math.max(5, Math.min(75, topPct))}%`
            }}
            title={`[${note.lyric || '♪'}] Pitch: ${note.pitch}, Duration: ${note.durationBeats} beats`}
          >
            <span className="truncate leading-none">{type === 'vocal' ? (note.lyric || '♪') : '♪'}</span>
          </div>
        );
      })}
    </div>
  );
};

