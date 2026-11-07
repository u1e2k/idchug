import React, { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { AutocorrelationPitchDetector } from '../audio/pitch/PitchDetector';
import { AudioToMidiService } from '../audio/pitch/interfaces';
import { NoteItem, TrackType } from '../types/project';
import { audioEngine } from '../audio/AudioEngine';
import { Note } from '@tonaljs/tonal';
import { Mic, Square, Check, X, Volume2, Sparkles, RefreshCw } from 'lucide-react';

export const HumRecordModal: React.FC = () => {
  const { humRecordTarget, closeHumRecorder, addNotesToTrack, project } = useProjectStore();

  const [isRecording, setIsRecording] = useState(false);
  const [currentPitchHz, setCurrentPitchHz] = useState<number | null>(null);
  const [currentNoteName, setCurrentNoteName] = useState<string>('--');
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // 変換結果
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedNotes, setTranscribedNotes] = useState<NoteItem[]>([]);
  const [targetTrackType, setTargetTrackType] = useState<TrackType>('lead_gt');
  const [startBar, setStartBar] = useState(1);

  // サービス切り替え用 (現在はAutocorrelation、将来的なPython AI APIの選択肢もUIに用意)
  const [selectedService, setSelectedService] = useState<'client_autocorr' | 'server_ai'>('client_autocorr');

  // メディアストリーム＆アナライザー参照
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  const cleanupAudio = () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (timerIntervalRef.current !== null) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const initMicPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const buffer = new Float32Array(analyser.fftSize);

      const loop = () => {
        analyser.getFloatTimeDomainData(buffer);
        const { pitchHz } = AutocorrelationPitchDetector.detectPitch(buffer, ctx.sampleRate);
        if (pitchHz && pitchHz > 70 && pitchHz < 1200) {
          setCurrentPitchHz(Math.round(pitchHz));
          const midi = Math.round(AutocorrelationPitchDetector.hzToMidi(pitchHz));
          const noteName = Note.fromMidi(midi);
          setCurrentNoteName(noteName || '--');
        } else {
          setCurrentPitchHz(null);
          setCurrentNoteName('--');
        }
        animFrameRef.current = requestAnimationFrame(loop);
      };

      loop();
    } catch (err: any) {
      console.warn('マイクの初期化に失敗しました:', err);
    }
  };

  useEffect(() => {
    if (humRecordTarget) {
      setTargetTrackType(humRecordTarget.trackType);
      setTranscribedNotes([]);
      setRecordingSeconds(0);
      initMicPreview();
    }
    return () => {
      cleanupAudio();
    };
  }, [humRecordTarget]);

  // 録音開始
  const handleStartRecording = () => {
    if (!mediaStreamRef.current) return;

    audioChunksRef.current = [];
    const recorder = new MediaRecorder(mediaStreamRef.current);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      await processAudioToMidi(blob);
    };

    recorder.start(100);
    setIsRecording(true);
    setRecordingSeconds(0);

    timerIntervalRef.current = window.setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  // 録音停止
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerIntervalRef.current !== null) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // 鼻歌音声からMIDI変換
  const processAudioToMidi = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      let service: AudioToMidiService;
      if (selectedService === 'client_autocorr') {
        service = new AutocorrelationPitchDetector();
      } else {
        // 将来のサーバーAI拡張フォールバック
        service = new AutocorrelationPitchDetector();
      }

      const notes = await service.transcribe(audioBlob, project.meta.bpm);

      // 開始小節のオフセットを適用
      const adjustedNotes = notes.map((n) => ({
        ...n,
        bar: n.bar + (startBar - 1)
      }));

      setTranscribedNotes(adjustedNotes);
    } catch (err: any) {
      alert(`ピッチ解析エラー: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 検出ノートの試聴
  const handlePreviewNotes = async () => {
    await audioEngine.init();
    const ctx = audioEngine.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const secondsPerBeat = 60 / project.meta.bpm;

    transcribedNotes.forEach((n) => {
      const noteTime = now + (n.bar - startBar) * 4 * secondsPerBeat + n.offsetBeats * secondsPerBeat;
      const durationSec = n.durationBeats * secondsPerBeat;
      if (targetTrackType === 'lead_gt') {
        audioEngine.guitarSynth.playNotes([n.pitch], noteTime, durationSec, 0.85, false, ctx.destination);
      } else if (targetTrackType === 'vocal') {
        audioEngine.worldVocoder.playNote(n.pitch, noteTime, durationSec, 0.9, ctx.destination);
      } else {
        audioEngine.keysSynth.playNotes([n.pitch], noteTime, durationSec, 0.8, ctx.destination);
      }
    });
  };

  // トラックへ挿入
  const handleInsertToTrack = () => {
    if (transcribedNotes.length === 0) return;
    // 挿入先トラックを見つける
    const targetTrack = project.tracks.find((t) => t.type === targetTrackType) || project.tracks[0];
    addNotesToTrack(targetTrack.id, transcribedNotes);
    closeHumRecorder();
  };

  if (!humRecordTarget) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-[#141824] border border-[#2e374d] rounded-xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* ヘッダー */}
        <div className="px-5 py-3.5 bg-[#181d2c] border-b border-[#2a3247] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-600 text-white shadow-md shadow-rose-950/50">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                <span>鼻歌入力 (Audio-to-MIDI)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/50 font-mono">
                  Pitch Detector
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">マイクに向かってハミングすると自動で音符化されます</p>
            </div>
          </div>
          <button
            onClick={closeHumRecorder}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* メイン録音エリア */}
        <div className="p-6 bg-[#0f121a] flex flex-col items-center">
          {/* リアルタイムピッチディスプレイ */}
          <div className="w-full bg-[#181d2a] border border-[#273044] rounded-xl p-4 mb-5 flex items-center justify-around shadow-inner">
            <div className="text-center">
              <span className="text-[10px] uppercase font-mono text-gray-400 block mb-0.5">CURRENT PITCH</span>
              <span className="text-3xl font-black font-mono text-rose-400 tracking-wider">
                {currentNoteName}
              </span>
            </div>
            <div className="h-10 w-[1px] bg-gray-800" />
            <div className="text-center">
              <span className="text-[10px] uppercase font-mono text-gray-400 block mb-0.5">FREQUENCY</span>
              <span className="text-xl font-bold font-mono text-gray-300">
                {currentPitchHz ? `${currentPitchHz} Hz` : '-- Hz'}
              </span>
            </div>
            <div className="h-10 w-[1px] bg-gray-800" />
            <div className="text-center">
              <span className="text-[10px] uppercase font-mono text-gray-400 block mb-0.5">TIME</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:
                {String(recordingSeconds % 60).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* 録音ボタン */}
          <div className="flex flex-col items-center gap-3">
            {isRecording ? (
              <button
                onClick={handleStopRecording}
                className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 text-white flex flex-col items-center justify-center gap-1 shadow-xl shadow-red-900/60 ring-4 ring-red-500/30 animate-pulse transition"
              >
                <Square className="w-6 h-6 fill-current" />
                <span className="text-[10px] font-bold">停止</span>
              </button>
            ) : (
              <button
                onClick={handleStartRecording}
                disabled={isProcessing}
                className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white flex flex-col items-center justify-center gap-1 shadow-xl shadow-rose-950/60 hover:scale-105 active:scale-95 transition disabled:opacity-50"
              >
                <Mic className="w-7 h-7" />
                <span className="text-[10px] font-bold">録音開始</span>
              </button>
            )}

            <span className="text-xs text-gray-400">
              {isRecording ? '録音中... メロディを口ずさんでください' : isProcessing ? '音声を解析中...' : '録音ボタンを押して歌ってください'}
            </span>
          </div>

          {/* 解析結果プレビュー */}
          {transcribedNotes.length > 0 && (
            <div className="w-full mt-6 bg-[#181d2a] border border-gray-700 rounded-lg p-3.5 animate-in fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>検出された音符: {transcribedNotes.length} 個</span>
                </span>
                <button
                  type="button"
                  onClick={handlePreviewNotes}
                  className="px-2.5 py-1 text-xs bg-[#242b3d] hover:bg-emerald-600 hover:text-white rounded text-gray-300 flex items-center gap-1 transition"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>試聴</span>
                </button>
              </div>

              {/* ノートプレビューミニリスト */}
              <div className="max-h-24 overflow-y-auto bg-[#0d1017] p-2 rounded text-[11px] font-mono text-gray-300 flex flex-wrap gap-1.5">
                {transcribedNotes.map((n, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-[#202738] border border-gray-700/60 text-amber-300"
                  >
                    {Note.fromMidi(n.pitch)} ({n.durationBeats}拍)
                  </span>
                ))}
              </div>

              {/* 挿入先トラック & 開始小節 */}
              <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">挿入先:</span>
                  <select
                    value={targetTrackType}
                    onChange={(e) => setTargetTrackType(e.target.value as any)}
                    className="bg-[#242c3d] text-gray-200 border border-gray-600 rounded px-2 py-1 outline-none"
                  >
                    <option value="lead_gt">Lead Gt (リードギター)</option>
                    <option value="vocal">Vocal (ボーカル)</option>
                    <option value="keys">Keys (キーボード)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-400">開始小節:</span>
                  <input
                    type="number"
                    min={1}
                    max={32}
                    value={startBar}
                    onChange={(e) => setStartBar(parseInt(e.target.value) || 1)}
                    className="w-14 bg-[#242c3d] text-gray-200 border border-gray-600 rounded px-2 py-1 text-center font-mono outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* エンジン切り替え (プラガブル設計) */}
          <div className="w-full mt-4 flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-800/60">
            <span>検出エンジン:</span>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value as any)}
              className="bg-transparent border border-gray-700 rounded px-2 py-0.5 text-gray-400 text-[10px] outline-none"
            >
              <option value="client_autocorr">ブラウザ自己相関 (Autocorrelation)</option>
              <option value="server_ai" disabled>
                AI Model / Spotify basic-pitch (将来拡張用)
              </option>
            </select>
          </div>
        </div>

        {/* フッター */}
        <div className="px-5 py-3 bg-[#181d2c] border-t border-[#2a3247] flex items-center justify-end gap-2">
          <button
            onClick={closeHumRecorder}
            className="px-4 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded transition"
          >
            キャンセル
          </button>
          <button
            onClick={handleInsertToTrack}
            disabled={transcribedNotes.length === 0}
            className="px-5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white rounded shadow-lg shadow-rose-950/60 flex items-center gap-1.5 transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>トラックに配置する</span>
          </button>
        </div>
      </div>
    </div>
  );
};

