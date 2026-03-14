/**
 * ⚡ SPEAKY — logger.js
 * 모든 오류·변경 이력을 localStorage에 기록한다.
 * 다른 모듈보다 먼저 로드되어야 함 (storage.js가 Logger를 사용하므로).
 *
 * 키:
 *   speaky_log_error  — 오류 로그
 *   speaky_log_change — 변경 이력
 */

const MAX_LINES = 200; // 초과 시 오래된 로그 자동 삭제

/**
 * 내부 쓰기 함수
 * @param {'error'|'change'|'quiz'} type
 * @param {string} message
 * @param {string} [detail]
 */
function _write(type, message, detail = '') {
  try {
    const key = type === 'error'
      ? 'speaky_log_error'
      : 'speaky_log_change';

    const logs = JSON.parse(localStorage.getItem(key) || '[]');

    logs.push({
      ts:      new Date().toISOString(),
      type,
      message,
      detail:  detail ? String(detail) : '',
    });

    // 최대 200줄 초과 시 오래된 항목 제거
    if (logs.length > MAX_LINES) {
      logs.splice(0, logs.length - MAX_LINES);
    }

    localStorage.setItem(key, JSON.stringify(logs));
  } catch (e) {
    // 로거 자체 오류는 console에만 출력 (무한루프 방지)
    console.warn('[SPEAKY Logger] _write failed:', e);
  }
}

const Logger = {
  /**
   * 오류 기록 + console.error 출력
   * @param {string} msg
   * @param {Error|string} [err]
   */
  error(msg, err = '') {
    console.error('[SPEAKY]', msg, err);
    _write('error', msg, err?.message || String(err));
  },

  /**
   * 데이터 변경 이력 기록
   * @param {string} key  — localStorage 키
   * @param {string} action — 'SET' | 'APPEND' | 'DELETE' | 'RESET' 등
   */
  change(key, action) {
    _write('change', `${action} → ${key}`);
  },

  /**
   * 퀴즈 이벤트 기록 (정답/오답 등)
   * @param {string} msg
   */
  quiz(msg) {
    _write('quiz', msg);
  },

  /**
   * 정보성 로그 (console.info만, localStorage 저장 없음)
   * @param {string} msg
   */
  info(msg) {
    console.info('[SPEAKY]', msg);
  },

  /**
   * 오류 로그 전체 조회
   * @returns {Array}
   */
  getErrorLogs() {
    try {
      return JSON.parse(localStorage.getItem('speaky_log_error') || '[]');
    } catch {
      return [];
    }
  },

  /**
   * 변경 이력 전체 조회
   * @returns {Array}
   */
  getChangeLogs() {
    try {
      return JSON.parse(localStorage.getItem('speaky_log_change') || '[]');
    } catch {
      return [];
    }
  },

  /**
   * 로그 초기화 (전체 초기화 시 호출)
   */
  clearAll() {
    localStorage.removeItem('speaky_log_error');
    localStorage.removeItem('speaky_log_change');
    console.info('[SPEAKY] All logs cleared.');
  },
};

export default Logger;
