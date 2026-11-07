import React from 'react';
import { Disc3, X } from 'lucide-react';
import { DrumBlock } from '../../types/project';
import { useProjectStore } from '../../store/useProjectStore';

interface DrumBarProps {
  trackId: string;
  block?: DrumBlock;
}

export const DrumBar: React.FC<DrumBarProps> = ({ trackId, block }) => {
  const { openDrumEditor, removeDrumBlock } = useProjectStore();

  if (!block) {
    return (
      <div className="w-full h-12 border border-dashed border-[#2b3347] rounded flex items-center justify-center text-[10px] text-gray-600 hover:border-purple-500/60 transition group cursor-pointer">
        <span className="group-hover:text-purple-400">DnD ドロップ</span>
      </div>
    );
  }

  return (
    <div
      onDoubleClick={() => openDrumEditor(trackId, block)}
      className="w-full h-12 bg-gradient-to-r from-purple-900/60 to-[#221c38] border border-purple-500/60 hover:border-purple-400 rounded p-1 flex flex-col justify-between cursor-pointer group shadow-sm transition hover:shadow-purple-900/30"
      title="ダブルクリックで16ステップ編集"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-purple-200 truncate flex items-center gap-1">
          <Disc3 className="w-3 h-3 text-purple-400 shrink-0" />
          {block.presetName || 'Custom Beat'}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeDrumBlock(trackId, block.id);
          }}
          className="p-0.5 hover:bg-red-600/80 rounded text-gray-400 hover:text-white transition"
          title="削除"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* 16ステップ簡易ドット波形プレビュー */}
      <div className="flex gap-0.5 items-end h-3">
        {Array.from({ length: 16 }).map((_, stepIdx) => {
          const hasHit = block.steps.some((s) => s.step === stepIdx);
          const hasKickOrSnare = block.steps.some(
            (s) => s.step === stepIdx && (s.instrument === 'kick' || s.instrument === 'snare')
          );
          return (
            <div
              key={stepIdx}
              className={`flex-1 rounded-sm ${
                hasKickOrSnare
                  ? 'bg-purple-400 h-3'
                  : hasHit
                  ? 'bg-purple-600/70 h-2'
                  : 'bg-purple-950/40 h-1'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

