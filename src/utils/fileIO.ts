import { IdChugProject } from '../types/project';

/**
 * プロジェクトデータを .idchug ファイルとしてダウンロード
 */
export function exportProjectToFile(project: IdChugProject) {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const fileName = `${project.meta.title.replace(/[\s/\\?%*:|"<>]/g, '_') || 'untitled'}.idchug`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * ファイルから .idchug JSONを読み込んでパース＆検証
 */
export async function importProjectFromFile(file: File): Promise<IdChugProject> {
  const text = await file.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error('無効なJSONファイルです。');
  }

  // 基本的な構造検証
  if (!data || typeof data !== 'object') {
    throw new Error('プロジェクトデータの形式が正しくありません。');
  }

  if (data.version !== '1.0.0') {
    // 互換性チェック（将来バージョンにも対応できるように）
    if (!data.meta || !data.tracks) {
      throw new Error('未対応のプロジェクトバージョンまたは破損したファイルです。');
    }
  }

  if (!data.meta || typeof data.meta.bpm !== 'number') {
    throw new Error('プロジェクトメタデータ(BPM等)が不足しています。');
  }

  if (!Array.isArray(data.chords) || !Array.isArray(data.tracks)) {
    throw new Error('コードまたはトラックデータが不正です。');
  }

  return data as IdChugProject;
}

