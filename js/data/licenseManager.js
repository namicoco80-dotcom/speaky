/**
 * ⚡ SPEAKY — licenseManager.js
 */

const LICENSE_KEY = 'speaky_license';

const VALID_HASHES = [
  '52784eef', // SPEAKY-SBPF-X5EN-ZHZ6
  'dbd72c10', // SPEAKY-UG5X-DWGR-S4B8
  'e0363bf6', // SPEAKY-YWVU-NUVH-EFJS
  '0709d1a1', // SPEAKY-RS2X-MDAT-6ZFD
  'c5a903bb', // SPEAKY-B4PD-PG85-AWWL
  '817a5d8e', // SPEAKY-JY2W-TJJ3-F4HS
  '489600f7', // SPEAKY-ZBT9-HMHD-Q3A6
  'e547e97e', // SPEAKY-VH2W-SCGJ-PR7E
  'ef9f07b3', // SPEAKY-QYFD-C3LP-WHWE
  '1e746608', // SPEAKY-86L2-G8WE-MNDP
];

function hashKey(key) {
  const clean = key.trim().toUpperCase().replace(/-/g, '');
  let hash = 5381;
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) + hash) + clean.charCodeAt(i);
    hash = hash & hash;
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function getStored() {
  try { return JSON.parse(localStorage.getItem(LICENSE_KEY) || 'null'); }
  catch { return null; }
}

function storeLicense(key) {
  const data = { key: key.trim().toUpperCase(), hash: hashKey(key), activated_at: new Date().toISOString() };
  localStorage.setItem(LICENSE_KEY, JSON.stringify(data));
  return data;
}

export function isValidKey(key) {
  if (!key) return false;
  return VALID_HASHES.includes(hashKey(key));
}

export function getLicenseStatus() {
  const stored = getStored();
  if (!stored) return 'none';
  if (VALID_HASHES.includes(stored.hash)) return 'active';
  return 'none';
}

export function isActivated() {
  return getLicenseStatus() === 'active';
}

export function activate(key) {
  if (!key?.trim()) return { success: false, message: '라이선스 키를 입력해주세요.' };
  const formatted = key.trim().toUpperCase();
  if (!formatted.match(/^SPEAKY-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/))
    return { success: false, message: '키 형식이 올바르지 않아요.\n예) SPEAKY-A1B2-C3D4-E5F6' };
  if (!isValidKey(formatted))
    return { success: false, message: '유효하지 않은 키예요. 구매처를 확인해주세요.' };
  storeLicense(formatted);
  return { success: true, message: '✅ 활성화 완료! SPEAKY를 시작해요.' };
}

export function getLicenseInfo() { return getStored(); }
