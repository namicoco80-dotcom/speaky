/**
 * ⚡ SPEAKY — main.js
 * 앱 진입점. 모듈 초기화 및 메인화면 UI 연결.
 *
 * 담당:
 *   - BUILTIN 30개 데이터 최초 1회 localStorage에 주입
 *   - 메인화면 통계(총 문장, 즐겨찾기, 학습 진행률) 렌더링
 *   - 오늘의 표현 렌더링 및 TTS 연결
 *   - 폴더 칩 목록 렌더링
 *   - 퀴즈 시작 버튼 연결 (Phase 3에서 실제 구현)
 *   - 설정 버튼 → 설정 화면 전환
 */

import Logger from './core/logger.js';
import { KEYS, safeGet, safeSet } from './core/storage.js';
import {
  getExpressions,
  getExpressionCount,
  getFavoriteCount,
  getFolders,
} from './data/expressionManager.js';
import { getSettings } from './data/settingsManager.js';

// ─── BUILTIN 초기화 ──────────────────────────────────────────────────────────

/**
 * 앱 최초 실행 시 builtin_30.json을 localStorage에 주입한다.
 * 이미 있으면 스킵 (덮어쓰기 금지).
 */
async function initBuiltin() {
  const existing = safeGet(KEYS.BUILTIN, null);
  if (existing?.data?.expressions?.length) {
    Logger.info('initBuiltin: 이미 로드됨, 스킵.');
    return;
  }

  try {
    // 상대 경로로 builtin_30.json fetch
    const res  = await fetch('../data/builtin_30.json');
    const data = await res.json();
    // BUILTIN 키는 READ_ONLY라 safeSet 불가 → 직접 세팅 (초기화 전용 예외)
    localStorage.setItem(KEYS.BUILTIN, JSON.stringify(data));
    Logger.change(KEYS.BUILTIN, 'INIT_BUILTIN');
    Logger.info('initBuiltin: 내장 30개 표현 로드 완료');
  } catch (e) {
    Logger.error('initBuiltin: builtin_30.json 로드 실패', e);
  }
}

// ─── 진행 상태 초기화 ────────────────────────────────────────────────────────

/**
 * speaky_progress 키가 없으면 기본 구조로 초기화
 */
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
  Logger.info('initProgress: 기본 진행 상태 초기화 완료');
}

// ─── 통계 렌더링 ─────────────────────────────────────────────────────────────

/**
 * 메인화면 통계 카드 업데이트
 */
function renderStats() {
  const total     = getExpressionCount(true);
  const favorites = getFavoriteCount();
  const progress  = safeGet(KEYS.PROGRESS, null)?.data ?? {};
  const learned   = progress.learned_ids?.length ?? 0;

  // 총 문장 수
  const elTotal = document.querySelector('.stat-num.total');
  if (elTotal) elTotal.textContent = total;

  // 즐겨찾기 수
  const elFav = document.querySelector('.stat-num.favorites');
  if (elFav) elFav.textContent = favorites;

  // 진행률
  const pct = total > 0 ? Math.round((learned / total) * 100) : 0;
  const elPct  = document.querySelector('.progress-pct');
  const elFill = document.querySelector('.progress-bar-fill');
  if (elPct)  elPct.textContent  = `${learned} / ${total}`;
  if (elFill) {
    elFill.style.width = `${pct}%`;
    elFill.style.animation = 'none'; // CSS animation 덮어쓰기
  }
}

// ─── 오늘의 표현 렌더링 ──────────────────────────────────────────────────────

/**
 * 오늘의 표현 카드: 날짜 기반으로 문장 하나를 선택해 표시
 */
function renderTodayExpression() {
  const all = getExpressions({ includeBuiltin: true });
  if (!all.length) return;

  // 날짜를 seed로 사용 (하루에 하나 고정)
  const dayIndex = Math.floor(Date.now() / 86400000);
  const item     = all[dayIndex % all.length];

  const elEn = document.querySelector('.today-en');
  const elKr = document.querySelector('.today-kr');
  if (elEn) elEn.textContent = item.en;
  if (elKr) elKr.textContent = item.kr ?? '';

  // TTS 버튼 연결
  const card = document.querySelector('.today-card');
  if (card) {
    card.dataset.ttsText = item.en;
    card.onclick = () => playTTS(item.en);
  }
}

// ─── 폴더 칩 렌더링 ──────────────────────────────────────────────────────────

/**
 * 폴더 칩 목록을 동적으로 렌더링
 */
