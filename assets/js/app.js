(function(){
  const $ = (q, el=document)=> el.querySelector(q);
  const $$ = (q, el=document)=> Array.from(el.querySelectorAll(q));

  // Smooth jump chips
  $$('.chip[data-jump]').forEach(ch => {
    ch.addEventListener('click', () => {
      const target = ch.getAttribute('data-jump');
      const node = $(target);
      if(node) node.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });

  // Floating buttons
  const toTopBtn = $('#toTopBtn');
  const toTrackerBtn = $('#toTrackerBtn');
  if(toTopBtn) toTopBtn.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
  if(toTrackerBtn) toTrackerBtn.addEventListener('click', () => {
    const tracker = $('#tracker');
    if(tracker) tracker.scrollIntoView({behavior:'smooth', block:'start'});
  });

  // Print
  const printBtn = $('#printBtn');
  if(printBtn) printBtn.addEventListener('click', () => window.print());

  // Expand/collapse all details
  const collapseBtn = $('#collapseBtn');
  const expandBtn = $('#expandBtn');
  if(collapseBtn) collapseBtn.addEventListener('click', () => { $$('details').forEach(d => d.open = false); });
  if(expandBtn) expandBtn.addEventListener('click', () => { $$('details').forEach(d => d.open = true); });

  // Level persistence
  const KEY_LEVEL = 'po_retrain_level_v1';
  const KEY_LOGS  = 'po_retrain_logs_v1';

  function setProgressUI(level){
    const savedText = $('#savedLevelText');
    const bar = $('#progressBar');
    if(!savedText || !bar) return;

    if(level === null || level === undefined || level === ''){
      savedText.textContent = 'None';
      bar.style.width = '0%';
      highlightPlan(null);
      return;
    }
    savedText.textContent = 'Level ' + level;
    const pct = Math.max(0, Math.min(100, (Number(level) / 6) * 100));
    bar.style.width = pct.toFixed(0) + '%';
    highlightPlan(String(level));
  }

  function highlightPlan(levelStr){
    $$('[data-level-plan]').forEach(card => {
      const match = levelStr !== null && card.getAttribute('data-level-plan') === levelStr;
      card.style.outline = match ? '2px solid rgba(125,211,252,.55)' : 'none';
      card.style.background = match
        ? 'linear-gradient(180deg, rgba(125,211,252,.10), rgba(255,255,255,.03))'
        : 'rgba(255,255,255,.03)';
    });
  }

  function loadLevel(){
    try{
      const v = localStorage.getItem(KEY_LEVEL);
      return (v === null || v === '') ? '' : v;
    }catch(e){ return ''; }
  }
  function saveLevel(v){
    try{
      localStorage.setItem(KEY_LEVEL, v);
    }catch(e){}
  }
  function clearLevel(){
    try{
      localStorage.removeItem(KEY_LEVEL);
    }catch(e){}
  }

  // Initialize level
  const levelSelect = $('#levelSelect');
  const initial = loadLevel();
  if(levelSelect) levelSelect.value = initial || '';
  setProgressUI(initial || '');

  const saveLevelBtn = $('#saveLevelBtn');
  if(saveLevelBtn) saveLevelBtn.addEventListener('click', () => {
    const v = levelSelect ? levelSelect.value : '';
    if(v === ''){
      clearLevel();
      setProgressUI('');
      toast('Level cleared.');
      return;
    }
    saveLevel(v);
    setProgressUI(v);
    toast('Saved Level ' + v + '.');
  });

  const clearLevelBtn = $('#clearLevelBtn');
  if(clearLevelBtn) clearLevelBtn.addEventListener('click', () => {
    if(levelSelect) levelSelect.value = '';
    clearLevel();
    setProgressUI('');
    toast('Level cleared.');
  });

  const setLevelBtn = $('#setLevelBtn');
  if(setLevelBtn) setLevelBtn.addEventListener('click', () => {
    const tracker = $('#tracker');
    if(tracker) tracker.scrollIntoView({behavior:'smooth', block:'start'});
    if(levelSelect) levelSelect.focus({preventScroll:true});
  });

  const jumpToPlanBtn = $('#jumpToPlanBtn');
  if(jumpToPlanBtn) jumpToPlanBtn.addEventListener('click', () => {
    const v = loadLevel();
    if(!v){
      const steps = $('#steps');
      if(steps) steps.scrollIntoView({behavior:'smooth', block:'start'});
      return;
    }
    const card = document.querySelector('[data-level-plan="'+v+'"]');
    if(card) card.scrollIntoView({behavior:'smooth', block:'center'});
  });

  // Logs
  function loadLogs(){
    try{
      const raw = localStorage.getItem(KEY_LOGS);
      if(!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    }catch(e){ return []; }
  }
  function saveLogs(logs){
    try{
      localStorage.setItem(KEY_LOGS, JSON.stringify(logs));
    }catch(e){}
  }

  function fmtDate(d){
    // user wanted 12OCT or 12OCT2022 format; include year in logs for clarity
    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    const dd = String(d.getDate()).padStart(2,'0');
    const mon = months[d.getMonth()];
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    return `${dd}${mon}${yyyy} ${hh}:${mm}`;
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function renderLogs(){
    const logs = loadLogs().slice().reverse();
    const box = $('#logList');
    if(!box) return;

    if(logs.length === 0){
      box.textContent = 'No logs yet.';
      return;
    }
    box.innerHTML = logs.slice(0, 12).map(l => {
      const lvl = (l.level !== undefined && l.level !== null && l.level !== '') ? `Level ${l.level}` : 'Level ?';
      const amt = l.amount ? escapeHtml(l.amount) : '';
      const sx  = (l.sx === 0 || l.sx) ? `Sx ${escapeHtml(String(l.sx))}/10` : '';
      const note= l.note ? escapeHtml(l.note) : '';
      const when= l.when ? escapeHtml(l.when) : '';
      return `
        <div style="padding:10px 12px;border:1px solid var(--border);border-radius:12px;background:rgba(0,0,0,.12);margin:8px 0">
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <span class="tag good">${escapeHtml(lvl)}</span>
            ${amt ? `<span class="tag">${amt}</span>` : ``}
            ${sx ? `<span class="tag warn">${sx}</span>` : ``}
            <span class="faint small">${when}</span>
          </div>
          ${note ? `<div style="margin-top:6px;color:var(--text)">${note}</div>` : ``}
        </div>
      `;
    }).join('') + (logs.length > 12 ? `<div class="faint small">Showing 12 of ${logs.length} logs.</div>` : ``);
  }

  const addLogBtn = $('#addLogBtn');
  if(addLogBtn) addLogBtn.addEventListener('click', () => {
    const amountEl = $('#logAmount');
    const sxEl = $('#logSx');
    const noteEl = $('#logNote');

    const amount = amountEl ? amountEl.value.trim() : '';
    const sxRaw = sxEl ? sxEl.value.trim() : '';
    const note = noteEl ? noteEl.value.trim() : '';
    const level = loadLevel() || (levelSelect ? levelSelect.value : '') || '';
    const sx = sxRaw === '' ? '' : Math.max(0, Math.min(10, Number(sxRaw)));

    const logs = loadLogs();
    logs.push({
      level,
      amount,
      sx,
      note,
      when: fmtDate(new Date())
    });
    saveLogs(logs);

    if(amountEl) amountEl.value = '';
    if(sxEl) sxEl.value = '';
    if(noteEl) noteEl.value = '';
    renderLogs();
    toast('Log added.');
  });

  const clearLogsBtn = $('#clearLogsBtn');
  if(clearLogsBtn) clearLogsBtn.addEventListener('click', () => {
    try{ localStorage.removeItem(KEY_LOGS); }catch(e){}
    renderLogs();
    toast('Logs cleared.');
  });

  // Export/Import
  const exportBtn = $('#exportBtn');
  if(exportBtn) exportBtn.addEventListener('click', () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      level: loadLevel() || '',
      logs: loadLogs()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'po-retrain-export.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
    toast('Exported JSON.');
  });

  const importBtn = $('#importBtn');
  if(importBtn) importBtn.addEventListener('click', () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'application/json';
    inp.addEventListener('change', () => {
      const file = inp.files && inp.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try{
          const data = JSON.parse(String(reader.result || ''));
          if(data && typeof data === 'object'){
            if(data.level !== undefined){
              const v = String(data.level);
              if(v === '' || (/^[0-6]$/.test(v))) saveLevel(v);
            }
            if(Array.isArray(data.logs)) saveLogs(data.logs);
            if(levelSelect) levelSelect.value = loadLevel() || '';
            setProgressUI(loadLevel() || '');
            renderLogs();
            toast('Imported.');
          }
        }catch(e){
          toast('Import failed.');
        }
      };
      reader.readAsText(file);
    });
    inp.click();
  });

  // Toast
  let toastTimer = null;
  function toast(msg){
    let node = document.getElementById('toastNode');
    if(!node){
      node = document.createElement('div');
      node.id = 'toastNode';
      node.style.position = 'fixed';
      node.style.left = '50%';
      node.style.bottom = '18px';
      node.style.transform = 'translateX(-50%)';
      node.style.padding = '10px 12px';
      node.style.borderRadius = '14px';
      node.style.border = '1px solid rgba(255,255,255,.14)';
      node.style.background = 'rgba(15,26,51,.92)';
      node.style.backdropFilter = 'blur(10px)';
      node.style.boxShadow = '0 12px 30px rgba(0,0,0,.35)';
      node.style.color = 'white';
      node.style.fontWeight = '800';
      node.style.zIndex = '80';
      document.body.appendChild(node);
    }
    node.textContent = msg;
    node.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>{ node.style.opacity='0'; }, 1400);
  }

  renderLogs();
})();
