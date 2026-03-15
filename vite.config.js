import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, existsSync, mkdirSync } from 'fs';

const copyStaticPlugin = {
  name: 'copy-static',
  closeBundle() {
    // data 폴더 복사
    try {
      mkdirSync('dist/data', { recursive: true });
      if (existsSync('data/builtin_30.json')) {
        copyFileSync('data/builtin_30.json', 'dist/data/builtin_30.json');
        console.log('[copy-static] data/builtin_30.json 복사 완료');
      }
    } catch(e) {
      console.warn('[copy-static] data 복사 실패:', e.message);
    }

    // sw.js, manifest.json 복사
    ['sw.js', 'manifest.json'].forEach(f => {
      try {
        if (existsSync(f)) {
          copyFileSync(f, `dist/${f}`);
          console.log(`[copy-static] ${f} 복사 완료`);
        } else {
          console.warn(`[copy-static] ${f} 없음 — 스킵`);
        }
      } catch(e) {
        console.warn(`[copy-static] ${f} 복사 실패:`, e.message);
      }
    });
  },
};

export default defineConfig({
  base: './',
  plugins: [copyStaticPlugin],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main      : resolve(__dirname, 'index.html'),
        license   : resolve(__dirname, 'license.html'),
        add       : resolve(__dirname, 'add.html'),
        vocab     : resolve(__dirname, 'vocab.html'),
        stats     : resolve(__dirname, 'stats.html'),
        quiz      : resolve(__dirname, 'quiz.html'),
        settings  : resolve(__dirname, 'settings.html'),
        sentences   : resolve(__dirname, 'sentences.html'),
        onboarding  : resolve(__dirname, 'onboarding.html'),
        review      : resolve(__dirname, 'review.html'),
      },
      output: {
        chunkFileNames : 'assets/[name]-[hash].js',
        entryFileNames : 'assets/[name]-[hash].js',
        assetFileNames : 'assets/[name]-[hash][extname]',
      },
    },
    sourcemap: false,
    minify: 'esbuild',
  },
  server: {
    port: 3000,
    open: true,
  },
});
