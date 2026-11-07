const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\user\\AppData\\Local\\Temp\\teto\\重音テト音声ライブラリー\\重音テト単独音';
const outDir = path.resolve(__dirname, '..', 'public', 'voices');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 読み出し元ファイルと配置先名のマッピング
const vowelMap = {
  '_あ.wav': ['あ.wav', 'a.wav'],
  '_い.wav': ['い.wav', 'i.wav'],
  '_う.wav': ['う.wav', 'u.wav'],
  '_え.wav': ['え.wav', 'e.wav'],
  '_お.wav': ['お.wav', 'o.wav'],
  '_ん.wav': ['ん.wav', 'n.wav'],
  '_ら.wav': ['ら.wav', 'ra.wav'],
  '_り.wav': ['り.wav', 'ri.wav'],
  '_る.wav': ['る.wav', 'ru.wav'],
  '_れ.wav': ['れ.wav', 're.wav'],
  '_ろ.wav': ['ろ.wav', 'ro.wav']
};

for (const [srcName, targets] of Object.entries(vowelMap)) {
  const srcPath = path.join(srcDir, srcName);
  if (fs.existsSync(srcPath)) {
    const data = fs.readFileSync(srcPath);
    for (const target of targets) {
      const destPath = path.join(outDir, target);
      fs.writeFileSync(destPath, data);
      console.log(`Copied ${srcName} -> ${target} (${data.length} bytes)`);
    }
  } else {
    console.warn(`File not found: ${srcPath}`);
  }
}

// 全wavファイルもアンダースコアを除去して public/voices にコピー
const files = fs.readdirSync(srcDir);
for (const f of files) {
  if (f.endsWith('.wav')) {
    const cleanName = f.replace(/^_/, '');
    const srcFile = path.join(srcDir, f);
    const destFile = path.join(outDir, cleanName);
    if (!fs.existsSync(destFile)) {
      fs.copyFileSync(srcFile, destFile);
    }
  }
}
console.log('Voice files deployed successfully!');

