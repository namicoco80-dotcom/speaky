/**
 * ⚡ SPEAKY — settingsManager.js
 * 앱 설정 읽기 / 쓰기 전담 모듈.
 * speaky_settings 키 쓰기 권한은 이 모듈만 갖는다.
 */

import Logger from '../core/logger.js';
import { KEYS, safeGet, safeSet } from '../core/storage.js';

// ─── 기본값 ──────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  schema_version : '1.0',
  theme          : 'light',               // 'light' | 'dark'
  tts_engine     : 'browser',             // 'browser' | 'edge' | 'openai' | 'elevenlabs'
  tts_accent     : 'us',                  // 'us' | 'uk'
  tts_speed      : 1.0,                   // 0.5 ~ 2.0
  sfx_volume     : 0.7,                   // 0 ~ 1
  chunk_size     : 2,                     // 2 | 3 | 4
  quiz_formats   : {
    chunk_scramble      : true,
    focus_typing        : true,
    listening_dictation : true,
    meaning_match       : true,
  },
  daily_goal     : 5,                     // 1 ~ 30
  notification   : {
    enabled : false,
    time    : '18:00',                    // HH:MM
  },
  api_keys       : {
    openai      : '',
    elevenlabs  : '',
  },
};

// ─── 조회 ────────────────────────────────────────────────────────────────────

/**
 * 현재 설정을 반환한다.
 * 저장된 값이 없으면 DEFAULT_SETTINGS를 반환.
 * @returns {Object}
 */
export function getSettings() {
  const stored = safeGet(KEYS.SETTINGS, null);
  if (!stored?.data) return { ...DEFAULT_SETTINGS };
  // 저장된 값과 기본값 병합 (새 필드가 추가된 경우 기본값으로 채움)
  return deepMerge({ ...DEFAULT_SETTINGS }, stored.data);
}

/**
 * 특정 설정 값 하나만 조회
 * @param {string} key  — 예: 'tts_engine', 'daily_goal'
 * @returns {*}
 */
export function getSetting(key) {
  return getSettings()[key];
}

// ─── 저장 ────────────────────────────────────────────────────────────────────

/**
 * 설정 전체 저장
 * @param {Object} settings
 * @returns {boolean}
 */
export function saveSettings(settings) {
  const ok = safeSet(KEYS.SETTINGS, settings);
  if (ok) Logger.info('settingsManager: 설정 저장 완료');
  return ok;
}

/**
 * 설정 일부만 업데이트 (나머지는 기존 값 유지)
 * @param {Object} partial  — 예: { tts_engine: 'openai', daily_goal: 10 }
 * @returns {boolean}
 */
export function updateSettings(partial) {
  const current = getSettings();
  const merged  = deepMerge(current, partial);
  return saveSettings(merged);
}

// ─── 자주 쓰는 단축 메서드 ──────────────────────────────────────────────────

/** 테마 변경 */
export function setTheme(theme) {
  return updateSettings({ theme });
}

/** TTS 엔진 변경 */
export function setTTSEngine(engine) {
  return updateSettings({ tts_engine: engine });
}

/** TTS 속도 변경 */
export function setTTSSpeed(speed) {
  const clamped = Math.max(0.5, Math.min(2.0, speed));
  return updateSettings({ tts_speed: clamped });
}

/** 데일리 목표 변경 */
export function setDailyGoal(n) {
  const clamped = Math.max(1, Math.min(30, n));
  return updateSettings({ daily_goal: clamped });
}

/** 알림 설정 변경 */
export function setNotification(enabled, time) {
  return updateSettings({ notification: { enabled, time } });
}

/** API 키 저장 (openai 또는 elevenlabs) */
export function setApiKey(service, key) {
  const current = getSettings();
  current.api_keys = current.api_keys ?? {};
  current.api_keys[service] = key;
  return saveSettings(current);
}

/** API 키 조회 */
export function getApiKey(service) {
  return getSettings().api_keys?.[service] ?? '';
}

// ─── 설정 초기화 ─────────────────────────────────────────────────────────────

/**
 * 설정을 기본값으로 초기화
 * @returns {boolean}
 */
export function resetSettings() {
  return saveSettings({ ...DEFAULT_SETTINGS });
}

// ─── 내부 유틸 ───────────────────────────────────────────────────────────────

/**
 * 간단한 deep merge (2 depth까지)
 */
function deepMerge(base, override) {
  const result = { ...base };
  for (const key of Object.keys(override)) {
    if (
      override[key] !== null &&
      typeof override[key] === 'object' &&
      !Array.isArray(override[key]) &&
      typeof base[key] === 'object'
    ) {
      result[key] = { ...base[key], ...override[key] };
    } else {
      result[key] = override[key];
    }
  }
  return result;
}
