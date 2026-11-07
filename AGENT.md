# AGENT.md - idchug 開発エージェント・コントリビューター向けガイドライン

本ドキュメントは、**idchug (Idol Chug Music Studio)** の設計思想、アーキテクチャ、音響合成パイプライン、コンポーネント構造、およびコーディング規約をまとめた開発ガイドです。

> [!IMPORTANT]
> **AI自己学習・ペアプログラミング知見:**  
> ペアプログラミングを通じて得られた具体的な教訓、失敗防止ルール、ユーザーの設計方針は **[AI_LEARNINGS.md](file:///c:/Users/user/repos/idchug/AI_LEARNINGS.md)** に蓄積されています。開発着手時は必ず両ファイルを参照してください。

---

## 1. プロジェクト概要

`idchug` は、ブラウザ上で動作する次世代の「アイドル×重低音Chug (Metal/Djent)」音楽制作スタジオ (Web DAW) です。
王道アイドルポップの哀愁キャッチーなメロディと、モダンメタル・Djent特有のタイトなパームミュート (P.M.) 重低音ギター、本格的なドラムビートを直感的な操作で融合・作曲できます。

### コアスタック
- **フロントエンド:** React 18, TypeScript, Tailwind CSS, Lucide React
- **ビルドツール:** Vite
- **状態管理:** Zustand (`src/store/useProjectStore.ts`)
- **オーディオエンジン:** Web Audio API (オシレーター、コンボルバー・リバーブ、サンプラー、ダイナミクス・コンプレッサー)
- **歌声合成:** UTAU単独音 (CV) 実録PCMサンプラー (`src/audio/vocal/`)

---

## 2. ディレクトリ構成

```text
idchug/
├── public/
│   └── voices/                # UTAU単独音WAVファイル群 (あ.wav, い.wav, ず.wav 等)
├── scripts/
│   └── setupVoices.cjs        # UTAUボイスバンクの展開・初期化スクリプト
├── src/
│   ├── audio/
│   │   ├── AudioEngine.ts     # マスターゲイン、トラックルーティング、スタジオリバーブ
│   │   ├── scheduler.ts       # 16分音符Lookahead高精度タイマースケジューラ
│   │   ├── chords.ts          # コード解析 (ルート音・構成音・ベースMIDI計算)
│   │   ├── vocal/             # 歌声エンジンモジュール群
│   │   │   ├── VocalSampler.ts       # 実音素PCMサンプラー (ピッチシフト・サステインループ)
│   │   │   ├── phonemeMap.ts         # 歌詞・ひらがな音素マッピング＆正規化
│   │   │   └── VocalSynthFallback.ts # WAV未ロード時のフォルマント＆子音合成フォールバック
│   │   └── synths/            # 楽器別音源
│   │       ├── GuitarSynth.ts # ディストーション＆キャビネットシミュレーション (Chug)
│   │       ├── BassSynth.ts   # 重低音ベースシンセ
│   │       ├── DrumSampler.ts # プロシージャル・ドラム音源 (Kick, Snare, HiHat等)
│   │       └── KeysSynth.ts   # エレピ / コードパッドシンセ
│   ├── components/
│   │   ├── Header.tsx         # 再生制御、BPM、小節操作、マスター音量、サンプル曲切替
│   │   ├── ChordTrack.tsx     # コード進行レーン (クリックでコード変更)
│   │   ├── TrackRow.tsx       # トラック行メインコンテナ
│   │   ├── track/             # トラック内部の分割UIコンポーネント
│   │   │   ├── TrackHeader.tsx       # 左パネル (Mute/Solo/Vol/Pan/+WAV/鼻歌/UTAUバッジ)
│   │   │   ├── DrumBar.tsx           # ドラムブロック表示＆16ステップ簡易波形
│   │   │   ├── NoteBar.tsx           # ノートアイテムプレビュー (ボーカル/リード/キー)
│   │   │   └── RhythmBar.tsx         # ギター/ベースのストラム・パルス表示
│   │   ├── DrumEditorModal.tsx # ドラム16ステップシーケンサーモーダル
│   │   └── HumRecordModal.tsx  # 鼻歌・マイク入力メロディピッチ検出モーダル
│   ├── store/
│   │   └── useProjectStore.ts # プロジェクト全体の一元状態管理
│   ├── types/
│   │   └── project.ts         # プロジェクト・トラック・ノート・ドラムデータ定義
│   └── utils/
│       ├── drumPresets.ts     # 各種メタル・アイドル系ドラムプリセット
│       └── sampleProjects.ts  # 初期デモ曲 (3曲: アイドルChug, メロコア, エモーショナル)
└── AGENT.md                   # 本ドキュメント
```

---

## 3. 音響パイプライン設計

### 3.1 歌声エンジン (`src/audio/vocal/`)
- **日本語歌詞対応 (CV音源):** 歌詞（「ず」「し」「て」「み」「ら」等）から即座に対応する単独音WAVを探索し直接発音。
- **基準音高 (Base MIDI):** 重音テト通常音源の基本周波数は **310.56Hz (MIDI 63 = D#4)**。
- **ピッチシフト:** `targetPlaybackRate = 2^((pitch - 63) / 12)`
- **サステインループ:** 定常部 (`0.18s 〜 0.52s`) をクロスフェードループし、音符長さに完全同期。
- **オンデマンド事前フェッチ (`preloadLyrics`):** 曲中のノートに含まれる音素を再生前にバックグラウンドで一括ロード。

### 3.2 ギター音源 (`GuitarSynth.ts`)
- ウェーブシェイパーによる非線形オーバードライブ＋ディストーション。
- 4x12 キャビネットシミュレータ (4.5kHz ローパス + 80Hz ハイパス + レゾナンス)。
- パームミュート (Chug) 時は減衰を極短 (0.12s) にし、タイトな低音アタックを実現。

### 3.3 リズム・スケジューリング (`scheduler.ts`)
- Web Audio API の `AudioContext.currentTime` を基準とした **Lookahead タイマー方式**。
- `setInterval` (25ms) で先行 100ms 先のイベントを Web Audio の内部キューに予約投入するため、ブラウザの描画負荷やタブのバックグラウンド遷移でもリズムが一切ブレない。

---

## 4. コーディング規約 & ベストプラクティス

1. **PowerShell / ターミナル環境:**
   - Windows環境での `npm` コマンド実行時は、権限エラーを避けるため `cmd /c "npm run ..."` を使用する。
2. **ボイスバンク (UTAU単独音) の管理:**
   - `public/voices/` は `.gitignore` の対象としてリポジトリにはコミットせず、リポジトリ本体を常に超軽量に保ちます。
   - `package.json` の `postinstall` スクリプトにより、初回 `npm install` 実行時に自動でセットアップされます。
   - 手動での再取得・更新は `npm run setup:voices` (コア音素) または `npm run setup:voices:full` (全音素) を使用します。
   - 母音・音素ファイルはすべてASCII英小文字のローマ字 (`a.wav`, `zu.wav`, `sho.wav` 等) にリネームされて配置されます。
3. **ファイルの肥大化防止:**
   - 1ファイルが 300 行を超えた場合は、責務（UI、状態管理、音響演算、データパース）ごとに適切なサブディレクトリへ分割する。
3. **AudioContext のライフサイクル:**
   - ユーザー操作（クリック・タップ）を起点として `audioEngine.init()` / `ctx.resume()` を呼び出す（ブラウザの自動再生ポリシー対策）。
4. **型安全性:**
   - `any` の使用を避け、`types/project.ts` に定義された厳密なインターフェースを使用する。

