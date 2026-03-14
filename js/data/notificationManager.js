/**
 * ⚡ SPEAKY — notificationManager.js
 * 학습 알림 스케줄 관리 (브라우저 Notification API 기반)
 *
 * 방식:
 *   - Service Worker Push: 서버 없이 불가 → 앱이 열려있을 때 setTimeout으로 예약
 *   - 앱이 닫혀있을 때: 다음 번 열릴 때 "어제 못했어요" 알림 표시
 *   - 실용적 접근: 설정한 시간에 맞춰 앱 내 알림 + 브라우저 Notification
 */

import Logger from '../core/logger.js';
import { getSettings } from './settingsManager.js';
import { KEYS, safeGet, safeSet } from '../core/storage.js';

const NOTIF_KEY = 'speaky_last_notif';

// ── 권한 요청 ─────────────────────────────────────────────────────────────────

/**
 * 알림 권한 요청
 * @returns {Promise<'granted'|'denied'|'default'>}
 */
export async function requestPermission() {
  if (!('Notification' in window)) {
    Logger.error('notificationManager: 이 브라우저는 알림을 지원하지 않습니다.');
    return 'denied';
  }
  if (Notification.permission === 'granted') return 'granted';
  const result = await Notification.requestPermission();
  Logger.info(`알림 권한: ${result}`);
  return result;
}

/**
 * 현재 알림 권한 상태
 */
export function getPermissionStatus() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// ── 알림 스케줄링 ────────────────────────────────────────────────────────────

let _scheduledTimer = null;

/**
 * 설정된 시간에 맞춰 오늘 알림을 예약한다.
 * 앱이 열려있는 동안만 동작 (setTimeout 기반).
 */
export function scheduleToday() {
  const settings = getSettings();
  if (!settings.notification?.enabled) return;

  clearScheduled();

  const [hh, mm] = (settings.notification.time ?? '18:00').split(':').map(Number);
  const now      = new Date();
  const target   = new Date();
  target.setHours(hh, mm, 0, 0);

  // 이미 지났으면 내일로
  if (target <= now) target.setDate(target.getDate() + 1);

  const delay = target.getTime() - now.getTime();
  Logger.info(`알림 예약: ${target.toLocaleTimeString()} (${Math.round(delay / 60000)}분 후)`);

  _scheduledTimer = setTimeout(() => {
    fireNotification();
    // 다음 날도 자동 재예약
    scheduleToday();
  }, delay);
}

/**
 * 예약된 알림 취소
 */
export function clearScheduled() {
  if (_scheduledTimer) {
    clearTimeout(_scheduledTimer);
    _scheduledTimer = null;
  }
}

// ── 알림 발송 ────────────────────────────────────────────────────────────────

/**
 * 즉시 알림 발송
 * @param {string} [title]
 * @param {string} [body]
 */
export async function fireNotification(
  title = '⚡ SPEAKY — 오늘의 학습',
  body  = null
) {
  if (Notification.permission !== 'granted') {
    const perm = await requestPermission();
    if (perm !== 'granted') return;
  }

  const settings   = getSettings();
  const progress   = safeGet(KEYS.PROGRESS, null)?.data ?? {};
  const learnedCnt = progress.learned_ids?.length ?? 0;
  const goal       = settings.daily_goal ?? 5;
  const todayDone  = getTodayLearnedCount();

  const remaining = Math.max(0, goal - todayDone);
  const bodyText  = body ?? (
    remaining > 0
      ? `아직 ${remaining}문장 남았어요! 오늘 목표 ${goal}문장 💪`
      : `오늘 목표 달성! 🎉 총 ${learnedCnt}문장 완료`
  );

  try {
    const notif = new Notification(title, {
      body   : bodyText,
      icon   : './assets/icon-192.png',
      badge  : './assets/icon-72.png',
      tag    : 'speaky-daily',
      silent : false,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    // 마지막 알림 시각 기록
    localStorage.setItem(NOTIF_KEY, new Date().toISOString());
    Logger.change(NOTIF_KEY, 'NOTIF_FIRED');
  } catch (e) {
    Logger.error('알림 발송 실패', e);
  }
}

// ── 앱 시작 시 체크 ──────────────────────────────────────────────────────────

/**
 * 앱 열릴 때마다 호출:
 *   1. 어제 학습 안 했으면 동기 알림 표시
 *   2. 오늘 알림 예약
 */
export function initNotifications() {
  const settings = getSettings();
  if (!settings.notification?.enabled) return;

  // 어제 학습 안 했는지 체크
  checkMissedYesterday();

  // 오늘 알림 예약
  scheduleToday();
}

function checkMissedYesterday() {
  const progress  = safeGet(KEYS.PROGRESS, null)?.data ?? {};
  const lastStudy = progress.last_study;
  if (!lastStudy) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const lastDate  = new Date(lastStudy).toISOString().slice(0, 10);
  const yDate     = yesterday.toISOString().slice(0, 10);
  const today     = new Date().toISOString().slice(0, 10);

  // 마지막 학습이 어제 이전이고 오늘 아직 안 했으면
  if (lastDate < yDate) {
    fireNotification(
      '⚡ SPEAKY — 연속 학습 위기!',
      '어제 학습을 건너뛰었어요 😢 오늘은 꼭 해봐요! 💪'
    );
  }
}

// ── 오늘 학습량 조회 ─────────────────────────────────────────────────────────

function getTodayLearnedCount() {
  const today   = new Date().toISOString().slice(0, 10);
  const history = safeGet(KEYS.PROGRESS, null)?.data?.quiz_history ?? [];
  return history.filter(h => h.correct && h.ts?.startsWith(today)).length;
}

// ── 테스트 알림 (설정 화면에서 "테스트" 버튼용) ──────────────────────────────

export async function sendTestNotification() {
  await fireNotification(
    '⚡ SPEAKY 알림 테스트',
    '알림이 정상적으로 동작하고 있어요! 🎉'
  );
}
