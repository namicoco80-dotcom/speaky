import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, existsSync } from 'fs';

// sw.js / manifest.json 은 Vite 번들 대상이 아니므로 빌드 후 수동 복사
const copyStaticPlugin = {
  name: 'copy-static',
  closeBundle() {
    const files = [
      'sw.js',
      'manifest.json',
    ];
    files.forEach(f => {
      if (existsSync(f)) {
        copyFileSync(f, `dist/${f}`);
        console.log(`[copy-static] ${f} → dist/${f}`);
      }
    });
  },
};

export default defineConfig({
  // ✅ file:// 로컬 실행을 위해 상대 경로 사용
  base: './',

  plugins: [copyStaticPlugin],

  build: {
    outDir: 'dist',
    emptyOutDir: true,

    // 멀티페이지 앱 (HTML 6개 모두 진입점)
    rollupOptions: {
      input: {
        main     : resolve(__dirname, 'index.html'),
        add      : resolve(__dirname, 'add.html'),
        vocab    : resolve(__dirname, 'vocab.html'),
        stats    : resolve(__dirname, 'stats.html'),
        quiz     : resolve(__dirname, 'quiz.html'),
        settings : resolve(__dirname, 'settings.html'),
      },
      output: {
        chunkFileNames : 'assets/[name]-[hash].js',
        entryFileNames : 'assets/[name]-[hash].js',
        assetFileNames : 'assets/[name]-[hash][extname]',
      },
    },

    // 소스맵 끄기 (코드 보호)
    sourcemap: false,

    // 압축
    minify: 'esbuild',
  },

  // 개발 서버 (npm run dev)
  server: {
    port: 3000,
    open: true,
  },
});
