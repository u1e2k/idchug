import React from 'react';
import { DRUM_PRESETS } from '../utils/drumPresets';
import { useProjectStore } from '../store/useProjectStore';
import { createBlockFromPreset } from '../utils/drumPresets';
import { audioEngine } from '../audio/AudioEngine';
import { Drum, GripVertical, Play, PlusCircle } from 'lucide-react';

export const DrumPalette: React.FC = () => {
  const { project, currentBar, addDrumBlockToTrack } = useProjectStore();

  const drumTrack = project.tracks.find((t) => t.type === 'drums');

  const handleDragStart = (e: React.DragEvent, presetName: string) => {
    e.dataTransfer.setData('text/plain', presetName);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // プリセットのクイックプレビュー
  const handlePreview = async (steps: any[]) => {
    await audioEngine.init();
    const ctx = audioEngine.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const stepDuration = 0.08; // テンポ早めのプレビュー
    steps.forEach((s) => {
      audioEngine.drumSampler.trigger(s.instrument, now + s.step * stepDuration, s.velocity / 127, ctx.destination);
    });
  };

  // 現在の小節に即座に配置
  const handleQuickAdd = (presetName: string) => {
    if (!drumTrack) return;
    const block = createBlockFromPreset(presetName, currentBar);
    addDrumBlockToTrack(drumTrack.id, block);
  };

  return (
    <div className="bg-[#11141e] border-t border-[#22293b] p-3 select-none shadow-2xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Drum className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">
            DRUM PATTERN PALETTE
          </span>
          <span className="text-[11px] text-gray-500">
            （パターンをドラムトラックの小節へドラッグ＆ドロップ）
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {DRUM_PRESETS.map((preset) => (
          <div
            key={preset.name}
            draggable
            onDragStart={(e) => handleDragStart(e, preset.name)}
            className="group relative bg-[#171c29] hover:bg-[#1e2538] border border-[#2b3347] hover:border-purple-500/80 rounded-lg p-2.5 cursor-grab active:cursor-grabbing transition shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-200 group-hover:text-purple-300 truncate">
                  {preset.label}
                </span>
                <GripVertical className="w-3.5 h-3.5 text-gray-500 group-hover:text-purple-400 shrink-0" />
              </div>
              <p className="text-[10px] text-gray-400 line-clamp-1 mb-2 leading-relaxed">
                {preset.description}
              </p>
            </div>

            <div className="flex items-center justify-between gap-1 pt-1 border-t border-gray-800/60">
              <button
                type="button"
                onClick={() => handlePreview(preset.steps)}
                className="px-2 py-0.5 text-[10px] bg-[#22283a] hover:bg-purple-900/50 text-gray-300 hover:text-purple-200 rounded flex items-center gap-1 transition"
                title="プレビュー試聴"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>試聴</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAdd(preset.name)}
                className="px-2 py-0.5 text-[10px] bg-purple-950/60 hover:bg-purple-700 text-purple-300 hover:text-white rounded flex items-center gap-1 transition font-semibold"
                title={`Bar ${currentBar} に配置`}
              >
                <PlusCircle className="w-2.5 h-2.5" />
                <span>+Bar {currentBar}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

