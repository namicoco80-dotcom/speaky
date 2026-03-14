/**
 * ⚡ SPEAKY — storage.js
 * 모든 데이터 접근의 단일 진입점.
 *
 * 규칙:
 *   - 앱 내 모든 localStorage 읽기/쓰기는 반드시 이 모듈을 통한다.
 *   - READ_ONLY_KEYS 에 속한 키에 대한 쓰기는 자동 차단 + 로그 기록.
 *   - safeGet 실패 시 defaultValue 반환 (절대 throw 안 함).
 *   - safeSet 실패 시 false 반환, 기존 데이터 손상 없음.
 */

import Logger from './logger.js';

// ─── 키 네임스페이스 ────────────────────────────────────────────────────────

export const KEYS = {
  // ⛔ 읽기 전용 (raw) — expressionManager.js의 appendRaw()만 예외 허용
  RAW_EXPRESSIONS : 'speaky_raw_expressions',
  BUILTIN         : 'speaky_builtin_30',

  // ✏️ AI 가공 결과 — processor.js만 쓰기 가능
  PROCESSED       : 'speaky_processed',
  VOCAB_INDEX     : 'speaky_vocab_index',

  // 👤 사용자 상태
  PROGRESS        : 'speaky_progress',
  SETTINGS        : 'speaky_settings',
  STREAK          : 'speaky_streak',
};

// ⛔ safeSet 완전 차단 대상 (expressionManager.appendRaw만 직접 접근 가능)
const READ_ONLY_KEYS = [KEYS.BUILTIN];

// ─── safeGet ────────────────────────────────────────────────────────────────

/**
 * localStorage에서 JSON을 안전하게 읽는다.
 * 파싱 실패 또는 키 없음 → defaultValue 반환.
 *
 * @param {string} key
 * @param {*} [defaultValue=null]
 * @returns {*}  저장된 payload 객체 (schema_version, saved_at, data 포함)
 *               또는 defaultValue
 */
export function safeGet(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    Logger.error(`safeGet failed: key="${key}"`, e);
    return defaultValue;
  }
}

// ─── safeSet ────────────────────────────────────────────────────────────────

/**
 * localStorage에 JSON을 안전하게 쓴다.
 * READ_ONLY_KEYS는 자동 차단.
 * payload 구조: { schema_version, saved_at, data }
 *
 * @param {string} key
 * @param {*} value  — data 필드에 담길 값
 * @returns {boolean}  성공 true / 실패·차단 false
 */
export function safeSet(key, value) {
  // ⛔ 읽기 전용 키 차단
  if (READ_ONLY_KEYS.includes(key)) {
    Logger.error(`BLOCKED: "${key}" is READ-ONLY. Use appendRaw() for raw expressions.`);
    return false;
  }

  try {
    const payload = {
      schema_version : '1.0',
      saved_at       : new Date().toISOString(),
      data           : value,
    };
    localStorage.setItem(key, JSON.stringify(payload));
    Logger.change(key, 'SET');
    return true;
  } catch (e) {
    Logger.error(`safeSet failed: key="${key}"`, e);
    return false; // 기존 데이터 절대 손상 없음
  }
}

// ─── appendRaw (RAW_EXPRESSIONS 전용) ───────────────────────────────────────

/**
 * raw_expressions에 항목을 추가한다 (append-only).
 * expressionManager.js만 호출해야 한다.
 *
 * @param {Object} newItem  — expressionManager.addExpression()이 만든 객체
 * @returns {boolean}
 */
export function appendRaw(newItem) {
  try {
    const stored = safeGet(KEYS.RAW_EXPRESSIONS, null);
    const expressions = stored?.data?.expressions ?? [];

    expressions.push(newItem);

    const payload = {
      schema_version : '1.0',
      saved_at       : new Date().toISOString(),
      data           : { expressions },
    };
    localStorage.setItem(KEYS.RAW_EXPRESSIONS, JSON.stringify(payload));
    Logger.change(KEYS.RAW_EXPRESSIONS, 'APPEND');
    return true;
  } catch (e) {
    Logger.error(`appendRaw failed`, e);
    return false;
  }
}

// ─── safeRemove ─────────────────────────────────────────────────────────────

/**
 * localStorage 키를 삭제한다.
 * READ_ONLY_KEYS는 차단.
 *
 * @param {string} key
 * @returns {boolean}
 */
export function safeRemove(key) {
  if (READ_ONLY_KEYS.includes(key)) {
    Logger.error(`BLOCKED: cannot remove READ-ONLY key "${key}"`);
    return false;
  }
  try {
    localStorage.removeItem(key);
    Logger.change(key, 'REMOVE');
    return true;
  } catch (e) {
    Logger.error(`safeRemove failed: key="${key}"`, e);
    return false;
  }
}

// ─── resetAll (전체 초기화) ──────────────────────────────────────────────────

/**
 * 사용자 데이터 전체 초기화.
 * 실행 전 반드시 restore_snapshot에 스냅샷을 저장한다 (backupManager 담당).
 * BUILTIN 데이터는 삭제하지 않는다.
 */
export function resetAll() {
  const toDelete = [
    KEYS.RAW_EXPRESSIONS,
    KEYS.PROCESSED,
    KEYS.VOCAB_INDEX,
    KEYS.PROGRESS,
    KEYS.SETTINGS,
    KEYS.STREAK,
  ];
  try {
    toDelete.forEach(key => localStorage.removeItem(key));
    Logger.change('ALL', 'RESET');
    Logger.clearAll?.(); // 로그도 초기화
    return true;
  } catch (e) {
    Logger.error('resetAll failed', e);
    return false;
  }
}
