/**
 * phonemeMap.ts - 日本語歌詞・音素マッピング＆ローマ字正規化ユーティリティ
 * 
 * 歌詞 (ひらがな・カタカナ) から、安全なASCIIファイル名 (ローマ字: "a", "ka", "shi", "zu", "sho" 等)
 * およびフォールバック母音・子音を解決します。
 */

export type Vowel = 'a' | 'i' | 'u' | 'e' | 'o';
export type Consonant = 'none' | 'k' | 's' | 'sh' | 't' | 'ch' | 'n' | 'h' | 'm' | 'y' | 'r' | 'w' | 'g' | 'z' | 'd' | 'b' | 'p';

export interface PhonemeInfo {
  /** ひらがな音素 (例: "あ", "か", "しょ", "ず") */
  kana: string;
  /** ローマ字ファイル名キー (例: "a", "ka", "sho", "zu") */
  romaji: string;
  /** フォールバック母音 */
  vowel: Vowel;
  /** フォールバック子音 */
  consonant: Consonant;
}

// ひらがな・拗音からローマ字への標準変換テーブル
export const KANA_TO_ROMAJI: Record<string, { romaji: string; vowel: Vowel; consonant: Consonant }> = {
  // 母音
  'あ': { romaji: 'a', vowel: 'a', consonant: 'none' },
  'い': { romaji: 'i', vowel: 'i', consonant: 'none' },
  'う': { romaji: 'u', vowel: 'u', consonant: 'none' },
  'え': { romaji: 'e', vowel: 'e', consonant: 'none' },
  'お': { romaji: 'o', vowel: 'o', consonant: 'none' },
  'ん': { romaji: 'n', vowel: 'u', consonant: 'n' },

  // か行 / が行
  'か': { romaji: 'ka', vowel: 'a', consonant: 'k' },
  'き': { romaji: 'ki', vowel: 'i', consonant: 'k' },
  'く': { romaji: 'ku', vowel: 'u', consonant: 'k' },
  'け': { romaji: 'ke', vowel: 'e', consonant: 'k' },
  'こ': { romaji: 'ko', vowel: 'o', consonant: 'k' },
  'が': { romaji: 'ga', vowel: 'a', consonant: 'g' },
  'ぎ': { romaji: 'gi', vowel: 'i', consonant: 'g' },
  'ぐ': { romaji: 'gu', vowel: 'u', consonant: 'g' },
  'げ': { romaji: 'ge', vowel: 'e', consonant: 'g' },
  'ご': { romaji: 'go', vowel: 'o', consonant: 'g' },

  // さ行 / ざ行
  'さ': { romaji: 'sa', vowel: 'a', consonant: 's' },
  'し': { romaji: 'shi', vowel: 'i', consonant: 'sh' },
  'す': { romaji: 'su', vowel: 'u', consonant: 's' },
  'せ': { romaji: 'se', vowel: 'e', consonant: 's' },
  'そ': { romaji: 'so', vowel: 'o', consonant: 's' },
  'ざ': { romaji: 'za', vowel: 'a', consonant: 'z' },
  'じ': { romaji: 'ji', vowel: 'i', consonant: 'z' },
  'ず': { romaji: 'zu', vowel: 'u', consonant: 'z' },
  'ぜ': { romaji: 'ze', vowel: 'e', consonant: 'z' },
  'ぞ': { romaji: 'zo', vowel: 'o', consonant: 'z' },

  // た行 / だ行
  'た': { romaji: 'ta', vowel: 'a', consonant: 't' },
  'ち': { romaji: 'chi', vowel: 'i', consonant: 'ch' },
  'つ': { romaji: 'tsu', vowel: 'u', consonant: 't' },
  'て': { romaji: 'te', vowel: 'e', consonant: 't' },
  'と': { romaji: 'to', vowel: 'o', consonant: 't' },
  'だ': { romaji: 'da', vowel: 'a', consonant: 'd' },
  'で': { romaji: 'de', vowel: 'e', consonant: 'd' },
  'ど': { romaji: 'do', vowel: 'o', consonant: 'd' },

  // な行
  'な': { romaji: 'na', vowel: 'a', consonant: 'n' },
  'に': { romaji: 'ni', vowel: 'i', consonant: 'n' },
  'ぬ': { romaji: 'nu', vowel: 'u', consonant: 'n' },
  'ね': { romaji: 'ne', vowel: 'e', consonant: 'n' },
  'の': { romaji: 'no', vowel: 'o', consonant: 'n' },

  // は行 / ば行 / ぱ行
  'は': { romaji: 'ha', vowel: 'a', consonant: 'h' },
  'ひ': { romaji: 'hi', vowel: 'i', consonant: 'h' },
  'ふ': { romaji: 'fu', vowel: 'u', consonant: 'h' },
  'へ': { romaji: 'he', vowel: 'e', consonant: 'h' },
  'ほ': { romaji: 'ho', vowel: 'o', consonant: 'h' },
  'ば': { romaji: 'ba', vowel: 'a', consonant: 'b' },
  'び': { romaji: 'bi', vowel: 'i', consonant: 'b' },
  'ぶ': { romaji: 'bu', vowel: 'u', consonant: 'b' },
  'べ': { romaji: 'be', vowel: 'e', consonant: 'b' },
  'ぼ': { romaji: 'bo', vowel: 'o', consonant: 'b' },
  'ぱ': { romaji: 'pa', vowel: 'a', consonant: 'p' },
  'ぴ': { romaji: 'pi', vowel: 'i', consonant: 'p' },
  'ぷ': { romaji: 'pu', vowel: 'u', consonant: 'p' },
  'ぺ': { romaji: 'pe', vowel: 'e', consonant: 'p' },
  'ぽ': { romaji: 'po', vowel: 'o', consonant: 'p' },

  // ま行
  'ま': { romaji: 'ma', vowel: 'a', consonant: 'm' },
  'み': { romaji: 'mi', vowel: 'i', consonant: 'm' },
  'む': { romaji: 'mu', vowel: 'u', consonant: 'm' },
  'め': { romaji: 'me', vowel: 'e', consonant: 'm' },
  'も': { romaji: 'mo', vowel: 'o', consonant: 'm' },

  // や行
  'や': { romaji: 'ya', vowel: 'a', consonant: 'y' },
  'ゆ': { romaji: 'yu', vowel: 'u', consonant: 'y' },
  'よ': { romaji: 'yo', vowel: 'o', consonant: 'y' },

  // ら行
  'ら': { romaji: 'ra', vowel: 'a', consonant: 'r' },
  'り': { romaji: 'ri', vowel: 'i', consonant: 'r' },
  'る': { romaji: 'ru', vowel: 'u', consonant: 'r' },
  'れ': { romaji: 're', vowel: 'e', consonant: 'r' },
  'ろ': { romaji: 'ro', vowel: 'o', consonant: 'r' },

  // わ行
  'わ': { romaji: 'wa', vowel: 'a', consonant: 'w' },
  'を': { romaji: 'wo', vowel: 'o', consonant: 'w' },

  // 拗音
  'きゃ': { romaji: 'kya', vowel: 'a', consonant: 'k' },
  'きゅ': { romaji: 'kyu', vowel: 'u', consonant: 'k' },
  'きょ': { romaji: 'kyo', vowel: 'o', consonant: 'k' },
  'しゃ': { romaji: 'sha', vowel: 'a', consonant: 'sh' },
  'しゅ': { romaji: 'shu', vowel: 'u', consonant: 'sh' },
  'しょ': { romaji: 'sho', vowel: 'o', consonant: 'sh' },
  'ちゃ': { romaji: 'cha', vowel: 'a', consonant: 'ch' },
  'ちゅ': { romaji: 'chu', vowel: 'u', consonant: 'ch' },
  'ちょ': { romaji: 'cho', vowel: 'o', consonant: 'ch' },
  'にゃ': { romaji: 'nya', vowel: 'a', consonant: 'n' },
  'にゅ': { romaji: 'nyu', vowel: 'u', consonant: 'n' },
  'にょ': { romaji: 'nyo', vowel: 'o', consonant: 'n' },
  'ひゃ': { romaji: 'hya', vowel: 'a', consonant: 'h' },
  'ひゅ': { romaji: 'hyu', vowel: 'u', consonant: 'h' },
  'ひょ': { romaji: 'hyo', vowel: 'o', consonant: 'h' },
  'みゃ': { romaji: 'mya', vowel: 'a', consonant: 'm' },
  'みゅ': { romaji: 'myu', vowel: 'u', consonant: 'm' },
  'みょ': { romaji: 'myo', vowel: 'o', consonant: 'm' },
  'りゃ': { romaji: 'rya', vowel: 'a', consonant: 'r' },
  'りゅ': { romaji: 'ryu', vowel: 'u', consonant: 'r' },
  'りょ': { romaji: 'ryo', vowel: 'o', consonant: 'r' },
  'ぎゃ': { romaji: 'gya', vowel: 'a', consonant: 'g' },
  'ぎゅ': { romaji: 'gyu', vowel: 'u', consonant: 'g' },
  'ぎょ': { romaji: 'gyo', vowel: 'o', consonant: 'g' },
  'じゃ': { romaji: 'ja', vowel: 'a', consonant: 'z' },
  'じゅ': { romaji: 'ju', vowel: 'u', consonant: 'z' },
  'じょ': { romaji: 'jo', vowel: 'o', consonant: 'z' },
  'びゃ': { romaji: 'bya', vowel: 'a', consonant: 'b' },
  'びゅ': { romaji: 'byu', vowel: 'u', consonant: 'b' },
  'びょ': { romaji: 'byo', vowel: 'o', consonant: 'b' },
  'ぴゃ': { romaji: 'pya', vowel: 'a', consonant: 'p' },
  'ぴゅ': { romaji: 'pyu', vowel: 'u', consonant: 'p' },
  'ぴょ': { romaji: 'pyo', vowel: 'o', consonant: 'p' }
};

