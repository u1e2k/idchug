import React, { useState } from 'react';
import { TrackData } from '../types/project';
import { useProjectStore } from '../store/useProjectStore';
import { createBlockFromPreset } from '../utils/drumPresets';
import { TrackHeader } from './track/TrackHeader';
import { DrumBar } from './track/DrumBar';
import { NoteBar } from './track/NoteBar';
import { RhythmBar } from './track/RhythmBar';

interface TrackRowProps {
  track: TrackData;
  maxBar: number;
}

const TRACK_THEMES: Record<string, { border: string; bg: string; badge: string; icon: string; accent: string }> = {
  vocal: {
    border: 'border-l-rose-500',
    bg: 'bg-rose-950/20',
    badge: 'bg-rose-900/60 text-rose-300 border-rose-700/50',
    icon: '🎤',
    accent: 'bg-rose-600'
  },
  lead_gt: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-950/20',
    badge: 'bg-amber-900/60 text-amber-300 border-amber-700/50',
    icon: '🎸',
    accent: 'bg-amber-600'
  },
  rhythm_gt: {
    border: 'border-l-red-600',
    bg: 'bg-red-950/20',
    badge: 'bg-red-900/60 text-red-300 border-red-700/50',
    icon: '⚡',
    accent: 'bg-red-600'
  },
  bass: {
    border: 'border-l-cyan-500',
    bg: 'bg-cyan-950/20',
    badge: 'bg-cyan-900/60 text-cyan-300 border-cyan-700/50',
    icon: '🔊',
    accent: 'bg-cyan-600'
  },
  drums: {
    border: 'border-l-purple-500',
    bg: 'bg-purple-950/20',
    badge: 'bg-purple-900/60 text-purple-300 border-purple-700/50',
    icon: '🥁',
    accent: 'bg-purple-600'
  },
  keys: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-950/20',
    badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
    icon: '🎹',
    accent: 'bg-emerald-600'
  }
};

export const TrackRow: React.FC<TrackRowProps> = ({ track, maxBar }) => {
  const { isPlaying, currentBar, currentStep16, addDrumBlockToTrack } = useProjectStore();
  const [loadedVoiceMsg, setLoadedVoiceMsg] = useState<string | null>(null);

  const theme = TRACK_THEMES[track.type] || TRACK_THEMES.rhythm_gt;
  const barList = Array.from({ length: maxBar }, (_, i) => i + 1);

  // ドラムのドラッグ＆ドロップ処理
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

  const handleVoiceLoaded = (msg: string) => {
    setLoadedVoiceMsg(msg);
    setTimeout(() => setLoadedVoiceMsg(null), 4000);
  };

  return (
    <div className={`flex border-b border-[#1f2535] bg-[#121622] hover:bg-[#151a28] transition-colors ${theme.border} border-l-4`}>
      {/* トラックヘッダー (左コントロールパネル) */}
      <TrackHeader
        track={track}
        theme={theme}
        loadedVoiceMsg={loadedVoiceMsg}
        onVoiceLoaded={handleVoiceLoaded}
      />

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
              {/* 再生ヘッドライン */}
              {isPlaying && isCurrentBar && (
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                  style={{
                    left: `${(currentStep16 / 16) * 100}%`
                  }}
                />
              )}

              {/* ドラムトラック */}
              {track.type === 'drums' && (
                <div className="h-full flex items-center justify-center">
                  <DrumBar
                    trackId={track.id}
                    block={track.drumBlocks?.find((b) => b.bar === bar)}
                  />
                </div>
              )}

              {/* リズムギター / ベース */}
              {(track.type === 'rhythm_gt' || track.type === 'bass') && (
                <div className="h-full flex items-center justify-center">
                  <RhythmBar type={track.type} rhythmStyle={track.rhythmStyle} />
                </div>
              )}

              {/* ボーカル / リード / キーボード */}
              {(track.type === 'vocal' || track.type === 'lead_gt' || track.type === 'keys') && (
                <div className="h-full flex items-center relative min-h-[44px]">
                  <NoteBar
                    type={track.type}
                    notes={track.notes?.filter((n) => n.bar === bar) || []}
                    accentClass={theme.accent}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
