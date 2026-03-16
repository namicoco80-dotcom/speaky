import"./modulepreload-polyfill-B5Qt9EMX.js";import{s as $,K as f}from"./storage-D5mgx_HQ.js";import{b}from"./expressionManager-BKBnNKJn.js";import{g as k}from"./settingsManager-CuSQvveO.js";function S(r){if(!("speechSynthesis"in window))return;const l=k();speechSynthesis.cancel();const c=new SpeechSynthesisUtterance(r);c.lang=l.tts_accent==="uk"?"en-GB":"en-US",c.rate=l.tts_speed??1,speechSynthesis.speak(c)}window.playTTS=S;function w(){var m;const r=((m=$(f.PROGRESS,null))==null?void 0:m.data)??{},l=r.quiz_history??[],c=new Date().toDateString(),n=l.filter(t=>{const i=t.ts||t.date||t.created_at;return i&&new Date(i).toDateString()===c}),h=document.getElementById("content"),d=b({includeBuiltin:!0}),v=Object.fromEntries(d.map(t=>[t.id,t])),u=new Date().toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric",weekday:"long"}),y=n.filter(t=>t.correct).length,g=n.filter(t=>!t.correct).length,x=n.length,p=r.learned_ids??[],o=d.filter(t=>p.includes(t.id)).slice(-10).reverse();let s=`
    <div class="hero">
      <div class="hero-date">${u}</div>
      <div class="hero-title">오늘도 수고했어요! 🎉</div>
      <div class="hero-stats">
        <div class="hero-stat">
          <div class="hero-num">${x||p.length}</div>
          <div class="hero-lbl">학습 문장</div>
        </div>
        <div class="hero-stat">
          <div class="hero-num">${y}</div>
          <div class="hero-lbl">정답 ✅</div>
        </div>
        <div class="hero-stat">
          <div class="hero-num">${g}</div>
          <div class="hero-lbl">오답 ❌</div>
        </div>
      </div>
    </div>`;if(n.length>0){const t=n.filter(e=>!e.correct).map(e=>v[e.expressionId??e.id]).filter(Boolean),i=n.filter(e=>e.correct).map(e=>v[e.expressionId??e.id]).filter(Boolean);t.length>0&&(s+=`<div class="section-title">❌ 다시 봐야 할 표현 (${t.length}개)</div><div class="expr-list">`,t.slice(0,5).forEach((e,a)=>{s+=`
          <div class="expr-card wrong" style="animation-delay:${a*.05}s">
            <div class="expr-result w">❌ 틀렸어요</div>
            <div class="expr-en">${e.en}</div>
            ${e.kr?`<div class="expr-kr">${e.kr}</div>`:""}
            ${e.memo?`<div class="expr-memo">💡 ${e.memo}</div>`:""}
            <button class="tts-btn" onclick="playTTS('${e.en.replace(/'/g,"\\'")}')">🔊 듣기</button>
          </div>`}),s+="</div>"),i.length>0&&(s+=`<div class="section-title">✅ 잘 외운 표현 (${i.length}개)</div><div class="expr-list">`,i.slice(0,5).forEach((e,a)=>{s+=`
          <div class="expr-card correct" style="animation-delay:${a*.05}s">
            <div class="expr-result c">✅ 정답</div>
            <div class="expr-en">${e.en}</div>
            ${e.kr?`<div class="expr-kr">${e.kr}</div>`:""}
            <button class="tts-btn" onclick="playTTS('${e.en.replace(/'/g,"\\'")}')">🔊 듣기</button>
          </div>`}),s+="</div>")}else o.length>0?(s+=`<div class="section-title">📚 학습한 표현 (${o.length}개)</div><div class="expr-list">`,o.forEach((t,i)=>{s+=`
        <div class="expr-card correct" style="animation-delay:${i*.05}s">
          <div class="expr-en">${t.en}</div>
          ${t.kr?`<div class="expr-kr">${t.kr}</div>`:""}
          ${t.memo?`<div class="expr-memo">💡 ${t.memo}</div>`:""}
          <button class="tts-btn" onclick="playTTS('${t.en.replace(/'/g,"\\'")}')">🔊 듣기</button>
        </div>`}),s+="</div>"):s+=`
      <div class="empty">
        <div class="empty-icon">📭</div>
        <div class="empty-text">아직 학습 기록이 없어요.<br>퀴즈를 시작해보세요!</div>
      </div>`;s+=`
    <div class="bottom-btns">
      <button class="btn-primary" onclick="location.href='./quiz.html'">⚡ 퀴즈 계속하기</button>
      <button class="btn-secondary" onclick="location.href='./index.html'">🏠 홈으로</button>
    </div>`,h.innerHTML=s}w();
