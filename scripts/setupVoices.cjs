/**
 * setupVoices.cjs - UTAU単独音ボイスバンク (重音テト) 自動セットアップ＆ローマ字リネームスクリプト
 * 
 * 使い方:
 *   node scripts/setupVoices.cjs [--full]
 * 
 * オプション:
 *   (引数なし): デモ曲で使われる主要音素 (39ファイル / ~2.7MB) をローマ字名で配置
 *   --full   : 全音素ライブラリ (全142音素) をローマ字名で配置
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TETO_ZIP_URL = 'https://kasaneteto.jp/assets/download/utau/TETO-tandoku-100619.zip';
const outDir = path.resolve(__dirname, '..', 'public', 'voices');
const tempDir = path.resolve(__dirname, '..', 'temp_voices');
const zipPath = path.join(tempDir, 'teto.zip');

const isFull = process.argv.includes('--full');

// ひらがな -> ローマ字標準マッピングテーブル
const KANA_TO_ROMAJI = {
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o', 'ん': 'n',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'を': 'wo',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  // 拗音
  'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
  'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
  'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
  'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
  'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
  'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
  'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
  'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
  'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
  'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
  'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo'
};

// デモ曲で使われる主要音素 (ひらがな)
const DEMO_KANAS = new Set([
  'あ', 'い', 'う', 'え', 'お', 'ん',
  'か', 'き', 'く', 'こ',
  'さ', 'し', 'す', 'そ',
  'た', 'て', 'と',
  'な', 'ね', 'の',
  'は', 'ひ', 'へ',
  'ま', 'み', 'む',
  'や', 'ゆ',
  'ら', 'り',
  'わ', 'を',
  'ば', 'ぱ', 'ぼ',
  'じ', 'ず', 'で', 'ど',
  'しょ'
]);

async function main() {
  console.log(`🎙️ [idchug] UTAU重音テト (単独音) セットアップを開始します...`);
  console.log(`モード: ${isFull ? 'フルセット (全音素)' : '軽量コアセット (デモ推奨: 39音素)'}`);
  console.log(`ファイル命名規則: ASCII英小文字ローマ字 (a.wav, zu.wav, sho.wav 等)`);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // 1. アーカイブのダウンロード
  if (!fs.existsSync(zipPath)) {
    console.log(`⬇️ 公式アーカイブをダウンロード中 (${TETO_ZIP_URL})...`);
    execSync(`curl.exe -L -o "${zipPath}" "${TETO_ZIP_URL}"`, { stdio: 'inherit' });
  } else {
    console.log(`📦 ダウンロード済みアーカイブを使用: ${zipPath}`);
  }

  // 2. 解凍
  const extractDir = path.join(tempDir, 'extracted');
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true });
    console.log(`📂 アーカイブを展開中...`);
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force"`, { stdio: 'inherit' });
  }

  // 3. 単独音フォルダを探索
  let wavDir = '';
  const findTandoku = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name.includes('単独音')) {
          wavDir = full;
          return;
        }
        findTandoku(full);
        if (wavDir) return;
      }
    }
  };
  findTandoku(extractDir);

  if (!wavDir) {
    console.error('❌ 単独音フォルダが見つかりませんでした。');
    process.exit(1);
  }

  // 4. ファイル配置 (ひらがな -> ローマ字にリネーム)
  // 既存の古いひらがなファイルを一掃
  const oldFiles = fs.readdirSync(outDir);
  for (const ofile of oldFiles) {
    fs.unlinkSync(path.join(outDir, ofile));
  }

  const files = fs.readdirSync(wavDir);
  let deployedCount = 0;
  let totalBytes = 0;

  for (const f of files) {
    if (!f.endsWith('.wav')) continue;
    const kana = f.replace(/\.wav$/, '').replace(/^_/, '');

    if (!isFull && !DEMO_KANAS.has(kana)) {
      continue;
    }

    const romaji = KANA_TO_ROMAJI[kana];
    if (!romaji) continue;

    const src = path.join(wavDir, f);
    const dest = path.join(outDir, `${romaji}.wav`);
    fs.copyFileSync(src, dest);
    deployedCount++;
    totalBytes += fs.statSync(dest).size;
  }

  // 一時フォルダ削除
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {
    // ignore
  }

  console.log(`✅ セットアップ完了！`);
  console.log(`- 配置ファイル: ${deployedCount} 個 (${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`- 出力先: ${outDir}`);
}

main().catch((err) => {
  console.warn('⚠️ [idchug] 音声ボイスバンクの自動取得に失敗しました (オフライン等の可能性があります):', err.message);
  console.warn('⚠️ アプリは合成音素フォールバックで動作します。後から `npm run setup:voices` で取得可能です。');
  // npm install やビルドを妨げないよう正常終了
  process.exit(0);
});
