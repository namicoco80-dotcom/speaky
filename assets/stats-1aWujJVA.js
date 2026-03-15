import{s as h,K as v}from"./storage-87WKI6EC.js";import{g as k}from"./expressionManager-DSltZ7hA.js";function p(){var d,m,g;const e=((d=h(v.PROGRESS,null))==null?void 0:d.data)??{},t=((m=h(v.STREAK,null))==null?void 0:m.data)??{},o=k(!0),a=((g=e.learned_ids)==null?void 0:g.length)??0,n=e.quiz_history??[],l=t.current??0,c=t.best??0,r=t.week_log??[],i=n.filter(f=>f.correct).length,u=n.length?Math.round(i/n.length*100):0;return{total:o,learned:a,history:n,streakCur:l,streakBest:c,weekData:r,accPct:u}}function y(e,t,o){document.getElementById(t).textContent=o+"%",setTimeout(()=>{document.getElementById(e).style.width=o+"%"},100)}function B(e){const t=new Date,o=["일","월","화","수","목","금","토"],a=document.getElementById("weekGrid");a.innerHTML="";const n=Array.from({length:7},(c,r)=>{const i=new Date(t);i.setDate(i.getDate()-(6-r));const u=i.toISOString().slice(0,10),d=e.find(m=>m.date===u);return{day:o[i.getDay()],count:(d==null?void 0:d.count)??0,isToday:r===6}}),l=Math.max(...n.map(c=>c.count),1);n.forEach(c=>{const r=document.createElement("div");r.className="week-col";const i=Math.round(c.count/l*100);r.innerHTML=`
      <div class="week-bar-wrap">
        <div class="week-bar${c.isToday?" today":""}"
          style="height:${i}%"></div>
      </div>
      <div class="week-day">${c.day}</div>
      <div class="week-num${c.isToday?" today":""}">${c.count}</div>
    `,a.appendChild(r)})}function $(e){const t=document.getElementById("historyList"),o=e.slice(-5).reverse();if(!o.length){t.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-muted);font-weight:700;font-size:13px;">아직 퀴즈 기록이 없어요 🎮</div>';return}const a={chunk_scramble:"덩어리 조립",focus_typing:"핵심 타이핑",listening_dictation:"리스닝",meaning_match:"의미 매칭"};t.innerHTML=o.map(n=>{const l=n.score>=80?"high":n.score>=50?"mid":"low",c=E(n.ts);return`
      <div class="history-item">
        <div class="history-icon ${n.correct?"correct":"wrong"}">${n.correct?"✅":"❌"}</div>
        <div class="history-body">
          <div class="history-quiz">${a[n.type]??n.type}</div>
          <div class="history-time">${c}</div>
        </div>
        <div class="history-score ${l}">${n.score??"–"}점</div>
      </div>`}).join("")}function E(e){if(!e)return"";const t=(Date.now()-new Date(e))/1e3;return t<60?"방금 전":t<3600?`${Math.floor(t/60)}분 전`:t<86400?`${Math.floor(t/3600)}시간 전`:`${Math.floor(t/86400)}일 전`}function C(e){const t=[{icon:"🌱",name:`첫 문장
추가`,cond:e.total>=1},{icon:"🔥",name:`3일
연속`,cond:e.streakCur>=3},{icon:"📚",name:`10문장
달성`,cond:e.total>=10},{icon:"🎯",name:`퀴즈
10회`,cond:e.history.length>=10},{icon:"⚡",name:`7일
연속`,cond:e.streakCur>=7},{icon:"🏆",name:`50문장
달성`,cond:e.total>=50}];document.getElementById("achieveGrid").innerHTML=t.map(o=>`
    <div class="achieve-item ${o.cond?"":"locked"}">
      <div class="achieve-icon">${o.icon}</div>
      <div class="achieve-name">${o.name.replace(`
`,"<br>")}</div>
    </div>
  `).join("")}const s=p();document.getElementById("streakNum").textContent=s.streakCur;document.getElementById("streakBest").textContent=`최고 기록: ${s.streakBest}일`;document.getElementById("totalSentences").textContent=s.total;document.getElementById("learnedCount").textContent=s.learned;document.getElementById("quizTotal").textContent=s.history.length;document.getElementById("accuracy").textContent=s.accPct+"%";const w=s.total>0?Math.round(s.learned/s.total*100):0;y("overallBar","overallPct",w);y("chunkBar","chunkPct",0);y("typingBar","typingPct",0);B(s.weekData);$(s.history);C(s);
