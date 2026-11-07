import { create } from 'zustand';
import { IdChugProject, TrackData, DrumBlock, NoteItem, TrackType, RhythmGtStyle, ProjectMeta } from '../types/project';
import { scheduler } from '../audio/scheduler';
import { audioEngine } from '../audio/AudioEngine';
import { createBlockFromPreset } from '../utils/drumPresets';
import { DEMO_PROJECT_1 } from '../utils/sampleProjects';

interface TapTempoState {
  tapTimes: number[];
}

interface ProjectState {
  project: IdChugProject;
  isPlaying: boolean;
  currentBar: number;
  currentBeat: number;
  currentStep16: number;

  // モーダル管理
  drumEditTarget: { trackId: string; block: DrumBlock } | null;
  humRecordTarget: { trackId: string; trackType: TrackType } | null;

  // タップテンポ
  tapTimes: number[];

  // マスター音量
  masterVolume: number;
  setMasterVolume: (vol: number) => void;

  // アクション
  initProject: (newProject?: IdChugProject) => void;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (bar: number) => void;
  setBpm: (bpm: number) => void;
  handleTapTempo: () => void;
  setProjectMeta: (meta: Partial<ProjectMeta>) => void;

  // コード進行
  setBarChord: (bar: number, chord: string) => void;
  addBar: () => void;
  removeLastBar: () => void;

  // トラックミキサー
  setTrackVolume: (trackId: string, volume: number) => void;
  setTrackPan: (trackId: string, pan: number) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;
  setRhythmStyle: (trackId: string, style: RhythmGtStyle) => void;

  // ドラムブロック
  addDrumBlockToTrack: (trackId: string, block: DrumBlock) => void;
  updateDrumBlock: (trackId: string, updatedBlock: DrumBlock) => void;
  removeDrumBlock: (trackId: string, blockId: string) => void;

  // ノート編集 (Lead, Vocal, Keys)
  addNotesToTrack: (trackId: string, notes: NoteItem[]) => void;
  clearTrackNotes: (trackId: string) => void;

  // モーダルオープン/クローズ
  openDrumEditor: (trackId: string, block: DrumBlock) => void;
  closeDrumEditor: () => void;
  openHumRecorder: (trackId: string, trackType: TrackType) => void;
  closeHumRecorder: () => void;

  // ファイル復元
  loadProject: (project: IdChugProject) => void;
}

const DEFAULT_PROJECT: IdChugProject = JSON.parse(JSON.stringify(DEMO_PROJECT_1));