// カタカナからひらがなへの変換
export function toHiragana(str: string): string {
  return str.replace(/[\u30a1-\u30f6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

/**
 * 歌詞テキストから主要なローマ字ファイル名キーとフォールバック情報を抽出
 */
export function parseLyricToPhoneme(lyric?: string): PhonemeInfo {
  if (!lyric || lyric.trim().length === 0) {
    return { kana: 'あ', romaji: 'a', vowel: 'a', consonant: 'none' };
  }

  // 前後の空白や促音「っ」、長音「ー」を取り除く
  let clean = toHiragana(lyric.trim()).replace(/[っッー〜-]/g, '');
  if (clean.length === 0) {
    clean = 'あ';
  }

  // 1. 2文字の拗音チェック (例: "しょ", "きゃ")
  if (clean.length >= 2) {
    const twoChars = clean.slice(0, 2);
    if (KANA_TO_ROMAJI[twoChars]) {
      const info = KANA_TO_ROMAJI[twoChars];
      return {
        kana: twoChars,
        romaji: info.romaji,
        vowel: info.vowel,
        consonant: info.consonant
      };
    }
  }

  // 2. 1文字音素チェック (例: "ず", "て", "ら")
  const oneChar = clean[0];
  if (KANA_TO_ROMAJI[oneChar]) {
    const info = KANA_TO_ROMAJI[oneChar];
    return {
      kana: oneChar,
      romaji: info.romaji,
      vowel: info.vowel,
      consonant: info.consonant
    };
  }

  // 3. 英語歌詞や未知文字の場合の母音フォールバック
  const first = clean[0].toLowerCase();
  if (first === 'i') return { kana: 'い', romaji: 'i', vowel: 'i', consonant: 'none' };
  if (first === 'u') return { kana: 'う', romaji: 'u', vowel: 'u', consonant: 'none' };
  if (first === 'e') return { kana: 'え', romaji: 'e', vowel: 'e', consonant: 'none' };
  if (first === 'o') return { kana: 'お', romaji: 'o', vowel: 'o', consonant: 'none' };
  return { kana: 'あ', romaji: 'a', vowel: 'a', consonant: 'none' };
}
