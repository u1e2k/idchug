import React from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { MasterChordBar } from './MasterChordBar';
import { TrackRow } from './TrackRow';

export const Timeline: React.FC = () => {
  const { project, currentBar, seek } = useProjectStore();

  const maxBar = Math.max(
    ...project.chords.map((c) => c.bar),
    ...project.tracks.flatMap((t) => t.notes?.map((n) => n.bar) || []),
    ...project.tracks.flatMap((t) => t.drumBlocks?.map((b) => b.bar) || []),
    4
  );

  const barList = Array.from({ length: maxBar }, (_, i) => i + 1);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0d1017] overflow-auto">
      {/* グローバルコードトラック */}
      <MasterChordBar />

      {/* 小節ルーラー */}
      <div className="flex items-center border-b border-[#1f2537] bg-[#10131d] select-none text-[11px] text-gray-500 font-mono">
        {/* 左側トラックヘッダー空白 */}
        <div className="w-56 min-w-[14rem] px-4 py-1 border-r border-[#1f2537] bg-[#0e111a] sticky left-0 z-20 font-bold text-gray-400">
          TRACKS / BARS
        </div>

        {/* ルーラー目盛り */}
        <div className="flex items-stretch flex-1 min-w-max">
          {barList.map((bar) => {
            const isCurrent = currentBar === bar;
            return (
              <div
                key={bar}
                onClick={() => seek(bar)}
                className={`w-36 min-w-[9rem] border-r border-[#1f2537] py-1 px-2 flex justify-between items-center cursor-pointer hover:bg-gray-800/40 transition ${
                  isCurrent ? 'bg-red-950/20 text-red-400 font-bold' : ''
                }`}
              >
                <span>Bar {bar}</span>
                <span className="text-[9px] text-gray-600">.1 .2 .3 .4</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* トラック行一覧 */}
      <div className="flex-1">
        {project.tracks.map((track) => (
          <TrackRow key={track.id} track={track} maxBar={maxBar} />
        ))}
      </div>
    </div>
  );
};

