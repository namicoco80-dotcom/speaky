/**
 * ⚡ SPEAKY — expressionManager.js
 * 문장(expression) 추가 / 삭제(플래그) / 조회 / 폴더 관리 전담 모듈.
 *
 * 규칙:
 *   - raw 데이터는 append-only. 실제 삭제 없이 is_deleted: true 플래그만 사용.
 *   - raw와 processed를 동시에 수정하는 행위 금지.
 *   - processed 갱신은 processor.js가 별도 처리한다.
 */

import Logger from '../core/logger.js';
import { KEYS, safeGet, safeSet, appendRaw } from '../core/storage.js';

// ─── ID 생성 ────────────────────────────────────────────────────────────────

/**
 * 고유 ID 생성: "exp_YYYYMMDD_xxxx" 형식
 * @returns {string}
 */
function generateId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6);
  return `exp_${date}_${rand}`;
}

/**
 * 폴더 ID 생성: "fld_xxxx" 형식
 * @returns {string}
 */
function generateFolderId() {
  const rand = Math.random().toString(36).slice(2, 8);
  return `fld_${rand}`;
}

// ─── 문장 추가 ───────────────────────────────────────────────────────────────

/**
 * 새 문장을 raw_expressions에 추가한다.
 * processed 갱신은 하지 않는다 — processor.js의 역할.
 *
 * @param {Object} params
 * @param {string} params.en         영어 문장 (필수)
 * @param {string} [params.memo]     메모/해설 (선택)
 * @param {string} [params.folder_id] 폴더 ID (기본: 'default')
 * @param {string} [params.source]   출처 — 'manual' | 'youtube' | 'builtin'
 * @param {string} [params.source_url] 유튜브 URL 등
 * @returns {Object|false}  추가된 항목 또는 실패 시 false
 */
export function addExpression({
  en,
  memo = '',
  folder_id = 'default',
  source = 'manual',
  source_url = '',
}) {
  if (!en || !en.trim()) {
    Logger.error('addExpression: "en" 필드가 비어있습니다.');
    return false;
  }

  const newItem = {
    id         : generateId(),
    created_at : new Date().toISOString(),
    en         : en.trim(),
    memo       : memo.trim(),
    folder_id,
    source,                        // 'manual' | 'youtube' | 'builtin'
    source_url : source_url.trim(),
    is_favorite: false,
    is_deleted : false,
  };

  const ok = appendRaw(newItem);
  if (!ok) {
    Logger.error('addExpression: appendRaw 실패', newItem.id);
    return false;
  }

  Logger.info(`addExpression: "${newItem.id}" 추가 완료`);
  return newItem;
}

// ─── 문장 삭제 (소프트 삭제) ─────────────────────────────────────────────────

/**
 * 문장을 소프트 삭제한다 (is_deleted 플래그만 변경, 원본 보존).
 *
 * @param {string} id
 * @returns {boolean}
 */
export function deleteExpression(id) {
  const stored = safeGet(KEYS.RAW_EXPRESSIONS, null);
  const expressions = stored?.data?.expressions ?? [];

  const idx = expressions.findIndex(e => e.id === id);
  if (idx === -1) {
    Logger.error(`deleteExpression: id="${id}" 를 찾을 수 없습니다.`);
    return false;
  }

  // ⛔ is_deleted 플래그만 변경 — 원본 데이터 보존
  expressions[idx].is_deleted = true;
  expressions[idx].deleted_at = new Date().toISOString();

  try {
    const payload = {
      schema_version : stored.schema_version ?? '1.0',
      saved_at       : new Date().toISOString(),
      data           : { expressions },
    };
    localStorage.setItem(KEYS.RAW_EXPRESSIONS, JSON.stringify(payload));
    Logger.change(KEYS.RAW_EXPRESSIONS, `SOFT_DELETE id=${id}`);
    return true;
  } catch (e) {
    Logger.error('deleteExpression: 저장 실패', e);
    return false;
  }
}

// ─── 즐겨찾기 토글 ──────────────────────────────────────────────────────────

/**
 * 즐겨찾기 상태를 토글한다.
 *
 * @param {string} id
 * @returns {boolean|null}  새 즐겨찾기 상태 또는 실패 시 null
 */
