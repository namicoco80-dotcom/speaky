/**
 * ⚡ SPEAKY — main.js
 */

import Logger from './core/logger.js';
import { KEYS, safeGet, safeSet } from './core/storage.js';
import {
  getExpressions,
  getExpressionCount,
  getFavoriteCount,
  getFolders,
  addFolder,
} from './data/expressionManager.js';
import { getSettings } from './data/settingsManager.js';
import { BUILTIN_DATA } from './data/builtinData.js';

// ─── BUILTIN 초기화 ──────────────────────────────────────────────────────────
function initBuiltin() {
  const existing = safeGet(KEYS.BUILTIN, null);
  if (existing?.data?.expressions?.length) {
    Logger.info('initBuiltin: 이미 로드됨, 스킵.');
    return;
  }
  // fetch 없이 직접 JS 모듈에서 로드
  localStorage.setItem(KEYS.BUILTIN, JSON.stringify(BUILTIN_DATA));
  Logger.info('initBuiltin: 내장 30개 표현 로드 완료');
}

// ─── 진행 상태 초기화 ────────────────────────────────────────────────────────
function initProgress() {
  const existing = safeGet(KEYS.PROGRESS, null);
  if (existing?.data) return;
  safeSet(KEYS.PROGRESS, {
    folders      : [{ id: 'default', name: '기본', created_at: new Date().toISOString() }],
    quiz_history : [],
    learned_ids  : [],
    streak_count : 0,
    last_study   : null,
  });
}

// ─── 통계 렌더링 ─────────────────────────────────────────────────────────────
function renderStats() {
  const total    = getExpressionCount(true);
  const favs     = getFavoriteCount();
  const progress = safeGet(KEYS.PROGRESS, null)?.data ?? {};
  const learned  = progress.learned_ids?.length ?? 0;
  const pct      = total > 0 ? Math.round((learned / total) * 100) : 0;

  const elTotal = document.querySelector('.stat-num.total');
  const elFav   = document.querySelector('.stat-num.favorites');
  const elPct   = document.querySelector('.progress-pct');
  const elFill  = document.querySelector('.progress-bar-fill');
  const elVocab = document.getElementById('vocabCount');

  if (elTotal) elTotal.textContent = total;
  if (elFav)   elFav.textContent   = favs;
  if (elPct)   elPct.textContent   = `${learned} / ${total}`;
  if (elFill)  elFill.style.width  = `${pct}%`;
  if (elVocab) elVocab.textContent = total;
}

// ─── 오늘의 표현 렌더링 ──────────────────────────────────────────────────────
function renderTodayExpression() {
  const all = getExpressions({ includeBuiltin: true });
  if (!all.length) return;

  const item  = all[Math.floor(Date.now() / 86400000) % all.length];
  const elEn  = document.querySelector('.today-en');
  const elKr  = document.querySelector('.today-kr');
  const card  = document.querySelector('.today-card');

  if (elEn)  elEn.textContent  = item.en;
  if (elKr)  elKr.textContent  = item.kr ?? '';
  if (card)  card.onclick = () => playTTS(item.en);
}

// ─── 폴더 칩 렌더링 ──────────────────────────────────────────────────────────
function renderFolderChips() {
  const container = document.querySelector('.folder-scroll');
  if (!container) return;

  const folders  = getFolders();
  const total    = getExpressionCount(true);
  const allExprs = getExpressions({ includeBuiltin: true });

  container.innerHTML = '';
  container.appendChild(createChip(`전체 (${total})`, true, () => {}));

  // 중복 없이 폴더 표시
  const seen = new Set();
  folders.forEach(f => {
    if (seen.has(f.id)) return;
    seen.add(f.id);
    const count = allExprs.filter(e => e.folder_id === f.id).length;
    container.appendChild(createChip(`${f.name} (${count})`, false, () => {}));
  });

  const builtinCount = allExprs.filter(e => e.folder_id === 'builtin').length;
  if (builtinCount > 0) {
    container.appendChild(createChip(`원어민30 (${builtinCount})`, false, () => {}));
  }

  const addChip = createChip('+ 추가', false, () => {
    const name = prompt('새 폴더 이름:');
    if (name?.trim()) { addFolder(name.trim()); renderFolderChips(); }
  });
  container.appendChild(addChip);
}

function createChip(text, isActive, onClick) {
  const chip = document.createElement('div');
  chip.className = 'folder-chip' + (isActive ? ' active' : '');
  chip.textContent = text;
  chip.addEventListener('click', () => {
    document.querySelectorAll('.folder-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    onClick();
  });
  return chip;
}

// ─── TTS ────────────────────────────────────────────────────────────────────
export function playTTS(text) {
  if (!('speechSynthesis' in window)) return;
  const s = getSettings();
  speechSynthesis.cancel();
  const u  = new SpeechSynthesisUtterance(text);
  u.lang   = s.tts_accent === 'uk' ? 'en-GB' : 'en-US';
  u.rate   = s.tts_speed ?? 1.0;
  u.volume = 1.0;
  speechSynthesis.speak(u);
}

// ─── 앱 초기화 ───────────────────────────────────────────────────────────────
function init() {
  initBuiltin();
  initProgress();
  renderStats();
  renderTodayExpression();
  renderFolderChips();

  // 설정 버튼
  document.querySelector('.settings-btn')
    ?.addEventListener('click', () => location.href = 'settings.html');

  // 하단 네비
  const navLinks = ['index.html', 'index.html', 'quiz.html', 'stats.html', 'settings.html'];
  document.querySelectorAll('.nav-item').forEach((item, i) => {
    item.addEventListener('click', () => { if (navLinks[i]) location.href = navLinks[i]; });
  });

  // 퀴즈 칩 선택
  document.querySelectorAll('.quiz-chip').forEach(chip => {
    chip.addEventListener('click', function() {
      document.querySelectorAll('.quiz-chip').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // 퀴즈 시작
  document.querySelector('.start-btn')?.addEventListener('click', () => {
    const chipName = document.querySelector('.quiz-chip.active .chip-name')?.textContent ?? '';
    const typeMap  = {
      '덩어리\n조립':'chunk_scramble',
      '핵심\n타이핑':'focus_typing',
      '리스닝\n받아쓰기':'listening_dictation',
      '의미\n매칭':'meaning_match',
    };
    location.href = `quiz.html?type=${typeMap[chipName] ?? 'chunk_scramble'}`;
  });

  // 마스코트
  const msgs   = ['같이 공부해요! 💪','오늘도 화이팅! ⚡','잘 하고 있어요! 🌟','퀴즈 해봐요! 🎮'];
  let msgIdx   = 0;
  const bubble = document.querySelector('.mascot-bubble');
  if (bubble) setInterval(() => { bubble.textContent = msgs[++msgIdx % msgs.length]; }, 4000);

  window.SpeakyModules = { playTTS, renderStats, renderTodayExpression, renderFolderChips };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
