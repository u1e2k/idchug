import React, { useRef } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { exportProjectToFile, importProjectFromFile } from '../utils/fileIO';
import { SAMPLE_PROJECTS } from '../utils/sampleProjects';
import { Play, Pause, Square, Download, Upload, Activity, Flame, Plus, Minus, Sparkles, FolderOpen, Volume2, VolumeX } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    project,
    isPlaying,
    currentBar,
    currentBeat,
    currentStep16,
    play,
    pause,
    stop,
    setBpm,
    handleTapTempo,
    setProjectMeta,
    loadProject,
    masterVolume,
    setMasterVolume
  } = useProjectStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportProjectToFile(project);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const loaded = await importProjectFromFile(file);
      loadProject(loaded);
    } catch (err: any) {
      alert(`プロジェクト読み込みエラー: ${err.message}`);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleSelectSample = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    const found = SAMPLE_PROJECTS.find((p) => p.id === selectedId);
    if (found) {
      if (isPlaying) stop();
      loadProject(JSON.parse(JSON.stringify(found.project)));
    }
    // セレクトボックスの表示をリセット
    e.target.value = '';
  };

  return (
    <header className="bg-[#12151f] border-b border-[#252b3b] px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 select-none shadow-md">
      {/* ロゴ & タイトル */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-xl tracking-wider px-3 py-1 rounded shadow-lg shadow-red-950/40">
          <Flame className="w-5 h-5 text-amber-300 animate-pulse" />
          <span>idchug</span>
        </div>
        <div className="flex flex-col">
          <input
            type="text"
            value={project.meta.title}
            onChange={(e) => setProjectMeta({ title: e.target.value })}
            className="bg-transparent border-b border-transparent hover:border-gray-600 focus:border-red-500 text-sm font-semibold text-gray-200 outline-none px-1 py-0.5 transition"
            placeholder="無題のスケッチ"
            title="曲名をクリックして編集"
          />
          <span className="text-[10px] text-gray-500 px-1 font-mono">BAND SEQUENCER DAW</span>
        </div>
      </div>

      {/* トランスポート (Play / Pause / Stop / Bar表示) */}
      <div className="flex items-center gap-3 bg-[#191e2b] px-3 py-1.5 rounded-lg border border-[#2d3448]">
        {/* 再生/一時停止 */}
        {isPlaying ? (
          <button
            onClick={pause}
            className="p-2 rounded bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold transition flex items-center justify-center shadow"
            title="一時停止 (Space)"
          >
            <Pause className="w-4 h-4 fill-current" />
          </button>
        ) : (
          <button
            onClick={play}
            className="p-2 rounded bg-red-600 hover:bg-red-500 text-white font-bold transition flex items-center justify-center shadow shadow-red-900/50"
            title="再生 (Space)"
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </button>
        )}

        {/* 停止 */}
        <button
          onClick={stop}
          className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition flex items-center justify-center"
          title="先頭に戻る"
        >
          <Square className="w-4 h-4" />
        </button>

        {/* 再生位置インジケーター */}
        <div className="font-mono text-center px-3 py-0.5 bg-[#0e1118] border border-[#262c3d] rounded text-emerald-400 font-bold text-sm tracking-widest min-w-[110px]">
          <span>{String(currentBar).padStart(2, '0')}</span>
          <span className="text-gray-600">:</span>
          <span>{Math.floor(currentBeat) + 1}</span>
          <span className="text-gray-600">:</span>
          <span className="text-xs text-emerald-500">{(currentStep16 % 4) + 1}</span>
        </div>
      </div>

      {/* BPM & タップテンポ */}
      <div className="flex items-center gap-2 bg-[#191e2b] px-3 py-1.5 rounded-lg border border-[#2d3448]">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">BPM</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setBpm(project.meta.bpm - 1)}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
            title="-1 BPM"
          >
            <Minus className="w-3 h-3" />
          </button>
          <input
            type="number"
            min={40}
            max={280}
            value={project.meta.bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-14 bg-[#0e1118] text-amber-400 font-mono font-bold text-center border border-[#2a3042] rounded py-0.5 text-sm focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={() => setBpm(project.meta.bpm + 1)}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
            title="+1 BPM"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* TAP ボタン */}
        <button
          onClick={handleTapTempo}
          className="ml-1 px-2.5 py-1 text-xs font-bold bg-[#262d3f] hover:bg-red-700/80 active:scale-95 text-gray-200 hover:text-white rounded border border-gray-600/40 transition flex items-center gap-1"
          title="リズムに合わせて数回クリックでテンポ測定"
        >
          <Activity className="w-3.5 h-3.5 text-red-400" />
          <span>TAP</span>
        </button>
      </div>

      {/* マスター音量 (全体ボリューム) */}
      <div className="flex items-center gap-2 bg-[#191e2b] px-3 py-1.5 rounded-lg border border-[#2d3448]">
        <button
          onClick={() => setMasterVolume(masterVolume > 0 ? 0 : 0.85)}
          className="text-gray-400 hover:text-white transition"
          title={masterVolume > 0 ? "ミュート" : "ミュート解除"}
        >
          {masterVolume > 0 ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-red-400" />
          )}
        </button>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">MASTER</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={masterVolume}
          onChange={(e) => setMasterVolume(Number(e.target.value))}
          className="w-20 accent-emerald-500 cursor-pointer h-1.5 bg-[#0e1118] rounded"
          title={`マスター音量: ${Math.round(masterVolume * 100)}%`}
        />
        <span className="text-[11px] font-mono font-bold text-emerald-400 w-8 text-right">
          {Math.round(masterVolume * 100)}%
        </span>
      </div>

      {/* サンプル曲 & ファイル操作 */}
      <div className="flex items-center gap-2">
        {/* サンプル曲プリセット選択 */}
        <div className="relative flex items-center bg-[#191f2d] border border-amber-500/40 hover:border-amber-400 rounded px-2.5 py-1 transition group shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 mr-1.5 shrink-0 animate-pulse" />
          <select
            defaultValue=""
            onChange={handleSelectSample}
            className="bg-transparent text-xs font-bold text-amber-300 hover:text-amber-200 outline-none cursor-pointer pr-1"
            title="用意されたサンプル曲を読み込みます"
          >
            <option value="" disabled className="bg-[#141824] text-gray-400">
              サンプル曲を読み込む...
            </option>
            {SAMPLE_PROJECTS.map((sample) => (
              <option key={sample.id} value={sample.id} className="bg-[#141824] text-gray-200">
                {sample.name}
              </option>
            ))}
          </select>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".idchug,application/json"
          className="hidden"
        />
        <button
          onClick={handleImportClick}
          className="px-3 py-1.5 text-xs font-semibold bg-[#1e2433] hover:bg-[#283044] text-gray-300 hover:text-white rounded border border-[#323b50] transition flex items-center gap-1.5 shadow-sm"
          title=".idchug プロジェクトファイルを開く"
        >
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
          <span>開く</span>
        </button>
        <button
          onClick={handleExport}
          className="px-3 py-1.5 text-xs font-semibold bg-[#1e2433] hover:bg-red-800/80 text-gray-300 hover:text-white rounded border border-[#323b50] transition flex items-center gap-1.5 shadow-sm"
          title="プロジェクトを .idchug ファイルとして保存"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span>保存 (.idchug)</span>
        </button>
      </div>
    </header>
  );
};

