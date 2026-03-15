import"./modulepreload-polyfill-B5Qt9EMX.js";import{t as h,b as v,f as E}from"./expressionManager-BKBnNKJn.js";import{s as I,K as S}from"./storage-D5mgx_HQ.js";let o=[],b=[],l="all",d=null,$=null;function w(){var t,e;return new Set(((e=(t=I(S.PROGRESS,null))==null?void 0:t.data)==null?void 0:e.learned_ids)??[])}function y(){o=v({includeBuiltin:!0}),applyFilter(),x()}function x(){const t=w();document.getElementById("statTotal").textContent=o.length,document.getElementById("statMine").textContent=o.filter(e=>e.source!=="builtin").length,document.getElementById("statLearned").textContent=o.filter(e=>t.has(e.id)).length,document.getElementById("statFav").textContent=o.filter(e=>e.is_favorite).length}window.setFilter=function(t){l=t,document.querySelectorAll(".f-tab").forEach(e=>e.classList.toggle("active",e.dataset.filter===t)),applyFilter()};window.applyFilter=function(){const t=document.getElementById("searchInput").value.toLowerCase(),e=w();b=o.filter(s=>!(l==="manual"&&s.source!=="manual"||l==="youtube"&&s.source!=="youtube"||l==="builtin"&&s.source!=="builtin"||l==="fav"&&!s.is_favorite||t&&!s.en.toLowerCase().includes(t)&&!(s.kr??"").includes(t))),k(b,e)};function k(t,e){const s=document.getElementById("listWrap");if(!t.length){s.innerHTML=`
      <div class="empty">
        <div class="empty-icon">${l==="fav"?"⭐":"📭"}</div>
        <div class="empty-text">${l==="fav"?"즐겨찾기가 없어요":"문장이 없어요"}<br>새 문장을 추가해보세요!</div>
        <button class="empty-btn" onclick="location.href='add.html'">✏️ 문장 추가</button>
      </div>`;return}s.innerHTML="",t.forEach((n,c)=>{const u=e.has(n.id),m=n.is_favorite,p=n.source==="youtube"?"▶️ 유튜브":n.source==="builtin"?"🌟 원어민":"✏️ 직접",f=n.source==="youtube"?"badge-youtube":n.source==="builtin"?"badge-builtin":"badge-manual",r=n.created_at?new Date(n.created_at).toLocaleDateString("ko-KR",{month:"short",day:"numeric"}):"",a=document.createElement("div");a.className=`expr-card source-${n.source??"manual"}`,a.style.animationDelay=`${c*.03}s`,a.id=`card_${n.id}`,a.innerHTML=`
      <div class="expr-top">
        <div class="expr-en">${n.en}</div>
        <div class="expr-actions">
          <button class="action-btn btn-fav ${m?"on":""}"
            onclick="toggleFav('${n.id}', this)">⭐</button>
          <button class="action-btn btn-quiz"
            onclick="startQuizFor('${n.id}')">퀴즈</button>
          ${n.source!=="builtin"?`<button class="action-btn btn-del" onclick="confirmDelete('${n.id}')">🗑️</button>`:""}
        </div>
      </div>
      ${n.kr?`<div class="expr-kr">${n.kr}</div>`:""}
      ${n.memo?`<div class="expr-memo">💡 ${n.memo}</div>`:""}
      <div class="expr-footer">
        <span class="expr-badge ${f}">${p}</span>
        ${u?'<span class="expr-badge badge-learned">✅ 학습완료</span>':""}
        ${r?`<span class="expr-date">${r}</span>`:""}
        ${n.source!=="builtin"?`<span class="expr-date" style="cursor:pointer;color:var(--p);" onclick="toggleEdit('${n.id}')">✏️ 수정</span>`:""}
      </div>
      <div class="edit-wrap" id="edit_${n.id}">
        <input class="edit-input" id="editEn_${n.id}"  value="${n.en.replace(/"/g,"&quot;")}"  placeholder="영어 문장">
        <input class="edit-input" id="editKr_${n.id}"  value="${(n.kr??"").replace(/"/g,"&quot;")}" placeholder="한글 뜻">
        <input class="edit-input" id="editMemo_${n.id}" value="${(n.memo??"").replace(/"/g,"&quot;")}" placeholder="메모/해설">
        <button class="edit-save" onclick="saveEdit('${n.id}')">✅ 저장</button>
      </div>`,s.appendChild(a)})}window.toggleFav=function(t,e){const s=h(t);s!==null&&(e.classList.toggle("on",s),o=v({includeBuiltin:!0}),x())};window.confirmDelete=function(t){d=t,E(t);const e=document.getElementById(`card_${t}`);e&&(e.style.opacity="0",e.style.transform="translateX(-20px)",e.style.transition="all 0.3s",setTimeout(()=>e.remove(),300)),o=v({includeBuiltin:!0}),x();const s=document.getElementById("deletToast");s.classList.add("show"),clearTimeout($),$=setTimeout(()=>{s.classList.remove("show"),d=null},4e3)};window.undoDelete=function(){var t;if(d){try{const e=JSON.parse(localStorage.getItem("speaky_raw_expressions")||"null");if((t=e==null?void 0:e.data)!=null&&t.expressions){const s=e.data.expressions.findIndex(n=>n.id===d);s>=0&&(e.data.expressions[s].is_deleted=!1,delete e.data.expressions[s].deleted_at,localStorage.setItem("speaky_raw_expressions",JSON.stringify(e)))}}catch(e){console.warn(e)}document.getElementById("deletToast").classList.remove("show"),d=null,y()}};window.toggleEdit=function(t){const e=document.getElementById(`edit_${t}`);e==null||e.classList.toggle("show")};window.saveEdit=function(t){var c,u,m,p,f,r;const e=(c=document.getElementById(`editEn_${t}`))==null?void 0:c.value.trim(),s=(u=document.getElementById(`editKr_${t}`))==null?void 0:u.value.trim(),n=(m=document.getElementById(`editMemo_${t}`))==null?void 0:m.value.trim();if(!e){alert("영어 문장을 입력해주세요");return}try{const a=JSON.parse(localStorage.getItem("speaky_raw_expressions")||"null");if((p=a==null?void 0:a.data)!=null&&p.expressions){const i=a.data.expressions.findIndex(g=>g.id===t);i>=0&&(a.data.expressions[i].en=e,a.data.expressions[i].memo=n,a.data.expressions[i].memo_edited=new Date().toISOString(),localStorage.setItem("speaky_raw_expressions",JSON.stringify(a)))}}catch(a){console.warn(a)}if(s)try{const a=JSON.parse(localStorage.getItem("speaky_processed")||"null"),i=((f=a==null?void 0:a.data)==null?void 0:f.expressions)??[],g=i.findIndex(_=>_.id===t);g>=0?i[g].kr=s:i.push({id:t,kr:s}),localStorage.setItem("speaky_processed",JSON.stringify({schema_version:"1.0",saved_at:new Date().toISOString(),data:{expressions:i}}))}catch(a){console.warn(a)}(r=document.getElementById(`edit_${t}`))==null||r.classList.remove("show"),y()};window.startQuizFor=function(t){sessionStorage.setItem("speaky_quiz_expr_id",t),location.href="quiz.html?single="+t};y();
