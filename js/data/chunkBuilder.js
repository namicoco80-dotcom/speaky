/**
 * ⚡ SPEAKY — chunkBuilder.js
 * 문장을 퀴즈용 의미 덩어리(chunk)로 분리한다.
 *
 * 우선순위:
 *   1. processed 데이터에 chunks가 있으면 그대로 사용
 *   2. 없으면 로컬 규칙 기반으로 생성
 */

// ── 구동사 사전 (expressionManager와 동일) ──
const PHRASAL_VERBS = new Set([
  'give up','give in','give out','give back','give away',
  'take off','take on','take over','take up','take out','take back','take down',
  'get up','get out','get over','get through','get along','get away','get back','get down',
  'put off','put on','put up','put down','put away','put out','put through',
  'come up','come out','come back','come over','come across','come down','come in',
  'go on','go out','go back','go over','go through','go down','go up','go away',
  'turn on','turn off','turn up','turn down','turn out','turn around',
  'look up','look out','look after','look back','look into','look over',
  'run out','run into','run away','run over','run through',
  'set up','set out','set back','set off','set aside',
  'break up','break down','break out','break in','break through','break off',
  'bring up','bring out','bring back','bring down','bring about',
  'carry on','carry out','figure out','find out','hang out','hang up',
  'hold on','hold off','hold up','keep up','keep on','make up','make out',
  'move on','move out','pass out','pass on','pay off','pay back',
  'pick up','pick out','pull off','pull out','pull through',
  'show up','show off','throw away','throw out','throw up',
  'wake up','work out','work on','wrap up','catch up',
  'check in','check out','cut off','cut down','deal with',
  'end up','feel like','fill in','fill out','fit in','fix up',
  'hold back','let down','let go','let out','leave out',
]);

/**
 * 문장에서 퀴즈용 청크 배열을 반환한다.
 *
 * @param {Object} expression  — getExpressions()가 반환한 항목
 * @returns {Array<{en:string, kr:string}>}  최소 2개, 최대 6개
 */
export function buildChunks(expression) {
  // 1. processed 청크 있으면 우선 사용
  if (expression.chunks?.length >= 2) {
    return expression.chunks.map(c => ({ en: c.en, kr: c.kr ?? '' }));
  }

  // 2. 로컬 규칙 기반 생성
  return buildChunksFromText(expression.en);
}

/**
 * 텍스트에서 규칙 기반으로 청크 생성
 * @param {string} text
 * @returns {Array<{en:string, kr:string}>}
 */
export function buildChunksFromText(text) {
  if (!text) return [];

  // 구동사를 먼저 토큰으로 치환해 분리 방지
  let guarded = text;
  const pvMap = {};
  [...PHRASAL_VERBS].forEach((pv, i) => {
    const re = new RegExp(`\\b${pv.replace(' ', '\\s+')}\\b`, 'gi');
    if (re.test(guarded)) {
      const key = `__PV${i}__`;
      pvMap[key] = pv;
      guarded = guarded.replace(re, key);
    }
  });

  // 접속사·관계사·전치사 기준 분리
  const SPLITTERS = /\b(that|which|who|whom|whose|because|but|and|so|if|when|although|though|while|since|before|after|until|unless|without)\b/gi;
  const parts = guarded
    .split(SPLITTERS)
    .map(s => s.trim())
    .filter(s => s.length > 1);

  // 구동사 복원
  const restored = parts.map(p => {
    let r = p;
    Object.entries(pvMap).forEach(([k, v]) => { r = r.replace(k, v); });
    return r;
  });

  // 2~4단어 단위로 청크 병합
  const chunks = [];
  let buf = '';

  restored.forEach(part => {
    const isSplitter = /^(that|which|who|whom|whose|because|but|and|so|if|when|although|though|while|since|before|after|until|unless|without)$/i.test(part);
    if (isSplitter) {
      if (buf) buf += ' ' + part;
      else buf = part;
      return;
    }
    if (!buf) { buf = part; return; }
    const wc = buf.split(/\s+/).length;
    if (wc >= 2) { chunks.push(buf.trim()); buf = part; }
    else { buf += ' ' + part; }
  });
  if (buf.trim()) chunks.push(buf.trim());

  // 최소 2개 보장: 분리 안 되면 절반씩 자르기
  if (chunks.length < 2) {
    const words = text.trim().split(/\s+/);
    const mid   = Math.ceil(words.length / 2);
    return [
      { en: words.slice(0, mid).join(' '), kr: '' },
      { en: words.slice(mid).join(' '),    kr: '' },
    ];
  }

  return chunks.slice(0, 6).map(c => ({ en: c, kr: '' }));
}

/**
 * 청크 배열을 무작위로 섞는다 (덩어리 조립 퀴즈용)
 * @param {Array} chunks
 * @returns {Array}  섞인 복사본
 */
export function shuffleChunks(chunks) {
  const arr = [...chunks];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // 원본 순서와 동일하면 한 번 더 섞기
  if (arr.every((c, i) => c.en === chunks[i].en)) {
    const first = arr.shift();
    arr.push(first);
  }
  return arr;
}

/**
 * Focus Typing 퀴즈용: 빈칸 대상 청크 인덱스 선택
 * 구동사·동사구 포함 청크를 우선 선택, 없으면 가장 긴 청크
 * @param {Array<{en:string}>} chunks
 * @returns {number}  빈칸으로 만들 청크 인덱스
 */
export function pickBlankIndex(chunks) {
  // 구동사 포함 청크 우선
  for (let i = 0; i < chunks.length; i++) {
    const lower = chunks[i].en.toLowerCase();
    for (const pv of PHRASAL_VERBS) {
      if (lower.includes(pv)) return i;
    }
  }
  // 없으면 가장 긴 청크
  let maxLen = 0, maxIdx = 0;
  chunks.forEach((c, i) => {
    if (c.en.length > maxLen) { maxLen = c.en.length; maxIdx = i; }
  });
  return maxIdx;
}
