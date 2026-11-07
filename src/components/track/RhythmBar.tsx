import React from 'react';
import { TrackType, RhythmGtStyle } from '../../types/project';

interface RhythmBarProps {
  type: TrackType;
  rhythmStyle?: RhythmGtStyle;
}

export const RhythmBar: React.FC<RhythmBarProps> = ({ type, rhythmStyle }) => {
  if (type === 'rhythm_gt') {
    return (
      <div className="w-full h-10 bg-red-950/30 border border-red-900/40 rounded px-1.5 py-1 flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold text-red-400/90 uppercase">
          {rhythmStyle === 'power_chug_8th' ? 'CHUG x8' : 'STRUM x8'}
        </span>
        <div className="flex gap-0.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 rounded-sm ${
                i === 0 || i === 4 ? 'h-5 bg-red-500' : 'h-3 bg-red-800/80'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'bass') {
    return (
      <div className="w-full h-10 bg-cyan-950/30 border border-cyan-900/40 rounded px-1.5 py-1 flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold text-cyan-400/90 uppercase">
          BASS 8th
        </span>
        <div className="flex gap-0.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-2.5 h-3.5 bg-cyan-600 rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  return null;
};
