/**
 * ⚡ SPEAKY — quizGenerator.js
 * 4가지 퀴즈 방식의 문제를 생성한다.
 *
 * 방식:
 *   1. chunk_scramble     — 덩어리 조립
 *   2. focus_typing       — 핵심 타이핑 (빈칸)
 *   3. listening_dictation — 리스닝 받아쓰기
 *   4. meaning_match      — 의미 매칭
 */

import { buildChunks, shuffleChunks, pickBlankIndex } from './chunkBuilder.js';
import { getExpressions } from './expressionManager.js';
import { getUnlearnedIds, getRecentWrongIds } from './scoreTracker.js';

// ── 유틸 ────────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr, n) {
  return shuffle(arr).slice(0, n);
}

/**
 * 퀴즈용 문장 목록 준비
 * 학습 안 된 것 우선, 섞어서 N개 반환
 *
 * @param {number} count
 * @param {string|null} folderId
 * @returns {Array}
 */
export function prepareExpressions(count = 10, folderId = null) {
  const all    = getExpressions({ folder_id: folderId, includeBuiltin: true });
  const allIds = all.map(e => e.id);

  const unlearned  = new Set(getUnlearnedIds(allIds));
  const recentWrong = new Set(getRecentWrongIds(allIds));

  // 우선순위:
  // 1) 최근 오답 (틀렸으니 다시 출제)
  // 2) 사용자 추가 문장 + 미학습
  // 3) 내장 문장 + 미학습
  // 4) 사용자 추가 문장 + 학습완료
  // 5) 내장 문장 + 학습완료
  const p1 = all.filter(e => recentWrong.has(e.id));
  const p2 = all.filter(e => !recentWrong.has(e.id) && e.source !== 'builtin' && unlearned.has(e.id));
  const p3 = all.filter(e => !recentWrong.has(e.id) && e.source === 'builtin' && unlearned.has(e.id));
  const p4 = all.filter(e => !recentWrong.has(e.id) && e.source !== 'builtin' && !unlearned.has(e.id));
  const p5 = all.filter(e => !recentWrong.has(e.id) && e.source === 'builtin' && !unlearned.has(e.id));

  const pool = [
    ...shuffle(p1),
    ...shuffle(p2),
    ...shuffle(p3),
    ...shuffle(p4),
    ...shuffle(p5),
  ].slice(0, count);

  return pool;
}

// ════════════════════════════════════════════════════════════════════════════
// 1. 덩어리 조립 (Chunk Scramble)
// ════════════════════════════════════════════════════════════════════════════

/**
 * @param {Object} expression
 * @returns {{
 *   type: 'chunk_scramble',
 *   expressionId: string,
 *   sentence: string,
 *   kr: string,
 *   chunks: Array<{en,kr}>,       ← 정답 순서
 *   shuffled: Array<{en,kr,idx}>, ← 섞인 순서 (idx = 정답 인덱스)
 * }}
 */
