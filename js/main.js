/**
 * ⚡ SPEAKY — main.js
 * 앱 진입점. 모듈 초기화 및 메인화면 UI 연결.
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

// ─── BUILTIN 초기화 ──────────────────────────────────────────────────────────
async function initBuiltin() {
  const existing = safeGet(KEYS.BUILTIN, null);
  if (existing?.data?.expressions?.length) {
    Logger.info('initBuiltin: 이미 로드됨, 스킵.');
    return;
  }

  // 여러 경로 시도 (GitHub Pages 대응)
  const paths = [
    '../data/builtin_30.json',
    './data/builtin_30.json',
    '/speaky/data/builtin_30.json',
  ];

  let res;
  for (const p of paths) {
    try {
      res = await fetch(p);
      if (res.ok) break;
    } catch {}
  }

  try {
    const data = await res.json();
    localStorage.setItem(KEYS.BUILTIN, JSON.stringify(data));
    Logger.change(KEYS.BUILTIN, 'INIT_BUILTIN');
    Logger.info('initBuiltin: 내장 30개 표현 로드 완료');
  } catch (e) {
    Logger.error('initBuiltin: builtin_30.json 로드 실패', e);
  }
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
  const total     = getExpressionCount(true);
  const favorites = getFavoriteCount();
  const progress  = safeGet(KEYS.PROGRESS, null)?.data ?? {};
  const learned   = progress.learned_ids?.length ?? 0;

  const elTotal = document.querySelector('.stat-num.total');
  if (elTotal) elTotal.textContent = total;

  const elFav = document.querySelector('.stat-num.favorites');
  if (elFav) elFav.textContent = favorites;

  const pct    = total > 0 ? Math.round((learned / total) * 100) : 0;
  const elPct  = document.querySelector('.progress-pct');
  const elFill = document.querySelector('.progress-bar-fill');
  if (elPct)  elPct.textContent  = `${learned} / ${total}`;
  if (elFill) elFill.style.width = `${pct}%`;

  // 단어장 카운트도 업데이트
  const vocabCount = document.getElementById('vocabCount');
  if (vocabCount) vocabCount.textContent = total;
}

// ─── 오늘의 표현 렌더링 ──────────────────────────────────────────────────────
function renderTodayExpression() {
  const all = getExpressions({ includeBuiltin: true });
  if (!all.length) return;

  const dayIndex = Math.floor(Date.now() / 86400000);
  const item     = all[dayIndex % all.length];

  const elEn = document.querySelector('.today-en');
  const elKr = document.querySelector('.today-kr');
  if (elEn) elEn.textContent = item.en;
  if (elKr) elKr.textContent = item.kr ?? '';

  const card = document.querySelector('.today-card');
  if (card) {
    card.dataset.ttsText = item.en;
    card.onclick = () => playTTS(item.en);
  }
}

// ─── 폴더 칩 렌더링 ──────────────────────────────────────────────────────────
function renderFolderChips() {
  const container = document.querySelector('.folder-scroll');
  if (!container) return;

  // progress에서 폴더 목록 가져오기 (중복 없이)
  const folders  = getFolders();
  const total    = getExpressionCount(true);
  const allExprs = getExpressions({ includeBuiltin: true });

  container.innerHTML = '';

  // 전체 칩
  container.appendChild(createChip(`전체 (${total})`, true, () => {}));

  // 사용자 폴더 (default 폴더는 "기본" 하나만)
  const seen = new Set();
  folders.forEach(folder => {
    if (seen.has(folder.id)) return;
    seen.add(folder.id);
    const count = allExprs.filter(e => e.folder_id === folder.id).length;
    container.appendChild(createChip(`${folder.name} (${count})`, false, () => {}));
  });

  // 내장 30개 칩
  const builtinCount = allExprs.filter(e => e.folder_id === 'builtin').length;
  if (builtinCount > 0) {
    container.appendChild(createChip(`원어민30 (${builtinCount})`, false, () => {}));
  }

  // + 추가 칩
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
  const settings = getSettings();
  speechSynthesis.cancel();
  const utter  = new SpeechSynthesisUtterance(text);
  utter.lang   = settings.tts_accent === 'uk' ? 'en-GB' : 'en-US';
  utter.rate   = settings.tts_speed ?? 1.0;
  utter.volume = 1.0;
  speechSynthesis.speak(utter);
}

// ─── 앱 초기화 ───────────────────────────────────────────────────────────────
async function init() {
  Logger.info('SPEAKY 앱 시작');

  await initBuiltin();
  initProgress();

  renderStats();
  renderTodayExpression();
  renderFolderChips();

  // 설정 버튼
  const settingsBtn = document.querySelector('.settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => location.href = 'settings.html');
  }

  // 하단 네비 (홈·문장·퀴즈·통계·설정 연결)
  const navLinks = ['index.html', 'index.html', 'quiz.html', 'stats.html', 'settings.html'];
  document.querySelectorAll('.nav-item').forEach((item, i) => {
    item.addEventListener('click', () => {
      if (navLinks[i]) location.href = navLinks[i];
    });
  });

  // 퀴즈 방식 선택
  document.querySelectorAll('.quiz-chip').forEach(chip => {
    chip.addEventListener('click', function () {
      document.querySelectorAll('.quiz-chip').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // 퀴즈 시작 버튼 → quiz.html 연결
  const startBtn = document.querySelector('.start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const activeChip = document.querySelector('.quiz-chip.active');
      const typeMap = {
        '덩어리\n조립'     : 'chunk_scramble',
        '핵심\n타이핑'     : 'focus_typing',
        '리스닝\n받아쓰기' : 'listening_dictation',
        '의미\n매칭'       : 'meaning_match',
      };
      const chipName = activeChip?.querySelector('.chip-name')?.textContent ?? '';
      const type     = typeMap[chipName] ?? 'chunk_scramble';
      location.href  = `quiz.html?type=${type}`;
    });
  }

  // 마스코트 메시지 순환
  const messages = ['같이 공부해요! 💪', '오늘도 화이팅! ⚡', '잘 하고 있어요! 🌟', '퀴즈 해봐요! 🎮'];
  let msgIdx = 0;
  const bubble = document.querySelector('.mascot-bubble');
  if (bubble) {
    setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length;
      bubble.textContent = messages[msgIdx];
    }, 4000);
  }

  window.SpeakyModules = { playTTS, renderStats, renderTodayExpression, renderFolderChips };
  Logger.info('SPEAKY 앱 초기화 완료');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
