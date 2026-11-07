---
name: idchug-engine
description: "idchug (アイドル×重低音Chug Web DAW) のWeb Audio API音響パイプライン、UTAU単独音連携、高精度スケジューラ、およびモジュール設計ガイドライン"
---

# idchug-engine スキル

このスキルは、**idchug (Idol Chug Music Studio)** におけるWeb Audio API音響エンジン、UTAU音声合成パイプライン、およびコンポーネント設計を理解し、安全に拡張・メンテナンスするための開発支援ガイドです。

---

## 1. 歌声合成パイプライン (UTAU CV サンプラー)

### ファイル構造
- `src/audio/vocal/phonemeMap.ts`: 歌詞から音素（ひらがなCV）の正規化・母音抽出
- `src/audio/vocal/VocalSampler.ts`: 実音素WAVキャッシュ、ピッチシフト、サステインループ
- `src/audio/vocal/VocalSynthFallback.ts`: オフライン・WAV未ロード時のフォルマント合成

### 重要な音響定数
- **基準周波数 (重音テト単独音):** `310.56 Hz` (MIDIノート `63` = `D#4`)
- **再生速度計算 (PlaybackRate):**
  ```ts
  const semitoneDiff = pitch - 63;
  const targetPlaybackRate = Math.pow(2, semitoneDiff / 12);
  ```
- **サステインループ区間:**
  ```ts
  source.loop = true;
  source.loopStart = Math.min(0.18, bufDuration * 0.25);
  source.loopEnd = Math.min(0.52, Math.max(source.loopStart + 0.1, bufDuration - 0.05));
  ```
- **事前フェッチ (`preloadLyrics`):**
  小節やプロジェクトが変更された際、ノートの歌詞から必要なWAV（例: `ず.wav`, `て.wav`, `ら.wav`）を非同期で先読みし、再生時の発音遅延をゼロにします。

---

## 2. リズム＆ギターエンジン (Chug & Djent)

### タイミングスケジューラ (`scheduler.ts`)
- `AudioContext.currentTime` を基準とした **Lookahead タイマー方式**。
- `setInterval` (25ms) で先行 100ms 先の音符イベントを Web Audio の内部キューに投入。
- UIの再生ヘッド描画には `requestAnimationFrame` を併用し、スムーズな60FPS走査を実現。

### パームミュート (Chug) のサウンド設計
- 8分音符タイトな刻み (`power_chug_8th`)：
  - アタック重視のディストーション（波形クリッピング）。
  - ディケイ `0.10s 〜 0.14s` の超タイト減衰。
  - キャビネットシミュレータによる 80Hz 重低音ブーストと 4.5kHz 以上のロールオフ。

---

## 3. コンポーネント分割ルール (`src/components/track/`)

トラック行 (`TrackRow.tsx`) は肥大化を避けるため、以下の4つのサブモジュールに分割して管理します：

1. **`TrackHeader.tsx`**: 左側の固定コントロール部（トラック名、Vol、Pan、Mute、Solo、+WAV、鼻歌、UTAU音源バッジ）
2. **`DrumBar.tsx`**: ドラム小節ブロック描画、16ステップ簡易波形、DnD、ダブルクリック編集
3. **`NoteBar.tsx`**: ボーカル・リードギター・キーボードのノートアイテム描画（ピッチと長さに応じたバー表示、歌詞表示）
4. **`RhythmBar.tsx`**: リズムギター・ベースの8分刻みパルスバー描画

---

## 4. ビルド & 実行コマンド
- 初回依存インストール (同時にボイスバンクも自動取得):
  ```powershell
  cmd /c "npm install"
  ```
- Windows環境でのビルド確認:
  ```powershell
  cmd /c "npm run build"
  ```
- 開発サーバー起動:
  ```powershell
  cmd /c "npm run dev"
  ```
- 手動ボイスバンクセットアップ:
  ```powershell
  cmd /c "npm run setup:voices"
  ```

