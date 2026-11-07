import React, { useRef } from 'react';
import { Volume2, Mic, Upload, Check } from 'lucide-react';
import { TrackData } from '../../types/project';
import { useProjectStore } from '../../store/useProjectStore';
import { audioEngine } from '../../audio/AudioEngine';

interface TrackHeaderProps {
  track: TrackData;
  theme: {
    border: string;
    bg: string;
    badge: string;
    icon: string;
  };
  loadedVoiceMsg: string | null;
  onVoiceLoaded: (msg: string) => void;
}

export const TrackHeader: React.FC<TrackHeaderProps> = ({
  track,
  theme,
  loadedVoiceMsg,
  onVoiceLoaded
}) => {
  const {
    setTrackVolume,
    setTrackPan,
    toggleTrackMute,
    toggleTrackSolo,
    setRhythmStyle,
    openHumRecorder,
    clearTrackNotes
  } = useProjectStore();

  const voiceInputRef = useRef<HTMLInputElement>(null);

  const handleVoiceFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    await audioEngine.init();

    const loadedNames: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.toLowerCase().endsWith('.wav')) {
        try {
          const res = await audioEngine.vocalSampler.loadWavFile(file);
          loadedNames.push(`${res.phoneme}:${file.name}`);
        } catch (e: any) {
          console.error('WAVロードエラー:', e);
        }
      }
    }

    if (loadedNames.length > 0) {
      onVoiceLoaded(`WAV登録: ${loadedNames.join(', ')}`);
    }
  };

  return (
    <div className="w-56 min-w-[14rem] p-2.5 border-r border-[#22293b] bg-[#11141e] flex flex-col justify-between select-none sticky left-0 z-10 shadow-md">
      {/* トラック名 & 楽器バッジ */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-sm">{theme.icon}</span>
          <span className="text-xs font-bold text-gray-200 truncate">{track.name}</span>
        </div>

        {/* 鼻歌録音ボタン (Lead Gt) */}
        {track.type === 'lead_gt' && (
          <button
            onClick={() => openHumRecorder(track.id, track.type)}
            className="p-1 px-1.5 rounded bg-amber-900/40 hover:bg-amber-700 text-amber-300 hover:text-white border border-amber-700/40 text-[10px] flex items-center gap-1 font-bold transition shadow-sm"
            title="鼻歌入力でメロディをMIDIノート化"
          >
            <Mic className="w-3 h-3 text-amber-400" />
            <span>鼻歌</span>
          </button>
        )}

        {/* ボーカル: WAVボイス読み込み＆鼻歌録音 */}
        {track.type === 'vocal' && (
          <div className="flex items-center gap-1">
            <input
              type="file"
              ref={voiceInputRef}
              onChange={(e) => handleVoiceFiles(e.target.files)}
              accept=".wav,audio/wav"
              multiple
              className="hidden"
            />
            <button
              onClick={() => voiceInputRef.current?.click()}
              className="p-1 px-1.5 rounded bg-rose-950/70 hover:bg-rose-800 text-rose-300 hover:text-white border border-rose-700/50 text-[10px] flex items-center gap-0.5 font-bold transition shadow-sm"
              title="自作WAV音声やUTAU音源 (あ.wav 等) を読み込んで差し替え"
            >
              <Upload className="w-3 h-3 text-rose-400" />
              <span>+WAV</span>
            </button>
            <button
              onClick={() => openHumRecorder(track.id, track.type)}
              className="p-1 px-1.5 rounded bg-rose-900/40 hover:bg-rose-700 text-rose-300 hover:text-white border border-rose-700/40 text-[10px] flex items-center gap-1 font-bold transition shadow-sm"
              title="鼻歌入力でメロディをMIDIノート化"
            >
              <Mic className="w-3 h-3 text-rose-400" />
              <span>鼻歌</span>
            </button>
          </div>
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

      {/* ボーカル音源バッジ / ロード通知 */}
      {track.type === 'vocal' && (
        <div className="mb-1.5 text-[9px] px-1.5 py-0.5 rounded bg-rose-950/40 border border-rose-900/40 text-rose-300 truncate flex items-center justify-between">
          <span className="truncate">{loadedVoiceMsg || '🎤 UTAU 重音テト (単独音WAV)'}</span>
          <span className="text-[8px] bg-rose-900/60 text-rose-200 px-1 rounded ml-1">Loaded</span>
        </div>
      )}

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
        <div className="flex-1 flex items-center">
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
  );
};