export function toggleFavorite(id) {
  const stored = safeGet(KEYS.RAW_EXPRESSIONS, null);
  const expressions = stored?.data?.expressions ?? [];

  const idx = expressions.findIndex(e => e.id === id && !e.is_deleted);
  if (idx === -1) {
    Logger.error(`toggleFavorite: id="${id}" 를 찾을 수 없습니다.`);
    return null;
  }

  expressions[idx].is_favorite = !expressions[idx].is_favorite;

  try {
    const payload = {
      schema_version : stored.schema_version ?? '1.0',
      saved_at       : new Date().toISOString(),
      data           : { expressions },
    };
    localStorage.setItem(KEYS.RAW_EXPRESSIONS, JSON.stringify(payload));
    Logger.change(KEYS.RAW_EXPRESSIONS, `FAVORITE_TOGGLE id=${id} → ${expressions[idx].is_favorite}`);
    return expressions[idx].is_favorite;
  } catch (e) {
    Logger.error('toggleFavorite: 저장 실패', e);
    return null;
  }
}

// ─── 문장 메모 수정 ──────────────────────────────────────────────────────────

/**
 * 메모(해설)를 수정한다.
 * en(원문) 수정은 허용하지 않는다 — 원본 불변 원칙.
 *
 * @param {string} id
 * @param {string} newMemo
 * @returns {boolean}
 */
export function updateMemo(id, newMemo) {
  const stored = safeGet(KEYS.RAW_EXPRESSIONS, null);
  const expressions = stored?.data?.expressions ?? [];

  const idx = expressions.findIndex(e => e.id === id && !e.is_deleted);
  if (idx === -1) {
    Logger.error(`updateMemo: id="${id}" 를 찾을 수 없습니다.`);
    return false;
  }

  expressions[idx].memo        = newMemo.trim();
  expressions[idx].memo_edited = new Date().toISOString();

  try {
    const payload = {
      schema_version : stored.schema_version ?? '1.0',
      saved_at       : new Date().toISOString(),
      data           : { expressions },
    };
    localStorage.setItem(KEYS.RAW_EXPRESSIONS, JSON.stringify(payload));
    Logger.change(KEYS.RAW_EXPRESSIONS, `MEMO_UPDATE id=${id}`);
    return true;
  } catch (e) {
    Logger.error('updateMemo: 저장 실패', e);
    return false;
  }
}

// ─── 문장 조회 ───────────────────────────────────────────────────────────────

/**
 * 문장 목록을 조회한다.
 * raw + processed 데이터를 병합하여 반환한다.
 *
 * @param {Object} [options]
 * @param {string|null}  [options.folder_id]    폴더 필터 (null = 전체)
 * @param {boolean}      [options.favoritesOnly] 즐겨찾기만
 * @param {boolean}      [options.includeBuiltin] 내장 30개 포함 여부 (기본: true)
 * @returns {Array}
 */
export function getExpressions({
  folder_id     = null,
  favoritesOnly = false,
  includeBuiltin = true,
} = {}) {
  // raw 목록
  const rawList = safeGet(KEYS.RAW_EXPRESSIONS, null)?.data?.expressions ?? [];

  // builtin 목록
  const builtinList = includeBuiltin
    ? (safeGet(KEYS.BUILTIN, null)?.data?.expressions ?? [])
    : [];

  // processed map (id → processed 데이터)
  const procMap = Object.fromEntries(
    (safeGet(KEYS.PROCESSED, null)?.data?.expressions ?? []).map(e => [e.id, e])
  );

  const combined = [...builtinList, ...rawList];

  return combined
    .filter(e => !e.is_deleted)
    .filter(e => folder_id     ? e.folder_id === folder_id : true)
    .filter(e => favoritesOnly ? e.is_favorite === true     : true)
    .map(e => ({
      ...e,
      ...(procMap[e.id] ?? {}), // processed 데이터 병합 (없으면 그대로)
    }));
}

/**
 * 단일 문장 조회 (id로)
 *
 * @param {string} id
 * @returns {Object|null}
 */
export function getExpressionById(id) {
  const all = getExpressions({ includeBuiltin: true });
  return all.find(e => e.id === id) ?? null;
}

/**
 * 총 문장 수 (삭제 제외, builtin 포함 선택)
 *
 * @param {boolean} [includeBuiltin=true]
 * @returns {number}
 */
