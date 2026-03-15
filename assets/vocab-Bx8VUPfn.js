import"./modulepreload-polyfill-B5Qt9EMX.js";import{b as m}from"./expressionManager-BKBnNKJn.js";import"./storage-D5mgx_HQ.js";let c=[],d="all",l=!0;function u(){const t=m({includeBuiltin:!0}),e=new Map;return t.forEach(n=>{(n.vocab??[]).forEach(o=>{const a=(o.word||o.phrase||"").toLowerCase();if(!a)return;e.has(a)||e.set(a,{word:o.word||o.phrase,type:o.type??"expr",kr:o.kr??"",examples:[]});const i=e.get(a);i.examples.find(p=>p.en===n.en)||i.examples.push({en:n.en,kr:n.kr??""})})}),Array.from(e.values())}function y(t){document.getElementById("statTotal").textContent=t.length,document.getElementById("statPhrv").textContent=t.filter(e=>e.type==="phrv").length,document.getElementById("statIdiom").textContent=t.filter(e=>e.type==="idiom").length,document.getElementById("statExpr").textContent=t.filter(e=>e.type==="expr").length,document.getElementById("totalBadge").textContent=t.length+"개"}function f(t){const e=document.getElementById("vocabList");if(!t.length){e.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p>단어가 없어요.<br>문장을 추가하면 자동으로 쌓여요!</p>
      </div>`;return}e.innerHTML="",t.forEach((n,r)=>{const o=document.createElement("div");o.className="vocab-card",o.dataset.type=n.type,o.style.animationDelay=`${r*.03}s`;const a=n.examples.slice(0,3).map(i=>`
      <div class="example-item">
        <div class="example-en">${i.en}</div>
        ${i.kr?`<div class="example-kr">${i.kr}</div>`:""}
      </div>
    `).join("");o.innerHTML=`
      <div class="vocab-top">
        <div class="vocab-word">${n.word}</div>
        <div class="type-badge ${n.type}">${g(n.type)}</div>
      </div>
      <div class="vocab-kr">${n.kr}</div>
      <div class="vocab-examples">
        <div style="font-size:11px;font-weight:800;color:var(--text-muted);margin-bottom:6px;">📝 사용된 문장</div>
        ${a}
        <button class="quiz-mini-btn">🎮 이 단어로 퀴즈</button>
      </div>
    `,o.addEventListener("click",()=>o.classList.toggle("expanded")),e.appendChild(o)})}function g(t){return{phrv:"구동사",idiom:"관용구",expr:"표현",v:"동사",n:"명사",adj:"형용사",adv:"부사"}[t]??t}function s(){const t=document.getElementById("searchInput").value.toLowerCase();let e=c.filter(n=>d==="all"||n.type===d).filter(n=>!t||n.word.toLowerCase().includes(t)||n.kr.includes(t));l?e.sort((n,r)=>n.word.localeCompare(r.word)):e.sort((n,r)=>r.examples.length-n.examples.length),f(e)}window.setType=function(t){d=t,document.querySelectorAll(".filter-chip").forEach(e=>e.classList.toggle("active",e.dataset.type===t)),s()};window.toggleSort=function(){l=!l,document.querySelector(".sort-btn").textContent=l?"정렬 A→Z":"정렬 많은순",s()};window.applyFilter=s;c=u();y(c);s();
