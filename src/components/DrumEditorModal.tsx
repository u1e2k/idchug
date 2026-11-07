import React, { useState, useEffect, useRef } from 'react';
import { DrumBlock, DrumInstrument, DrumStep } from '../types/project';
import { useProjectStore } from '../store/useProjectStore';
import { audioEngine } from '../audio/AudioEngine';
import { X, Play, Square, Save, RotateCcw, Volume2 } from 'lucide-react';

interface InstrumentMeta {
  id: DrumInstrument;
  name: string;
  icon: string;
  color: string;
}

const DRUM_INSTRUMENTS: InstrumentMeta[] = [
  { id: 'crash', name: 'Crash Cymbal', icon: '💥', color: 'bg-amber-500' },
  { id: 'tom_h', name: 'High Tom', icon: '🟣', color: 'bg-indigo-500' },
  { id: 'tom_l', name: 'Low Tom', icon: '🔵', color: 'bg-blue-500' },
  { id: 'snare', name: 'Snare Drum', icon: '🥁', color: 'bg-rose-500' },
  { id: 'hihat_o', name: 'Open Hi-Hat', icon: '🔔', color: 'bg-yellow-400' },
  { id: 'hihat_c', name: 'Closed Hi-Hat', icon: '⚡', color: 'bg-emerald-400' },
  { id: 'kick', name: 'Kick Drum', icon: '🔊', color: 'bg-red-600' }
];

