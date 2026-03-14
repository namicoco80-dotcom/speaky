/**
 * ⚡ SPEAKY — backupManager.js
 * 내보내기(export) / 가져오기(import) / 롤백 스냅샷 관리.
 *
 * 규칙:
 *   - 복원 전 반드시 현재 데이터를 speaky_restore_snapshot에 저장.
 *   - 버전 불일치 시 경고 후 계속 진행 (중단 없음).
 *   - BUILTIN 데이터는 복원 대상에서 제외 (덮어쓰기 금지).
 */

import Logger from '../core/logger.js';
import { KEYS, safeGet, safeSet } from '../core/storage.js';

const BACKUP_VERSION = '1.0';
const SNAPSHOT_KEY   = 'speaky_restore_snapshot';

// ─── 유틸 ────────────────────────────────────────────────────────────────────

/** YYYY-MM-DD 형식 오늘 날짜 */
function today() {
  return new Date().toISOString().slice(0, 10);
}

/** JSON 파일 다운로드 트리거 */
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** File 객체 → JSON 파싱 */
function readJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => {
      try { resolve(JSON.parse(e.target.result)); }
      catch (err) { reject(new Error('JSON 파싱 실패: ' + err.message)); }
    };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsText(file);
  });
}

// ─── 내보내기 ────────────────────────────────────────────────────────────────

/**
 * 전체 데이터를 JSON 파일로 내보낸다.
 * 파일명 예시: speaky_backup_2026-03-14.json
 */
export function exportAll() {
  try {
    const payload = {
      backup_version : BACKUP_VERSION,
      exported_at    : new Date().toISOString(),
      data: {
        raw_expressions : safeGet(KEYS.RAW_EXPRESSIONS),
        processed       : safeGet(KEYS.PROCESSED),
        progress        : safeGet(KEYS.PROGRESS),
        settings        : safeGet(KEYS.SETTINGS),
        streak          : safeGet(KEYS.STREAK),
        // BUILTIN은 내보내지 않음 (앱 내장 데이터)
      },
    };

    downloadJSON(payload, `speaky_backup_${today()}.json`);
    Logger.change('BACKUP', `EXPORT speaky_backup_${today()}.json`);
    return true;
  } catch (e) {
    Logger.error('exportAll 실패', e);
    return false;
  }
}

// ─── 스냅샷 저장 (롤백 대비) ─────────────────────────────────────────────────

/**
 * 현재 데이터를 임시 스냅샷으로 저장한다.
 * importAll() 전에 자동 호출됨.
 */
export function saveSnapshot() {
  try {
    const snapshot = {
      saved_at       : new Date().toISOString(),
      raw_expressions: safeGet(KEYS.RAW_EXPRESSIONS),
      processed      : safeGet(KEYS.PROCESSED),
      progress       : safeGet(KEYS.PROGRESS),
      settings       : safeGet(KEYS.SETTINGS),
      streak         : safeGet(KEYS.STREAK),
    };
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
    Logger.change(SNAPSHOT_KEY, 'SNAPSHOT_SAVED');
    return true;
  } catch (e) {
    Logger.error('saveSnapshot 실패', e);
    return false;
  }
}

/**
 * 스냅샷으로 데이터를 롤백한다.
 */
export function rollback() {
  try {
    const snapshot = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || 'null');
    if (!snapshot) {
      Logger.error('rollback: 스냅샷이 없습니다.');
      return false;
    }

    if (snapshot.raw_expressions)
      localStorage.setItem(KEYS.RAW_EXPRESSIONS, JSON.stringify(snapshot.raw_expressions));
    if (snapshot.processed)
      localStorage.setItem(KEYS.PROCESSED, JSON.stringify(snapshot.processed));
    if (snapshot.progress)
      safeSet(KEYS.PROGRESS, snapshot.progress?.data);
    if (snapshot.settings)
      safeSet(KEYS.SETTINGS, snapshot.settings?.data);
    if (snapshot.streak)
      safeSet(KEYS.STREAK, snapshot.streak?.data);

    Logger.change('ALL', 'ROLLBACK');
    return true;
  } catch (e) {
    Logger.error('rollback 실패', e);
    return false;
  }
}

// ─── 가져오기 (복원) ─────────────────────────────────────────────────────────

/**
 * JSON 백업 파일에서 데이터를 복원한다.
 *
 * 순서:
 *   ① 현재 데이터 스냅샷 저장 (롤백 대비)
 *   ② 버전 확인 (불일치 시 경고만)
 *   ③ 각 키 복원
 *
 * @param {File} file  — input[type=file]로 받은 File 객체
 * @returns {Promise<boolean>}
 */
export async function importAll(file) {
  // ① 복원 전 스냅샷 저장
  saveSnapshot();

  let payload;
  try {
    payload = await readJSON(file);
  } catch (e) {
    Logger.error('importAll: 파일 읽기/파싱 실패', e);
    return false;
  }

  // ② 버전 확인 (경고만, 중단 없음)
  if (payload.backup_version !== BACKUP_VERSION) {
    Logger.error(`importAll: 버전 불일치 (파일=${payload.backup_version}, 앱=${BACKUP_VERSION}) — 계속 진행`);
  }

  // ③ 복원 실행
  try {
    const d = payload.data ?? {};

    if (d.raw_expressions)
      localStorage.setItem(KEYS.RAW_EXPRESSIONS, JSON.stringify(d.raw_expressions));

    if (d.processed)
      localStorage.setItem(KEYS.PROCESSED, JSON.stringify(d.processed));

    if (d.progress)
      safeSet(KEYS.PROGRESS, d.progress?.data);

    if (d.settings)
      safeSet(KEYS.SETTINGS, d.settings?.data);

    if (d.streak)
      safeSet(KEYS.STREAK, d.streak?.data);

    Logger.change('ALL', `IMPORT from file (backup_version=${payload.backup_version})`);
    return true;
  } catch (e) {
    Logger.error('importAll: 복원 중 오류 발생 — rollback 시도', e);
    rollback();
    return false;
  }
}

// ─── 스냅샷 조회 / 삭제 ──────────────────────────────────────────────────────

/**
 * 마지막 스냅샷 메타 정보 조회 (saved_at 등)
 * @returns {Object|null}
 */
export function getSnapshotMeta() {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const { saved_at } = JSON.parse(raw);
    return { saved_at };
  } catch {
    return null;
  }
}

/**
 * 스냅샷 삭제 (복원 성공 후 정리용)
 */
export function clearSnapshot() {
  localStorage.removeItem(SNAPSHOT_KEY);
  Logger.change(SNAPSHOT_KEY, 'SNAPSHOT_CLEARED');
}
