import React from 'react';
import { TrackData, DrumBlock } from '../types/project';
import { useProjectStore } from '../store/useProjectStore';
import { createBlockFromPreset } from '../utils/drumPresets';
import { Volume2, Mic, Settings, X, Edit3, Music2, Disc3 } from 'lucide-react';

interface TrackRowProps {
  track: TrackData;
  maxBar: number;
}

const TRACK_THEMES: Record<string, { badge: string; border: string; accent: string; icon: string }> = {
  vocal: { badge: 'bg-rose-950/60 text-rose-300 border-rose-700/50', border: 'border-l-rose-500', accent: 'bg-rose-500', icon: '🎤' },
  lead_gt: { badge: 'bg-amber-950/60 text-amber-300 border-amber-700/50', border: 'border-l-amber-500', accent: 'bg-amber-500', icon: '🎸' },
  rhythm_gt: { badge: 'bg-red-950/60 text-red-300 border-red-700/50', border: 'border-l-red-600', accent: 'bg-red-600', icon: '⚡' },
  bass: { badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-700/50', border: 'border-l-cyan-500', accent: 'bg-cyan-500', icon: '🎻' },
  drums: { badge: 'bg-purple-950/60 text-purple-300 border-purple-700/50', border: 'border-l-purple-500', accent: 'bg-purple-500', icon: '🥁' },
  keys: { badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50', border: 'border-l-emerald-500', accent: 'bg-emerald-500', icon: '🎹' }
};

export const TrackRow: React.FC<TrackRowProps> = ({ track, maxBar }) => {
  const {
    currentBar,
    currentStep16,
    isPlaying,
    setTrackVolume,
    setTrackPan,
    toggleTrackMute,
    toggleTrackSolo,
    setRhythmStyle,
    addDrumBlockToTrack,
    removeDrumBlock,
    openDrumEditor,
    openHumRecorder,
    clearTrackNotes
  } = useProjectStore();

  const theme = TRACK_THEMES[track.type] || TRACK_THEMES.rhythm_gt;
  const barList = Array.from({ length: maxBar }, (_, i) => i + 1);

  // ドラムのドロップ処理
  const handleDragOver = (e: React.DragEvent) => {
    if (track.type === 'drums') {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e: React.DragEvent, bar: number) => {
    e.preventDefault();
    if (track.type !== 'drums') return;
    const presetName = e.dataTransfer.getData('text/plain');
    if (presetName) {
      const block = createBlockFromPreset(presetName, bar);
      addDrumBlockToTrack(track.id, block);
    }
  };

  return (
    <div className={`flex border-b border-[#1f2535] bg-[#121622] hover:bg-[#151a28] transition-colors ${theme.border} border-l-4`}>
      {/* トラックヘッダー (コントロールパネル) */}
      <div className="w-56 min-w-[14rem] p-2.5 border-r border-[#22293b] bg-[#11141e] flex flex-col justify-between select-none sticky left-0 z-10 shadow-md">
        {/* トラック名 & 楽器バッジ */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-sm">{theme.icon}</span>
            <span className="text-xs font-bold text-gray-200 truncate">{track.name}</span>
          </div>

          {/* 鼻歌録音ボタン (Vo / Lead Gt) */}
          {(track.type === 'vocal' || track.type === 'lead_gt') && (
            <button
              onClick={() => openHumRecorder(track.id, track.type)}
              className="p-1 px-1.5 rounded bg-rose-900/40 hover:bg-rose-700 text-rose-300 hover:text-white border border-rose-700/40 text-[10px] flex items-center gap-1 font-bold transition shadow-sm"
              title="鼻歌入力でメロディをMIDIノート化"
            >
              <Mic className="w-3 h-3 text-rose-400" />
              <span>鼻歌</span>
            </button>
          )}

          {/* リズムギタースタイル切替 */}
          {track.type === 'rhythm_gt' && (
            <select
              value={track.rhythmStyle || 'power_chug_8th'}
              onChange={(e) => setRhythmStyle(track.id, e.target.value as any)}
              className="bg-[#1b2130] text-[10px] text-red-300 border border-red-900/60 rounded px-1 py-0.5 outline-none font-semibold cursor-pointer"
              title="ギター演奏スタイル"
            >
              <option value="power_chug_8th">Chug (P.M.)</option>
              <option value="open_strum_8th">Open Strum</option>
              <option value="clean_arpeggio">Arpeggio</option>
            </select>
          )}
        </div>

        {/* Mute, Solo, Vol, Pan */}
        <div className="flex items-center gap-2 text-xs">
          {/* Mute / Solo */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleTrackMute(track.id)}
              className={`w-5 h-5 rounded text-[10px] font-black transition flex items-center justify-center ${
                track.isMuted
                  ? 'bg-amber-600 text-black font-extrabold shadow-inner'
                  : 'bg-[#202738] text-gray-400 hover:bg-gray-700'
              }`}
              title="ミュート (消音)"
            >
              M
            </button>
            <button
              onClick={() => toggleTrackSolo(track.id)}
              className={`w-5 h-5 rounded text-[10px] font-black transition flex items-center justify-center ${
                track.isSolo
                  ? 'bg-yellow-400 text-black font-extrabold shadow-inner'
                  : 'bg-[#202738] text-gray-400 hover:bg-gray-700'
              }`}
              title="ソロ (このトラックのみ再生)"
            >
              S
            </button>
          </div>

          {/* Volume スライダー */}
          <div className="flex items-center gap-1 flex-1">
            <Volume2 className="w-3 h-3 text-gray-500" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={track.volume}
              onChange={(e) => setTrackVolume(track.id, parseFloat(e.target.value))}
              className="w-full h-1 bg-[#262e42] rounded-lg appearance-none cursor-pointer accent-red-500"
              title={`Volume: ${Math.round(track.volume * 100)}%`}
            />
          </div>

          {/* Pan スライダー */}
          <div className="w-10 flex items-center">
            <input
              type="range"
              min="-1"
              max="1"
              step="0.1"
              value={track.pan}
              onChange={(e) => setTrackPan(track.id, parseFloat(e.target.value))}
              className="w-full h-1 bg-[#262e42] rounded-lg appearance-none cursor-pointer accent-cyan-500"
              title={`Pan: ${track.pan === 0 ? 'C' : track.pan > 0 ? `R${Math.round(track.pan * 50)}` : `L${Math.round(Math.abs(track.pan) * 50)}`}`}
            />
          </div>
        </div>

        {/* ノートクリアボタン (ノートが存在する場合) */}
        {track.notes && track.notes.length > 0 && (
          <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-800 text-[10px] text-gray-400">
            <span>{track.notes.length} notes</span>
            <button
              onClick={() => clearTrackNotes(track.id)}
              className="text-red-400 hover:text-red-300 hover:underline"
            >
              クリア
            </button>
          </div>
        )}
      </div>

      {/* 小節グリッドコンテナ */}
      <div className="flex items-stretch flex-1 min-w-max relative">
        {barList.map((bar) => {
          const isCurrentBar = currentBar === bar;

          return (
            <div
              key={bar}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, bar)}
              className={`w-36 min-w-[9rem] border-r border-[#1f2536] p-1.5 relative transition-colors ${
                isCurrentBar ? 'bg-red-950/15' : ''
              }`}
            >
              {/* 再生ヘッドライン (16分音符進行に合わせて左から右へスキャン) */}
              {isPlaying && isCurrentBar && (
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                  style={{
                    left: `${(currentStep16 / 16) * 100}%`
                  }}
                />
              )}

              {/* ドラムトラック表示 */}
              {track.type === 'drums' && (
                <div className="h-full flex items-center justify-center">
                  {(() => {
                    const block = track.drumBlocks?.find((b) => b.bar === bar);
                    if (!block) {
                      return (
                        <div className="w-full h-12 border border-dashed border-[#2b3347] rounded flex items-center justify-center text-[10px] text-gray-600 hover:border-purple-500/60 transition group cursor-pointer">
                          <span className="group-hover:text-purple-400">DnD ドロップ</span>
                        </div>
                      );
                    }
                    return (
                      <div
                        onDoubleClick={() => openDrumEditor(track.id, block)}
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
                              removeDrumBlock(track.id, block.id);
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
                  })()}
                </div>
              )}

              {/* リズムギター表示 (コード追従パルスバー) */}
              {track.type === 'rhythm_gt' && (
                <div className="h-full flex items-center justify-center">
                  <div className="w-full h-10 bg-red-950/30 border border-red-900/40 rounded px-1.5 py-1 flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-red-400/90 uppercase">
                      {track.rhythmStyle === 'power_chug_8th' ? 'CHUG x8' : 'STRUM x8'}
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
                </div>
              )}

              {/* ベース表示 (ルート追従) */}
              {track.type === 'bass' && (
                <div className="h-full flex items-center justify-center">
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
                </div>
              )}

              {/* リード / ボーカル / キーボードのノートアイテム表示 */}
              {(track.type === 'vocal' || track.type === 'lead_gt' || track.type === 'keys') && (
                <div className="h-full flex items-center relative min-h-[44px]">
                  {(() => {
                    const barNotes = track.notes?.filter((n) => n.bar === bar) || [];
                    if (barNotes.length === 0) {
                      if (track.type === 'keys') {
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
                        {barNotes.map((note) => {
                          const leftPct = (note.offsetBeats / 4) * 100;
                          const widthPct = Math.min(100 - leftPct, (note.durationBeats / 4) * 100);
                          // ピッチに応じた縦位置 (MIDI 48〜84)
                          const clampedPitch = Math.max(48, Math.min(84, note.pitch));
                          const topPct = 100 - ((clampedPitch - 48) / 36) * 80 - 15;

                          return (
                            <div
                              key={note.id}
                              className={`absolute h-3.5 rounded text-[8px] font-bold text-white flex items-center justify-center px-1 truncate shadow border border-white/20 ${theme.accent}`}
                              style={{
                                left: `${leftPct}%`,
                                width: `${Math.max(widthPct, 6)}%`,
                                top: `${Math.max(5, Math.min(75, topPct))}%`
                              }}
                              title={`[${note.lyric || '♪'}] Pitch: ${note.pitch}, Duration: ${note.durationBeats} beats`}
                            >
                              <span className="truncate leading-none">{track.type === 'vocal' ? (note.lyric || '♪') : '♪'}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

