/**
 * ⚡ SPEAKY — scoreTracker.js
 * 퀴즈 정답/오답 기록 및 학습 진행 상태(speaky_progress) 업데이트.
 * streak(연속 학습) 관리 포함.
 */

import Logger from '../core/logger.js';
import { KEYS, safeGet, safeSet } from '../core/storage.js';

// ── 진행 상태 가져오기 ──────────────────────────────────────────────────────

function getProgress() {
  return safeGet(KEYS.PROGRESS, null)?.data ?? {
    folders      : [{ id: 'default', name: '기본', created_at: new Date().toISOString() }],
    quiz_history : [],
    learned_ids  : [],
    streak_count : 0,
    last_study   : null,
  };
}

function saveProgress(data) {
  return safeSet(KEYS.PROGRESS, data);
}

// ── streak 관리 ──────────────────────────────────────────────────────────────

function getStreak() {
  return safeGet(KEYS.STREAK, null)?.data ?? {
    current  : 0,
    best     : 0,
    last_date: null,
    week_log : [],  // [{ date: 'YYYY-MM-DD', count: N }]
  };
}

function saveStreak(data) {
  return safeSet(KEYS.STREAK, data);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 오늘 학습했음을 streak에 반영
 */
function touchStreak() {
  const streak = getStreak();
  const today  = todayStr();

  if (streak.last_date === today) {
    // 오늘 이미 기록됨 → week_log count만 +1
    const wIdx = streak.week_log.findIndex(w => w.date === today);
    if (wIdx >= 0) streak.week_log[wIdx].count++;
    else streak.week_log.push({ date: today, count: 1 });
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);

    // 연속 여부 확인
    if (streak.last_date === yStr) {
      streak.current++;
    } else if (streak.last_date !== today) {
      streak.current = 1; // 끊겼으면 리셋
    }

    streak.best      = Math.max(streak.best, streak.current);
    streak.last_date = today;

    // week_log: 최근 7일만 유지
    streak.week_log.push({ date: today, count: 1 });
    streak.week_log = streak.week_log
      .filter(w => {
        const d = new Date(w.date);
        const diff = (Date.now() - d.getTime()) / 86400000;
        return diff <= 7;
      })
      .slice(-7);
  }

  saveStreak(streak);
  return streak;
}

// ── 퀴즈 결과 기록 ───────────────────────────────────────────────────────────

/**
 * 단일 문제 결과를 기록한다.
 *
 * @param {Object} params
 * @param {string}  params.expressionId  문장 ID
 * @param {string}  params.quizType      'chunk_scramble'|'focus_typing'|'listening_dictation'|'meaning_match'
 * @param {boolean} params.correct       정답 여부
 * @param {number}  [params.score]       점수 (0~100)
 */
export function recordResult({ expressionId, quizType, correct, score = correct ? 100 : 0 }) {
  const progress = getProgress();

  // quiz_history 추가 (최대 500개 유지)
  progress.quiz_history = progress.quiz_history ?? [];
  progress.quiz_history.push({
    id         : expressionId,
    type       : quizType,
    correct,
    score,
    ts         : new Date().toISOString(),
  });
  if (progress.quiz_history.length > 500) {
    progress.quiz_history.splice(0, progress.quiz_history.length - 500);
  }

  // 정답이면 learned_ids에 추가 (중복 없이)
  if (correct) {
    progress.learned_ids = progress.learned_ids ?? [];
    if (!progress.learned_ids.includes(expressionId)) {
      progress.learned_ids.push(expressionId);
    }
  }

  progress.last_study = new Date().toISOString();
  saveProgress(progress);

  // streak 업데이트
  touchStreak();

  Logger.quiz(`${quizType} | id=${expressionId} | correct=${correct} | score=${score}`);
}

/**
 * 세션(퀴즈 1회) 결과를 한꺼번에 기록한다.
 *
 * @param {Object} session
 * @param {string}  session.quizType
 * @param {Array}   session.results   — [{ expressionId, correct, score }]
 * @returns {{ total, correct, accuracy, newLearned }}
 */
export function recordSession({ quizType, results }) {
  results.forEach(r => recordResult({ ...r, quizType }));

  const total      = results.length;
  const correctCnt = results.filter(r => r.correct).length;
  const accuracy   = total > 0 ? Math.round((correctCnt / total) * 100) : 0;

  // 이 세션에서 새로 learned 된 것
  const progress  = getProgress();
  const newLearned = results
    .filter(r => r.correct)
    .map(r => r.expressionId)
    .filter(id => progress.learned_ids.includes(id));

  Logger.info(`세션 완료: ${quizType} | ${correctCnt}/${total} (${accuracy}%)`);

  return { total, correct: correctCnt, accuracy, newLearned: newLearned.length };
}

// ── 조회 헬퍼 ────────────────────────────────────────────────────────────────

/**
 * 특정 문장의 정답률 조회
 * @param {string} expressionId
 * @returns {number}  0~100
 */
export function getAccuracy(expressionId) {
  const history = getProgress().quiz_history ?? [];
  const related = history.filter(h => h.id === expressionId);
  if (!related.length) return 0;
  return Math.round(related.filter(h => h.correct).length / related.length * 100);
}

/**
 * 학습 안 된 문장 ID 목록 (퀴즈 우선순위 결정용)
 * @param {string[]} allIds
 * @returns {string[]}
 */
export function getUnlearnedIds(allIds) {
  const learned = new Set(getProgress().learned_ids ?? []);
  return allIds.filter(id => !learned.has(id));
}

/**
 * 현재 streak 정보
 * @returns {{ current, best, week_log }}
 */
export function getStreakInfo() {
  return getStreak();
}

/**
 * 전체 정답률
 * @returns {number}
 */
export function getTotalAccuracy() {
  const history = getProgress().quiz_history ?? [];
  if (!history.length) return 0;
  return Math.round(history.filter(h => h.correct).length / history.length * 100);
}
