import"./modulepreload-polyfill-B5Qt9EMX.js";import{b as w}from"./expressionManager-BKBnNKJn.js";import{g as y}from"./settingsManager-B44Cy7pt.js";import"./storage-D5mgx_HQ.js";function v(){const n=w({includeBuiltin:!0}),e=new Map;return n.forEach(t=>{(t.vocab??[]).forEach(o=>{const s=(o.word||o.phrase||"").toLowerCase();if(!s||!o.kr)return;e.has(s)||e.set(s,{word:o.word||o.phrase,type:o.type??"expr",kr:o.kr,examples:[]});const c=e.get(s);c.examples.find(h=>h.en===t.en)||c.examples.push({en:t.en,kr:t.kr??""})})}),[...e.values()].filter(t=>t.kr&&t.kr.trim())}function m(n){const e=[...n];for(let t=e.length-1;t>0;t--){const o=Math.floor(Math.random()*(t+1));[e[t],e[o]]=[e[o],e[t]]}return e}let a="",r=[],i=0,l=[],d=null,u=!1;function p(n){document.querySelectorAll(".screen").forEach(e=>e.classList.remove("active")),document.getElementById(n).classList.add("active")}window.startQuiz=function(n){a=n;const e=v();if(e.length<4){alert("단어가 4개 이상 필요해요! 문장을 더 추가해주세요.");return}r=m(e).slice(0,10).map(t=>{if(a==="meaning"){const o=m(e.filter(c=>c.word!==t.word)).slice(0,3),s=m([t,...o]);return{vocab:t,choices:s,type:"meaning"}}else return{vocab:t,type:"spell"}}),i=0,l=[],document.getElementById("headerTitle").textContent=a==="meaning"?"🎯 뜻 맞추기":"✍️ 철자 쓰기",p("screenQuiz"),f()};function f(){const n=r[i];u=!1,d=null,document.getElementById("progressText").textContent=`${i+1} / ${r.length}`,document.getElementById("progFill").style.width=`${(i+1)/r.length*100}%`;const e=document.getElementById("submitBtn");e.className="submit-btn gray",e.textContent="✅ 정답 확인",a==="meaning"?k(n):x(n)}function k(n){const e=n.choices.map((t,o)=>`<button class="choice-btn" id="choice_${o}" onclick="selectChoice(${o})">${t.kr}</button>`).join("");document.getElementById("quizContent").innerHTML=`
    <div class="quiz-card">
      <div class="quiz-type-badge" style="background:var(--p-light);color:var(--p);">🎯 뜻 맞추기</div>
      <div class="quiz-word">${n.vocab.word}</div>
      <div class="quiz-type-lbl">${g(n.vocab.type)}</div>
      <div class="quiz-hint">이 단어/표현의 뜻은?</div>
    </div>
    <div class="quiz-card">
      <div class="choices">${e}</div>
    </div>
    <div class="feedback-card" id="feedbackCard"></div>`}window.selectChoice=function(n){if(u)return;d=n,document.querySelectorAll(".choice-btn").forEach(o=>o.style.borderColor="");const e=document.getElementById(`choice_${n}`);e.style.borderColor="var(--p)",e.style.background="var(--p-light)";const t=document.getElementById("submitBtn");t.className="submit-btn",t.textContent="✅ 정답 확인"};function x(n){const e=n.vocab.word.length>3?n.vocab.word[0]+"_".repeat(n.vocab.word.length-1):"_ ".repeat(n.vocab.word.length);document.getElementById("quizContent").innerHTML=`
    <div class="quiz-card">
      <div class="quiz-type-badge" style="background:var(--y-light);color:var(--y-dark);">✍️ 철자 쓰기</div>
      <div class="spell-kr">${n.vocab.kr}</div>
      <div class="spell-hint">힌트: ${e} (${n.vocab.word.length}글자)</div>
      <div class="quiz-type-lbl">${g(n.vocab.type)}</div>
    </div>
    <div class="quiz-card">
      <input class="spell-input" id="spellInput" placeholder="영어로 입력하세요..."
        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
        oninput="onSpellInput(this)"
        onkeydown="if(event.key==='Enter') submitAnswer()">
    </div>
    <div class="feedback-card" id="feedbackCard"></div>`,setTimeout(()=>{var t;return(t=document.getElementById("spellInput"))==null?void 0:t.focus()},100)}window.onSpellInput=function(n){const e=document.getElementById("submitBtn");n.value.trim().length>0?e.className="submit-btn":e.className="submit-btn gray"};window.submitAnswer=function(){if(u){b();return}const n=r[i];let e=!1;if(a==="meaning"){if(d===null)return;e=n.choices[d].word===n.vocab.word,n.choices.forEach((o,s)=>{const c=document.getElementById(`choice_${s}`);c&&(c.disabled=!0,c.style.borderColor="",c.style.background="",o.word===n.vocab.word?c.classList.add("show-correct"):s===d&&!e&&c.classList.add("wrong"))})}else{const o=document.getElementById("spellInput");e=((o==null?void 0:o.value.trim().toLowerCase())??"")===n.vocab.word.toLowerCase(),o&&(o.disabled=!0,o.classList.add(e?"correct":"wrong"))}u=!0,l.push({correct:e}),I(e),E(n.vocab,e);const t=document.getElementById("submitBtn");t.className="submit-btn",t.textContent=i>=r.length-1?"결과 보기 🏆":"다음 →"};function E(n,e){const t=document.getElementById("feedbackCard");if(!t)return;t.className=`feedback-card show ${e?"correct-fb":"wrong-fb"}`;const o=n.examples.slice(0,2).map(s=>`
    <div class="fb-example">
      <div class="fb-ex-en">${s.en}</div>
      ${s.kr?`<div class="fb-ex-kr">${s.kr}</div>`:""}
    </div>`).join("");t.innerHTML=`
    <span class="fb-emoji">${e?"🎉":"💪"}</span>
    <div class="fb-title">${e?"정답이에요!":"이렇게 써요!"}</div>
    <div class="fb-word">${n.word}</div>
    <div class="fb-kr">${n.kr}</div>
    ${o}
    <button class="fb-tts" onclick="speakWord('${n.word.replace(/'/g,"\\'")}')">🔊 발음 듣기</button>`}function I(n){try{const e=new(window.AudioContext||window.webkitAudioContext),t=e.createOscillator(),o=e.createGain();t.connect(o),o.connect(e.destination),n?(t.type="sine",t.frequency.setValueAtTime(523,e.currentTime),t.frequency.setValueAtTime(784,e.currentTime+.12),o.gain.setValueAtTime(.3,e.currentTime),o.gain.exponentialRampToValueAtTime(.001,e.currentTime+.35),t.start(e.currentTime),t.stop(e.currentTime+.35)):(t.type="sine",t.frequency.setValueAtTime(200,e.currentTime),o.gain.setValueAtTime(.2,e.currentTime),o.gain.exponentialRampToValueAtTime(.001,e.currentTime+.25),t.start(e.currentTime),t.stop(e.currentTime+.25))}catch{}}window.speakWord=function(n){if(!("speechSynthesis"in window))return;const e=y();speechSynthesis.cancel();const t=new SpeechSynthesisUtterance(n);t.lang=e.tts_accent==="uk"?"en-GB":"en-US",t.rate=e.tts_speed??1,speechSynthesis.speak(t)};function b(){if(i++,i>=r.length){B();return}f()}window.nextQuestion=b;function B(){const n=l.filter(s=>s.correct).length,e=l.length-n,t=Math.round(n/l.length*100),o=t>=90?"🏆":t>=70?"🎉":t>=50?"💪":"📖";document.getElementById("resultEmoji").textContent=o,document.getElementById("resultScore").textContent=t,document.getElementById("resCorrect").textContent=n,document.getElementById("resWrong").textContent=e,document.getElementById("resTotal").textContent=l.length,p("screenResult")}window.retryQuiz=function(){p("screenSelect"),document.getElementById("headerTitle").textContent="🔤 단어 퀴즈",document.getElementById("progressText").textContent="",document.getElementById("progFill").style.width="0%"};function g(n){return{phrv:"구동사",idiom:"관용구",expr:"표현",v:"동사",n:"명사",adj:"형용사",adv:"부사"}[n]??n}
