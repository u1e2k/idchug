import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Timeline } from './components/Timeline';
import { DrumPalette } from './components/DrumPalette';
import { DrumEditorModal } from './components/DrumEditorModal';
import { HumRecordModal } from './components/HumRecordModal';
import { useProjectStore } from './store/useProjectStore';
import { importProjectFromFile } from './utils/fileIO';
import { UploadCloud } from 'lucide-react';

export const App: React.FC = () => {
  const loadProject = useProjectStore((s) => s.loadProject);
  const [isDragOverFile, setIsDragOverFile] = useState(false);

  useEffect(() => {
    // グローバルキーボードショートカット (Space: 再生/停止)
    const handleKeyDown = (e: KeyboardEvent) => {
      // inputやtextarea、selectにフォーカスがある時は無視
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        const state = useProjectStore.getState();
        if (state.isPlaying) {
          state.pause();
        } else {
          state.play();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 画面全体の .idchug ファイルドロップ処理
  const handleDragOver = (e: React.DragEvent) => {
    // 内部のドラムプリセットDnDと衝突しないよう、ファイルがドラッグされているか判定
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      setIsDragOverFile(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // 画面外に出た場合
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOverFile(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      setIsDragOverFile(false);
      const file = e.dataTransfer.files[0];
      try {
        const loaded = await importProjectFromFile(file);
        loadProject(loaded);
      } catch (err: any) {
        alert(`ファイル読み込みエラー: ${err.message}`);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col h-screen w-screen overflow-hidden bg-[#0c0e15] text-gray-100 select-none relative font-sans"
    >
      {/* ヘッダー */}
      <Header />

      {/* メインタイムライン */}
      <Timeline />

      {/* ドラムプリセットパレット */}
      <DrumPalette />

      {/* モーダル群 */}
      <DrumEditorModal />
      <HumRecordModal />

      {/* ファイルドラッグ＆ドロップ時の全画面オーバーレイ */}
      {isDragOverFile && (
        <div className="absolute inset-0 z-50 bg-red-950/80 border-4 border-dashed border-red-500 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-100">
          <UploadCloud className="w-16 h-16 text-amber-400 mb-3 animate-bounce" />
          <h2 className="text-2xl font-black text-white tracking-wide">
            .idchug プロジェクトをドロップして読み込み
          </h2>
          <p className="text-sm text-gray-300 mt-1">
            画面上にファイルを離すと、プロジェクトが瞬時に復元されます
          </p>
        </div>
      )}
    </div>
  );
};

export default App;
