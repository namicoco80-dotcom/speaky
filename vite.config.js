import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, existsSync, mkdirSync } from 'fs';

const copyStaticPlugin = {
  name: 'copy-static',
  closeBundle() {
    // data 폴더 복사
    mkdirSync('dist/data', { recursive: true });
    copyFileSync('data/builtin_30.json', 'dist/data/builtin_30.json');
    // sw.js, manifest.json 복사
    ['sw.js', 'manifest.json'].forEach(f => {
      if (existsSync(f)) copyFileSync(f, `dist/${f}`);
    });
    console.log('[copy-static] 완료');
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
        main     : resolve(__dirname, 'index.html'),
        license  : resolve(__dirname, 'license.html'),
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
    sourcemap: false,
    minify: 'esbuild',
  },
});
