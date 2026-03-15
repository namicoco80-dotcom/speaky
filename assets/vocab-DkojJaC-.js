import"./storage-87WKI6EC.js";import{b as m}from"./expressionManager-DSltZ7hA.js";let c=[],d="all",s=!0;function u(){const t=m({includeBuiltin:!0}),e=new Map;return t.forEach(n=>{(n.vocab??[]).forEach(o=>{const l=(o.word||o.phrase||"").toLowerCase();if(!l)return;e.has(l)||e.set(l,{word:o.word||o.phrase,type:o.type??"expr",kr:o.kr??"",examples:[]});const r=e.get(l);r.examples.find(p=>p.en===n.en)||r.examples.push({en:n.en,kr:n.kr??""})})}),Array.from(e.values())}function y(t){document.getElementById("statTotal").textContent=t.length,document.getElementById("statPhrv").textContent=t.filter(e=>e.type==="phrv").length,document.getElementById("statIdiom").textContent=t.filter(e=>e.type==="idiom").length,document.getElementById("statExpr").textContent=t.filter(e=>e.type==="expr").length,document.getElementById("totalBadge").textContent=t.length+"개"}function f(t){const e=document.getElementById("vocabList");if(!t.length){e.innerHTML=`
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p>단어가 없어요.<br>문장을 추가하면 자동으로 쌓여요!</p>
      </div>`;return}e.innerHTML="",t.forEach((n,a)=>{const o=document.createElement("div");o.className="vocab-card",o.dataset.type=n.type,o.style.animationDelay=`${a*.03}s`;const l=n.examples.slice(0,3).map(r=>`
      <div class="example-item">
        <div class="example-en">${r.en}</div>
        ${r.kr?`<div class="example-kr">${r.kr}</div>`:""}
      </div>
    `).join("");o.innerHTML=`
      <div class="vocab-top">
        <div class="vocab-word">${n.word}</div>
        <div class="type-badge ${n.type}">${g(n.type)}</div>
      </div>
      <div class="vocab-kr">${n.kr}</div>
      <div class="vocab-examples">
        <div style="font-size:11px;font-weight:800;color:var(--text-muted);margin-bottom:6px;">📝 사용된 문장</div>
        ${l}
        <button class="quiz-mini-btn">🎮 이 단어로 퀴즈</button>
      </div>
    `,o.addEventListener("click",()=>o.classList.toggle("expanded")),e.appendChild(o)})}function g(t){return{phrv:"구동사",idiom:"관용구",expr:"표현",v:"동사",n:"명사",adj:"형용사",adv:"부사"}[t]??t}function i(){const t=document.getElementById("searchInput").value.toLowerCase();let e=c.filter(n=>d==="all"||n.type===d).filter(n=>!t||n.word.toLowerCase().includes(t)||n.kr.includes(t));s?e.sort((n,a)=>n.word.localeCompare(a.word)):e.sort((n,a)=>a.examples.length-n.examples.length),f(e)}window.setType=function(t){d=t,document.querySelectorAll(".filter-chip").forEach(e=>e.classList.toggle("active",e.dataset.type===t)),i()};window.toggleSort=function(){s=!s,document.querySelector(".sort-btn").textContent=s?"정렬 A→Z":"정렬 많은순",i()};window.applyFilter=i;c=u();y(c);i();
