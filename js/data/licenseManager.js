/**
 * ⚡ SPEAKY — licenseManager.js
 * 라이선스 키 검증 및 관리
 *
 * 방식:
 *   - 키 형식: SPEAKY-XXXX-XXXX-XXXX (판매자가 생성)
 *   - 검증: 키를 해시해서 내장된 유효 해시 목록과 비교
 *   - 저장: localStorage에 저장 → 재입력 불필요
 *   - 만료: 선택적으로 만료일 포함 가능
 *
 * ⚠️  키 생성 도구(keygen.html)는 판매자 전용 — 고객에게 배포 금지
 */

const LICENSE_KEY   = 'speaky_license';
const GRACE_DAYS    = 0; // 체험판 허용일 (0 = 체험 없음)

// ── 유효 키 해시 목록 ────────────────────────────────────────────────────────
// 판매할 때마다 keygen.html에서 키 생성 후 해시를 여기에 추가
// 앱 업데이트 시 새 해시 목록으로 교체
const VALID_HASHES = [
  // keygen.html로 생성한 키의 해시값을 여기에 추가
  // 예시 (실제 배포 전 교체 필요):
  // '7f83b1657779122b50c3b76b8459b767',
];

// ── 해시 함수 (간단한 djb2 — 서버 없는 환경용) ──────────────────────────────
function hashKey(key) {
  const clean = key.trim().toUpperCase().replace(/-/g, '');
  let hash = 5381;
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) + hash) + clean.charCodeAt(i);
    hash = hash & hash; // 32비트 정수 유지
  }
  // 양수로 변환 후 16진수
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// ── 저장된 라이선스 정보 가져오기 ────────────────────────────────────────────
function getStored() {
  try {
    return JSON.parse(localStorage.getItem(LICENSE_KEY) || 'null');
  } catch {
    return null;
  }
}

// ── 라이선스 저장 ─────────────────────────────────────────────────────────────
function storeLicense(key) {
  const data = {
    key        : key.trim().toUpperCase(),
    hash       : hashKey(key),
    activated_at: new Date().toISOString(),
  };
  localStorage.setItem(LICENSE_KEY, JSON.stringify(data));
  return data;
}

// ── 키 유효성 검사 ────────────────────────────────────────────────────────────

/**
 * 키가 유효한지 확인
 * @param {string} key
 * @returns {boolean}
 */
export function isValidKey(key) {
  if (!key) return false;
  const h = hashKey(key);
  return VALID_HASHES.includes(h);
}

// ── 현재 라이선스 상태 ────────────────────────────────────────────────────────

/**
 * 현재 활성화 상태 확인
 * @returns {'active'|'none'}
 */
export function getLicenseStatus() {
  const stored = getStored();
  if (!stored) return 'none';

  // 저장된 해시가 유효 목록에 있으면 active
  if (VALID_HASHES.includes(stored.hash)) return 'active';

  return 'none';
}

/**
 * 활성화 여부 (boolean)
 */
export function isActivated() {
  return getLicenseStatus() === 'active';
}

// ── 키 활성화 ─────────────────────────────────────────────────────────────────

/**
 * 키 입력 → 검증 → 저장
 * @param {string} key
 * @returns {{ success: boolean, message: string }}
 */
export function activate(key) {
  if (!key?.trim()) {
    return { success: false, message: '라이선스 키를 입력해주세요.' };
  }

  // 형식 체크: SPEAKY-XXXX-XXXX-XXXX
  const formatted = key.trim().toUpperCase();
  if (!formatted.match(/^SPEAKY-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)) {
    return { success: false, message: '키 형식이 올바르지 않아요.\n예) SPEAKY-A1B2-C3D4-E5F6' };
  }

  if (!isValidKey(formatted)) {
    return { success: false, message: '유효하지 않은 키예요. 구매처를 확인해주세요.' };
  }

  storeLicense(formatted);
  return { success: true, message: '✅ 활성화 완료! SPEAKY를 시작해요.' };
}

/**
 * 저장된 키 정보 조회
 */
export function getLicenseInfo() {
  return getStored();
}
