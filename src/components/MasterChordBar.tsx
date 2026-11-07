import React, { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { Plus, Trash2, Music } from 'lucide-react';

const COMMON_CHORDS = ['Am', 'C', 'F', 'G', 'Dm', 'Em', 'E5', 'A5', 'F5', 'G5', 'F#m', 'B7', 'Bb'];

export const MasterChordBar: React.FC = () => {
  const { project, currentBar, setBarChord, addBar, removeLastBar, seek } = useProjectStore();
  const [editingBar, setEditingBar] = useState<number | null>(null);
  const [chordInput, setChordInput] = useState('');

  const startEdit = (bar: number, currentChord: string) => {
    setEditingBar(bar);
    setChordInput(currentChord);
  };

  const commitEdit = (bar: number) => {
    if (chordInput.trim()) {
      setBarChord(bar, chordInput.trim());
    }
    setEditingBar(null);
  };

  const maxBar = Math.max(...project.chords.map((c) => c.bar), 4);
  const barList = Array.from({ length: maxBar }, (_, i) => i + 1);

  return (
    <div className="bg-[#151924] border-b border-[#252c3e] flex items-center select-none overflow-x-auto">
      {/* 左側固定ヘッダー */}
      <div className="w-56 min-w-[14rem] px-4 py-2 border-r border-[#252c3e] flex items-center justify-between bg-[#131620] sticky left-0 z-20">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-red-500" />
          <span className="text-xs font-bold text-gray-200 uppercase tracking-wide">CHORD TRACK</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={addBar}
            className="p-1 text-gray-400 hover:text-emerald-400 hover:bg-gray-800 rounded transition"
            title="小節を追加 (+1 Bar)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={removeLastBar}
            className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition"
            title="最後の小節を削除"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 小節ごとのコードセル */}
      <div className="flex items-stretch flex-1 min-w-max">
        {barList.map((bar) => {
          const chordObj = project.chords.find((c) => c.bar === bar);
          const chord = chordObj ? chordObj.chord : 'C';
          const isCurrent = currentBar === bar;
          const isEditing = editingBar === bar;

          return (
            <div
              key={bar}
              className={`w-36 min-w-[9rem] border-r border-[#252c3e] relative group transition-colors flex flex-col justify-between p-2 cursor-pointer ${
                isCurrent ? 'bg-red-950/30 ring-1 ring-inset ring-red-500/50' : 'hover:bg-[#1a202e]'
              }`}
              onClick={() => seek(bar)}
            >
              {/* 小節番号インジケータ */}
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-500">
                <span className={isCurrent ? 'text-red-400 font-bold' : ''}>Bar {bar}</span>
                {isCurrent && (
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </div>

              {/* コード表示 / 編集 */}
              {isEditing ? (
                <div
                  className="my-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    autoFocus
                    value={chordInput}
                    onChange={(e) => setChordInput(e.target.value)}
                    onBlur={() => commitEdit(bar)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit(bar);
                      if (e.key === 'Escape') setEditingBar(null);
                    }}
                    className="w-full bg-[#0a0d14] text-amber-300 font-bold font-mono text-center border border-amber-500 rounded py-1 px-1 text-sm outline-none"
                  />
                  {/* クイック選択候補ポップアップ */}
                  <div className="absolute top-full left-0 mt-1 bg-[#1a202d] border border-gray-700 rounded shadow-xl p-1.5 flex flex-wrap gap-1 z-30 w-44">
                    {COMMON_CHORDS.map((c) => (
                      <button
                        key={c}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setBarChord(bar, c);
                          setEditingBar(null);
                        }}
                        className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#262f42] hover:bg-red-600 text-gray-200 rounded"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  className="py-1 px-2 my-0.5 rounded text-center transition hover:bg-[#232b3d]"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startEdit(bar, chord);
                  }}
                  title="ダブルクリックでコード編集"
                >
                  <span className="text-base font-black font-mono tracking-wide text-amber-400 group-hover:text-amber-300">
                    {chord}
                  </span>
                </div>
              )}

              {/* ヒント */}
              <span className="text-[9px] text-gray-500 text-center opacity-0 group-hover:opacity-100 transition">
                ダブルクリックで編集
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