export function getExpressionCount(includeBuiltin = true) {
  return getExpressions({ includeBuiltin }).length;
}

/**
 * 즐겨찾기 수
 * @returns {number}
 */
export function getFavoriteCount() {
  return getExpressions({ favoritesOnly: true }).length;
}

// ─── 폴더 관리 ───────────────────────────────────────────────────────────────

/**
 * 현재 진행 상태(speaky_progress)에서 폴더 목록을 읽는다.
 * @returns {Array<{id, name, created_at}>}
 */
export function getFolders() {
  return safeGet(KEYS.PROGRESS, null)?.data?.folders ?? [];
}

/**
 * 폴더 추가
 * @param {string} name
 * @returns {Object|false}
 */
export function addFolder(name) {
  if (!name || !name.trim()) {
    Logger.error('addFolder: name이 비어있습니다.');
    return false;
  }

  const progress = safeGet(KEYS.PROGRESS, null)?.data ?? {
    folders        : [],
    quiz_history   : [],
    learned_ids    : [],
    streak_count   : 0,
  };

  const newFolder = {
    id         : generateFolderId(),
    name       : name.trim(),
    created_at : new Date().toISOString(),
  };

  progress.folders = progress.folders ?? [];
  progress.folders.push(newFolder);

  const ok = safeSet(KEYS.PROGRESS, progress);
  if (!ok) return false;

  Logger.info(`addFolder: "${newFolder.id}" (${newFolder.name}) 추가`);
  return newFolder;
}

/**
 * 폴더 삭제 (폴더만 삭제, 문장은 folder_id='default'로 이동)
 * @param {string} folderId
 * @returns {boolean}
 */
export function deleteFolder(folderId) {
  if (folderId === 'default') {
    Logger.error('deleteFolder: 기본 폴더는 삭제할 수 없습니다.');
    return false;
  }

  // 폴더에 속한 문장들을 default로 이동
  const stored = safeGet(KEYS.RAW_EXPRESSIONS, null);
  const expressions = stored?.data?.expressions ?? [];
  let changed = false;

  expressions.forEach(e => {
    if (e.folder_id === folderId && !e.is_deleted) {
      e.folder_id = 'default';
      changed = true;
    }
  });

  if (changed) {
    try {
      const payload = {
        schema_version : stored.schema_version ?? '1.0',
        saved_at       : new Date().toISOString(),
        data           : { expressions },
      };
      localStorage.setItem(KEYS.RAW_EXPRESSIONS, JSON.stringify(payload));
      Logger.change(KEYS.RAW_EXPRESSIONS, `FOLDER_DELETE reassign folderId=${folderId}`);
    } catch (e) {
      Logger.error('deleteFolder: 문장 이동 실패', e);
      return false;
    }
  }

  // 폴더 목록에서 제거
  const progress = safeGet(KEYS.PROGRESS, null)?.data ?? {};
  progress.folders = (progress.folders ?? []).filter(f => f.id !== folderId);
  return safeSet(KEYS.PROGRESS, progress);
}

/**
 * 문장을 다른 폴더로 이동
 * @param {string} expressionId
 * @param {string} targetFolderId
 * @returns {boolean}
 */
export function moveToFolder(expressionId, targetFolderId) {
  const stored = safeGet(KEYS.RAW_EXPRESSIONS, null);
  const expressions = stored?.data?.expressions ?? [];

  const idx = expressions.findIndex(e => e.id === expressionId && !e.is_deleted);
  if (idx === -1) {
    Logger.error(`moveToFolder: id="${expressionId}" 를 찾을 수 없습니다.`);
    return false;
  }

  expressions[idx].folder_id = targetFolderId;

  try {
    const payload = {
      schema_version : stored.schema_version ?? '1.0',
      saved_at       : new Date().toISOString(),
      data           : { expressions },
    };
    localStorage.setItem(KEYS.RAW_EXPRESSIONS, JSON.stringify(payload));
    Logger.change(KEYS.RAW_EXPRESSIONS, `MOVE id=${expressionId} → folder=${targetFolderId}`);
    return true;
  } catch (e) {
    Logger.error('moveToFolder: 저장 실패', e);
    return false;
  }
}