export const useProjectStore = create<ProjectState>((set, get) => {
  // スケジューラの状態変化コールバック設定
  scheduler.setOnStateChange((bar, beat, step16, isPlaying) => {
    set({
      currentBar: bar,
      currentBeat: beat,
      currentStep16: step16,
      isPlaying
    });
  });

  // 初期プロジェクトをスケジューラへ即座にセット
  scheduler.setProject(DEFAULT_PROJECT);

  // マスター音量の永続化読み込み
  const savedMasterVol = (() => {
    try {
      const v = localStorage.getItem('idchug_master_volume');
      if (v !== null) {
        const parsed = parseFloat(v);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) return parsed;
      }
    } catch {}
    return 0.85;
  })();

  audioEngine.setMasterVolume(savedMasterVol);

  return {
    project: DEFAULT_PROJECT,
    isPlaying: false,
    currentBar: 1,
    currentBeat: 0,
    currentStep16: 0,
    drumEditTarget: null,
    humRecordTarget: null,
    tapTimes: [],
    masterVolume: savedMasterVol,

    setMasterVolume: (vol: number) => {
      audioEngine.setMasterVolume(vol);
      try {
        localStorage.setItem('idchug_master_volume', vol.toString());
      } catch {}
      set({ masterVolume: vol });
    },

    initProject: (customProject) => {
      const proj = customProject || DEFAULT_PROJECT;
      scheduler.setProject(proj);
      set({ project: proj });
    },

    play: async () => {
      const { project, currentBar } = get();
      scheduler.setProject(project);
      await scheduler.start(currentBar);
      set({ isPlaying: true });
    },

    pause: () => {
      scheduler.pause();
      set({ isPlaying: false });
    },

    stop: () => {
      scheduler.stop();
      set({ isPlaying: false, currentBar: 1, currentBeat: 0, currentStep16: 0 });
    },

    seek: (bar: number) => {
      scheduler.seek(bar);
      set({ currentBar: bar, currentBeat: 0, currentStep16: 0 });
    },

    setBpm: (bpm: number) => {
      const clamped = Math.max(40, Math.min(280, Math.round(bpm)));
      scheduler.setBpm(clamped);
      set((state) => ({
        project: {
          ...state.project,
          meta: { ...state.project.meta, bpm: clamped }
        }
      }));
    },

    handleTapTempo: () => {
      const now = performance.now();
      const { tapTimes, setBpm } = get();

      // 直近2.5秒以内のタップのみ残す
      const recentTaps = tapTimes.filter((t) => now - t < 2500);
      recentTaps.push(now);

      if (recentTaps.length >= 2) {
        // 直近最大4打の間隔の平均を算出
        const intervals: number[] = [];
        const startIdx = Math.max(0, recentTaps.length - 4);
        for (let i = startIdx + 1; i < recentTaps.length; i++) {
          intervals.push(recentTaps[i] - recentTaps[i - 1]);
        }
        const avgIntervalMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        if (avgIntervalMs > 0) {
          const calculatedBpm = Math.round(60000 / avgIntervalMs);
          setBpm(calculatedBpm);
        }
      }

      set({ tapTimes: recentTaps });
    },

    setProjectMeta: (metaUpdate) => {
      set((state) => {
        const updated = {
          ...state.project,
          meta: { ...state.project.meta, ...metaUpdate }
        };
        scheduler.setProject(updated);
        return { project: updated };
      });
    },

    setBarChord: (bar: number, chord: string) => {
      set((state) => {
        const existingIdx = state.project.chords.findIndex((c) => c.bar === bar);
        let newChords = [...state.project.chords];
        if (existingIdx >= 0) {
          newChords[existingIdx] = { bar, chord };
        } else {
          newChords.push({ bar, chord });
          newChords.sort((a, b) => a.bar - b.bar);
        }
        const updatedProject = { ...state.project, chords: newChords };
        scheduler.setProject(updatedProject);
        return { project: updatedProject };
      });
    },

    addBar: () => {
      set((state) => {
        const maxBar = Math.max(...state.project.chords.map((c) => c.bar), 0);
        const newBarNum = maxBar + 1;
        // 前の小節のコードを引き継ぐ
        const lastChord = state.project.chords.find((c) => c.bar === maxBar)?.chord || 'Am';
        const newChords = [...state.project.chords, { bar: newBarNum, chord: lastChord }];
        const updated = { ...state.project, chords: newChords };
        scheduler.setProject(updated);
        return { project: updated };
      });
    },

    removeLastBar: () => {
      set((state) => {
        if (state.project.chords.length <= 2) return state; // 最低2小節は保持
        const maxBar = Math.max(...state.project.chords.map((c) => c.bar));
        const newChords = state.project.chords.filter((c) => c.bar !== maxBar);

        // トラック内の該当小節のノートやドラムも整理
        const newTracks = state.project.tracks.map((t) => ({
          ...t,
          notes: t.notes?.filter((n) => n.bar !== maxBar),
          drumBlocks: t.drumBlocks?.filter((b) => b.bar !== maxBar)
        }));

        const updated = { ...state.project, chords: newChords, tracks: newTracks };
        scheduler.setProject(updated);
        return { project: updated };
      });
    },

    setTrackVolume: (trackId: string, volume: number) => {
      set((state) => {
        const newTracks = state.project.tracks.map((t) => (t.id === trackId ? { ...t, volume } : t));
        const updated = { ...state.project, tracks: newTracks };
        const anySolo = newTracks.some((t) => t.isSolo);
        const trk = newTracks.find((t) => t.id === trackId);
        if (trk) {
          audioEngine.updateTrackParams(trackId, {
            volume: trk.volume,
            pan: trk.pan,
            isMuted: trk.isMuted,
            isSolo: trk.isSolo,
            anySolo
          });
        }
        return { project: updated };
      });
    },

    setTrackPan: (trackId: string, pan: number) => {
      set((state) => {
        const newTracks = state.project.tracks.map((t) => (t.id === trackId ? { ...t, pan } : t));
        const updated = { ...state.project, tracks: newTracks };
        const anySolo = newTracks.some((t) => t.isSolo);
        const trk = newTracks.find((t) => t.id === trackId);
        if (trk) {
          audioEngine.updateTrackParams(trackId, {
            volume: trk.volume,
            pan: trk.pan,
            isMuted: trk.isMuted,
            isSolo: trk.isSolo,
            anySolo
          });
        }
        return { project: updated };
      });
    },

    toggleTrackMute: (trackId: string) => {
      set((state) => {
        const newTracks = state.project.tracks.map((t) => (t.id === trackId ? { ...t, isMuted: !t.isMuted } : t));
        const updated = { ...state.project, tracks: newTracks };
        const anySolo = newTracks.some((t) => t.isSolo);
        newTracks.forEach((trk) => {
          audioEngine.updateTrackParams(trk.id, {
            volume: trk.volume,
            pan: trk.pan,
            isMuted: trk.isMuted,
            isSolo: trk.isSolo,
            anySolo
          });
        });
        scheduler.setProject(updated);
        return { project: updated };
      });
    },

    toggleTrackSolo: (trackId: string) => {
      set((state) => {
        const newTracks = state.project.tracks.map((t) => (t.id === trackId ? { ...t, isSolo: !t.isSolo } : t));
        const updated = { ...state.project, tracks: newTracks };
        const anySolo = newTracks.some((t) => t.isSolo);
        newTracks.forEach((trk) => {
          audioEngine.updateTrackParams(trk.id, {
            volume: trk.volume,
            pan: trk.pan,
            isMuted: trk.isMuted,
            isSolo: trk.isSolo,
            anySolo
          });
        });
        scheduler.setProject(updated);
        return { project: updated };
      });
    },

    setRhythmStyle: (trackId: string, style: RhythmGtStyle) => {
      set((state) => {
        const newTracks = state.project.tracks.map((t) => (t.id === trackId ? { ...t, rhythmStyle: style } : t));
        const updated = { ...state.project, tracks: newTracks };
        scheduler.setProject(updated);
        return { project: updated };
      });
    },

    addDrumBlockToTrack: (trackId: string, block: DrumBlock) => {
      set((state) => {
        const newTracks = state.project.tracks.map((t) => {
          if (t.id !== trackId) return t;
          const existingBlocks = t.drumBlocks || [];
          // 同じ小節にすでにブロックがある場合は置換
          const filtered = existingBlocks.filter((b) => b.bar !== block.bar);
          return {
            ...t,
            drumBlocks: [...filtered, block].sort((a, b) => a.bar - b.bar)
          };
        });
        const updated = { ...state.project, tracks: newTracks };
        scheduler.setProject(updated);
        return { project: updated };
      });
    },

    updateDrumBlock: (trackId: string, updatedBlock: DrumBlock) => {
      set((state) => {
        const newTracks = state.project.tracks.map((t) => {
          if (t.id !== trackId) return t;
          const blocks = (t.drumBlocks || []).map((b) => (b.id === updatedBlock.id ? updatedBlock : b));
          return { ...t, drumBlocks: blocks };
        });
        const updated = { ...state.project, tracks: newTracks };
        scheduler.setProject(updated);
        return { project: updated, drumEditTarget: null };
      });
    },

    removeDrumBlock: (trackId: string, blockId: string) => {
      set((state) => {
        const newTracks = state.project.tracks.map((t) => {
          if (t.id !== trackId) return t;
          return {
            ...t,
            drumBlocks: (t.drumBlocks || []).filter((b) => b.id !== blockId)
          };
        });
        const updated = { ...state.project, tracks: newTracks };
        scheduler.setProject(updated);
        return { project: updated };
      });
    },

    addNotesToTrack: (trackId: string, notes: NoteItem[]) => {
      set((state) => {
        const newTracks = state.project.tracks.map((t) => {
          if (t.id !== trackId) return t;
          return {
            ...t,
            notes: [...(t.notes || []), ...notes]
          };
        });
        const updated = { ...state.project, tracks: newTracks };
        scheduler.setProject(updated);
        return { project: updated };
      });
    },

    clearTrackNotes: (trackId: string) => {
      set((state) => {
        const newTracks = state.project.tracks.map((t) => (t.id === trackId ? { ...t, notes: [] } : t));
        const updated = { ...state.project, tracks: newTracks };
        scheduler.setProject(updated);
        return { project: updated };
      });
    },

    openDrumEditor: (trackId: string, block: DrumBlock) => {
      set({ drumEditTarget: { trackId, block: JSON.parse(JSON.stringify(block)) } });
    },

    closeDrumEditor: () => {
      set({ drumEditTarget: null });
    },

    openHumRecorder: (trackId: string, trackType: TrackType) => {
      set({ humRecordTarget: { trackId, trackType } });
    },

    closeHumRecorder: () => {
      set({ humRecordTarget: null });
    },

    loadProject: (loadedProject: IdChugProject) => {
      scheduler.stop();
      scheduler.setProject(loadedProject);
      set({
        project: loadedProject,
        isPlaying: false,
        currentBar: 1,
        currentBeat: 0,
        currentStep16: 0
      });
    }
  };
});