function renderFolderChips() {
  const container = document.querySelector('.folder-scroll');
  if (!container) return;

  const folders  = getFolders();
  const total    = getExpressionCount(true);
  const allExprs = getExpressions({ includeBuiltin: true });

  // 기존 칩 제거
  container.innerHTML = '';

  // "전체" 칩
  const allChip = createChip(`전체 (${total})`, true, () => filterByFolder(null));
  container.appendChild(allChip);

  // 동적 폴더 칩
  folders.forEach(folder => {
    const count = allExprs.filter(e => e.folder_id === folder.id).length;
    const chip  = createChip(`${folder.name} (${count})`, false, () => filterByFolder(folder.id));
    container.appendChild(chip);
  });

  // 내장 30개 칩 (항상 표시)
  const builtinCount = allExprs.filter(e => e.folder_id === 'builtin').length;
  if (builtinCount > 0) {
    const chip = createChip(`원어민30 (${builtinCount})`, false, () => filterByFolder('builtin'));
    container.appendChild(chip);
  }

  // "+ 추가" 칩
  const addChip = createChip('+ 추가', false, openAddFolderModal);
  addChip.classList.add('add-folder');
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

function filterByFolder(folderId) {
  // Phase 2에서 문장 목록 화면과 연결 예정
  Logger.info(`filterByFolder: folder_id="${folderId}"`);
}

function openAddFolderModal() {
  // Phase 2에서 폴더 추가 모달 구현 예정
  const name = prompt('새 폴더 이름을 입력하세요:');
  if (name?.trim()) {
    const { addFolder } = window.SpeakyModules ?? {};
    if (addFolder) {
      addFolder(name.trim());
      renderFolderChips();
    }
  }
}

// ─── TTS ────────────────────────────────────────────────────────────────────

/**
 * TTS 재생
 * @param {string} text
 */
export function playTTS(text) {
  if (!('speechSynthesis' in window)) {
    Logger.error('playTTS: SpeechSynthesis 미지원 브라우저');
    return;
  }

  const settings = getSettings();
  speechSynthesis.cancel(); // 이전 재생 중지

  const utter  = new SpeechSynthesisUtterance(text);
  utter.lang   = settings.tts_accent === 'uk' ? 'en-GB' : 'en-US';
  utter.rate   = settings.tts_speed ?? 1.0;
  utter.volume = 1.0;
  speechSynthesis.speak(utter);
}

// ─── 앱 초기화 ───────────────────────────────────────────────────────────────

async function init() {
  Logger.info('SPEAKY 앱 시작');

  // 1. BUILTIN 주입 (최초 1회)
  await initBuiltin();

  // 2. progress 초기화
  initProgress();

  // 3. UI 렌더링
  renderStats();
  renderTodayExpression();
  renderFolderChips();

  // 4. 설정 버튼 이벤트
  const settingsBtn = document.querySelector('.settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      window.location.href = 'settings.html';
    });
  }

  // 5. 하단 네비 활성화 처리
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function () {
      document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.remove('active');
        n.querySelector('.nav-dot')?.remove();
      });
      this.classList.add('active');
      const dot = document.createElement('div');
      dot.className = 'nav-dot';
      this.appendChild(dot);
    });
  });

  // 6. 퀴즈 방식 선택
  document.querySelectorAll('.quiz-chip').forEach(chip => {
    chip.addEventListener('click', function () {
      document.querySelectorAll('.quiz-chip').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // 7. 퀴즈 시작 버튼 (Phase 3 연결 예정)
  const startBtn = document.querySelector('.start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      Logger.info('퀴즈 시작 — Phase 3에서 구현 예정');
      alert('⚡ 퀴즈 엔진은 Phase 3에서 구현됩니다!');
    });
  }

  // 8. 마스코트 메시지 순환
  const messages = ['같이 공부해요! 💪', '오늘도 화이팅! ⚡', '잘 하고 있어요! 🌟', '퀴즈 해봐요! 🎮'];
  let msgIdx = 0;
  const bubble = document.querySelector('.mascot-bubble');
  if (bubble) {
    setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length;
      bubble.textContent = messages[msgIdx];
    }, 4000);
  }

  // 9. 전역 모듈 노출 (다른 화면에서도 접근 가능)
  window.SpeakyModules = {
    playTTS,
    renderStats,
    renderTodayExpression,
    renderFolderChips,
  };

  Logger.info('SPEAKY 앱 초기화 완료');
}

// DOM 준비 후 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