export function generateChunkScramble(expression) {
  const chunks = buildChunks(expression);
  const shuffled = shuffleChunks(chunks).map((c, i) => ({
    ...c,
    idx: chunks.findIndex(orig => orig.en === c.en),
  }));

  return {
    type        : 'chunk_scramble',
    expressionId: expression.id,
    sentence    : expression.en,
    kr          : expression.kr ?? '',
    memo        : expression.memo ?? '',
    chunks,       // 정답 순서
    shuffled,     // 섞인 상태로 화면에 표시
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 2. 핵심 타이핑 (Focus Typing)
// ════════════════════════════════════════════════════════════════════════════

/**
 * @param {Object} expression
 * @returns {{
 *   type: 'focus_typing',
 *   expressionId: string,
 *   parts: Array<{text:string, isBlank:boolean}>,
 *   answer: string,   ← 빈칸 정답
 *   sentence: string,
 *   kr: string,
 * }}
 */
export function generateFocusTyping(expression) {
  const chunks   = buildChunks(expression);
  const blankIdx = pickBlankIndex(chunks);
  const answer   = chunks[blankIdx].en;

  // 문장을 "앞부분 … [빈칸] … 뒷부분" 형태로 분리
  const parts = chunks.map((c, i) => ({
    text    : c.en,
    isBlank : i === blankIdx,
  }));

  return {
    type        : 'focus_typing',
    expressionId: expression.id,
    sentence    : expression.en,
    kr          : expression.kr ?? '',
    memo        : expression.memo ?? '',
    parts,
    answer,
    hint        : answer[0] + '_'.repeat(Math.max(0, answer.length - 1)), // 첫 글자 힌트
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 3. 리스닝 받아쓰기 (Listening Dictation)
// ════════════════════════════════════════════════════════════════════════════

/**
 * @param {Object} expression
 * @returns {{
 *   type: 'listening_dictation',
 *   expressionId: string,
 *   sentence: string,     ← TTS로 읽어줄 문장
 *   kr: string,
 *   shuffled: Array<{en,kr,idx}>,  ← 단어 섞인 배열
 *   words: string[],      ← 정답 단어 순서
 * }}
 */
export function generateListeningDictation(expression) {
  const words    = expression.en.trim().split(/\s+/);
  const indexed  = words.map((w, i) => ({ en: w, idx: i }));
  const shuffled = shuffle(indexed);

  return {
    type        : 'listening_dictation',
    expressionId: expression.id,
    sentence    : expression.en,
    kr          : expression.kr ?? '',
    memo        : expression.memo ?? '',
    words,      // 정답 순서
    shuffled,   // 섞인 상태
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 4. 의미 매칭 (Meaning Match)
// ════════════════════════════════════════════════════════════════════════════

/**
 * N개의 문장을 받아 영어↔한글 매칭 퀴즈 세트를 만든다.
 *
 * @param {Object[]} expressions  — 4~6개 권장
 * @returns {{
 *   type: 'meaning_match',
 *   pairs: Array<{id, en, kr}>,
 *   enItems: Array<{id, text}>,   ← 왼쪽 영어 목록 (섞임)
 *   krItems: Array<{id, text}>,   ← 오른쪽 한글 목록 (섞임)
 * }}
 */
export function generateMeaningMatch(expressions) {
  // kr 없는 것 제외
  const valid = expressions.filter(e => e.kr?.trim());
  const pool  = pick(valid, Math.min(valid.length, 5));

  // kr 없으면 영어 절반으로 대체 (임시)
  const pairs = pool.map(e => ({
    id : e.id,
    en : e.en.length > 40 ? e.en.slice(0, 37) + '...' : e.en,
    kr : e.kr,
  }));

  return {
    type    : 'meaning_match',
    pairs,
    enItems : shuffle(pairs.map(p => ({ id: p.id, text: p.en }))),
    krItems : shuffle(pairs.map(p => ({ id: p.id, text: p.kr }))),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 세션 생성 (여러 문제를 한 번에)
// ════════════════════════════════════════════════════════════════════════════

/**
 * 퀴즈 세션 전체를 생성한다.
 *
 * @param {Object} options
 * @param {string}  options.quizType    퀴즈 방식
 * @param {number}  [options.count=10]  문제 수
 * @param {string}  [options.folderId]  폴더 필터
 * @returns {Array}  문제 배열
 */
export function generateSession({ quizType, count = 10, folderId = null }) {
  // 실제 문장 수보다 많은 문제 수 요청 시 자동 제한 (중복 방지)
  const allExprs = getExpressions({ folder_id: folderId, includeBuiltin: true });
  const safeCount = Math.min(count, allExprs.length);
  const exprs = prepareExpressions(safeCount, folderId);

  if (!exprs.length) return [];

  switch (quizType) {
    case 'chunk_scramble':
      return exprs.map(generateChunkScramble);

    case 'focus_typing':
      return exprs.map(generateFocusTyping);

    case 'listening_dictation':
      return exprs.map(generateListeningDictation);

    case 'meaning_match': {
      // 4~5개씩 묶어서 세트 생성
      const sets = [];
      for (let i = 0; i < exprs.length; i += 5) {
        sets.push(generateMeaningMatch(exprs.slice(i, i + 5)));
      }
      return sets;
    }

    default:
      return exprs.map(generateChunkScramble);
  }
}

// ── 정답 체크 ────────────────────────────────────────────────────────────────

/**
 * 답안을 채점한다.
 *
 * @param {Object} question  — generateXxx()의 반환값
 * @param {*}      answer    — 사용자 입력
 * @returns {{ correct: boolean, score: number, feedback: string }}
 */
export function checkAnswer(question, answer) {
  switch (question.type) {

    case 'chunk_scramble': {
      // answer: 사용자가 배열한 청크 인덱스 배열 (정답 순서와 비교)
      const correctOrder = question.chunks.map((_, i) => i);
      const correct = JSON.stringify(answer) === JSON.stringify(correctOrder);
      return {
        correct,
        score   : correct ? 100 : 0,
        feedback: correct
          ? `Great job! 🐶 "${question.sentence}"`
          : `Don't worry, let's check this! ✨\n정답: ${question.sentence}${question.memo ? '\n💡 ' + question.memo : ''}`,
      };
    }

    case 'focus_typing': {
      // answer: 사용자가 입력한 텍스트
      const userAns    = String(answer).trim().toLowerCase();
      const correctAns = question.answer.trim().toLowerCase();
      const correct    = userAns === correctAns;
      // 부분 점수: 단어 일치율
      const score = correct ? 100 : calcPartialScore(userAns, correctAns);
      return {
        correct,
        score,
        feedback: correct
          ? `Great job! 🐶`
          : `Don't worry, let's check this! ✨\n정답: "${question.answer}"${question.memo ? '\n💡 ' + question.memo : ''}`,
      };
    }

    case 'listening_dictation': {
      // answer: 사용자가 배열한 단어 인덱스 배열
      const correctOrder = question.words.map((_, i) => i);
      const correct = JSON.stringify(answer) === JSON.stringify(correctOrder);
      return {
        correct,
        score   : correct ? 100 : 0,
        feedback: correct
          ? `Great job! 🐶 Perfect listening!`
          : `Don't worry! 정답: ${question.sentence}`,
      };
    }

    case 'meaning_match': {
      // answer: [{ enId, krId }] 매칭 결과
      const total   = question.pairs.length;
      const matched = answer.filter(a => a.enId === a.krId).length;
      const correct = matched === total;
      const score   = Math.round((matched / total) * 100);
      return {
        correct,
        score,
        feedback: correct
          ? `Great job! 🐶 All matched!`
          : `${matched}/${total} 정답! 다시 확인해봐요 ✨`,
      };
    }

    default:
      return { correct: false, score: 0, feedback: '알 수 없는 퀴즈 유형' };
  }
}

// 부분 점수 계산 (레벤슈타인 기반 간이 버전)
function calcPartialScore(user, correct) {
  if (!correct.length) return 0;
  let matches = 0;
  const min   = Math.min(user.length, correct.length);
  for (let i = 0; i < min; i++) {
    if (user[i] === correct[i]) matches++;
  }
  return Math.round((matches / correct.length) * 80); // 최대 80점 (완전 정답만 100)
}