export const DrumEditorModal: React.FC = () => {
  const { drumEditTarget, closeDrumEditor, updateDrumBlock, project } = useProjectStore();

  const [steps, setSteps] = useState<DrumStep[]>([]);
  const [blockName, setBlockName] = useState('');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewStep, setPreviewStep] = useState(0);

  const previewTimerRef = useRef<number | null>(null);

  const stopPreviewLoop = () => {
    setIsPlayingPreview(false);
    if (previewTimerRef.current !== null) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    setPreviewStep(0);
  };

  useEffect(() => {
    if (drumEditTarget) {
      setSteps(JSON.parse(JSON.stringify(drumEditTarget.block.steps)));
      setBlockName(drumEditTarget.block.presetName ? `${drumEditTarget.block.presetName} (Custom)` : 'Custom Beat');
    }
    return () => {
      stopPreviewLoop();
    };
  }, [drumEditTarget]);

  const handleToggleCell = async (instrument: DrumInstrument, stepIdx: number) => {
    await audioEngine.init();

    setSteps((prev) => {
      const existsIndex = prev.findIndex((s) => s.instrument === instrument && s.step === stepIdx);
      if (existsIndex >= 0) {
        // 削除
        return prev.filter((_, idx) => idx !== existsIndex);
      } else {
        // 追加 & プレビュー発音
        audioEngine.previewDrum(instrument);
        return [...prev, { instrument, step: stepIdx, velocity: 110 }];
      }
    });
  };

  const handleInstrumentClick = async (inst: DrumInstrument) => {
    await audioEngine.init();
    audioEngine.previewDrum(inst);
  };

  const handleClear = () => {
    setSteps([]);
  };

  const handleSave = () => {
    if (!drumEditTarget) return;
    const updated: DrumBlock = {
      ...drumEditTarget.block,
      presetName: blockName.trim() || 'Custom Beat',
      steps
    };
    updateDrumBlock(drumEditTarget.trackId, updated);
  };

  // ループプレビュー
  const startPreviewLoop = async () => {
    await audioEngine.init();
    const ctx = audioEngine.getContext();
    if (!ctx) return;

    setIsPlayingPreview(true);
    let step = 0;
    const intervalMs = (60 / project.meta.bpm / 4) * 1000;

    const tick = () => {
      setPreviewStep(step);
      // このステップの打音を再生
      const currentHits = steps.filter((s) => s.step === step);
      currentHits.forEach((hit) => {
        audioEngine.drumSampler.trigger(hit.instrument, ctx.currentTime, hit.velocity / 127, ctx.destination);
      });

      step = (step + 1) % 16;
      previewTimerRef.current = window.setTimeout(tick, intervalMs);
    };

    tick();
  };

  if (!drumEditTarget) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-[#141824] border border-[#2e374d] rounded-xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* モーダルヘッダー */}
        <div className="px-5 py-3.5 bg-[#181d2c] border-b border-[#2a3247] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🥁</span>
            <div>
              <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                <span>16ステップ ドラムエディタ</span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/50 font-mono">
                  Bar {drumEditTarget.block.bar}
                </span>
              </h3>
              <input
                type="text"
                value={blockName}
                onChange={(e) => setBlockName(e.target.value)}
                className="bg-transparent text-xs text-purple-300 hover:text-white font-medium border-b border-transparent hover:border-purple-500 focus:border-purple-400 outline-none transition"
                placeholder="ブロック名"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ループプレビューボタン */}
            {isPlayingPreview ? (
              <button
                onClick={stopPreviewLoop}
                className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-gray-950 rounded flex items-center gap-1.5 transition"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>停止</span>
              </button>
            ) : (
              <button
                onClick={startPreviewLoop}
                className="px-3 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded flex items-center gap-1.5 transition shadow"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>試聴ループ</span>
              </button>
            )}

            <button
              onClick={handleClear}
              className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition flex items-center gap-1"
              title="全ステップをクリア"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>クリア</span>
            </button>

            <button
              onClick={closeDrumEditor}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* グリッド編集領域 */}
        <div className="p-5 overflow-x-auto bg-[#0f121a]">
          {/* 拍インジケータ */}
          <div className="flex items-center mb-2">
            <div className="w-36 min-w-[9rem] text-xs font-bold text-gray-400 font-mono">
              INSTRUMENT
            </div>
            <div className="flex flex-1 gap-1 min-w-[500px]">
              {Array.from({ length: 16 }).map((_, stepIdx) => {
                const isBeatHead = stepIdx % 4 === 0;
                const beatNum = Math.floor(stepIdx / 4) + 1;
                const isCurrent = isPlayingPreview && previewStep === stepIdx;
                return (
                  <div
                    key={stepIdx}
                    className={`flex-1 text-center py-0.5 rounded text-[10px] font-mono transition-colors ${
                      isCurrent
                        ? 'bg-purple-500 text-white font-bold'
                        : isBeatHead
                        ? 'bg-[#1e2538] text-purple-300 font-bold'
                        : 'text-gray-600'
                    }`}
                  >
                    {isBeatHead ? `${beatNum}` : `.`}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 各楽器の16ステップ行 */}
          <div className="space-y-1.5">
            {DRUM_INSTRUMENTS.map((inst) => (
              <div key={inst.id} className="flex items-center group">
                {/* 楽器ラベル */}
                <button
                  type="button"
                  onClick={() => handleInstrumentClick(inst.id)}
                  className="w-36 min-w-[9rem] text-left px-2.5 py-1.5 rounded bg-[#161a26] hover:bg-[#1e2436] border border-[#272f44] flex items-center justify-between text-xs font-semibold text-gray-200 transition"
                  title="クリックで単音試聴"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span>{inst.icon}</span>
                    <span className="truncate">{inst.name}</span>
                  </span>
                  <Volume2 className="w-3 h-3 text-gray-500 group-hover:text-purple-400 shrink-0" />
                </button>

                {/* 16ステップボタン */}
                <div className="flex flex-1 gap-1 ml-2 min-w-[500px]">
                  {Array.from({ length: 16 }).map((_, stepIdx) => {
                    const isBeatHead = stepIdx % 4 === 0;
                    const isActive = steps.some((s) => s.instrument === inst.id && s.step === stepIdx);
                    const isCurrent = isPlayingPreview && previewStep === stepIdx;

                    return (
                      <button
                        key={stepIdx}
                        type="button"
                        onClick={() => handleToggleCell(inst.id, stepIdx)}
                        className={`flex-1 h-9 rounded transition-all flex items-center justify-center relative ${
                          isActive
                            ? `${inst.color} text-white shadow-md shadow-purple-950/40 ring-1 ring-white/30 scale-[0.98]`
                            : isBeatHead
                            ? 'bg-[#1b2132] hover:bg-[#252e46] border border-[#2d3752]'
                            : 'bg-[#131722] hover:bg-[#1d2334] border border-[#20273a]'
                        } ${isCurrent ? 'ring-2 ring-purple-400' : ''}`}
                      >
                        {isActive && <div className="w-2 h-2 rounded-full bg-white/90" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* モーダルフッター */}
        <div className="px-5 py-3 bg-[#181d2c] border-t border-[#2a3247] flex items-center justify-between">
          <div className="text-[11px] text-gray-400">
            ※ ステップをクリックしてON/OFF。楽器名をクリックで単音試聴できます。
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={closeDrumEditor}
              className="px-4 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-800 rounded transition"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded shadow-lg shadow-purple-900/50 flex items-center gap-1.5 transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>保存して適用</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

