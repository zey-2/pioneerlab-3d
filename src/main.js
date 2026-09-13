import './style.css';
import {stations,lessons} from './content.js';
import {parseProgress,completeActivity,timelineState} from './state.js';
import {createWorld} from './world.js';
import {createLessonViewer} from './lesson.js';

const icons={
  tent:'<path d="M3 20 12 4l9 16H3Z"/><path d="m8 20 4-7 4 7M12 4V2"/>',
  arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
  back:'<path d="M19 12H5m5-5-5 5 5 5"/>',
  book:'<path d="M12 5c-3-2-7-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
  rope:'<path d="M9 4v12a4 4 0 0 0 8 0V8a4 4 0 0 0-8 0v5a2 2 0 0 0 4 0V3M5 7v14"/>',
  rack:'<path d="m5 21 2-18m12 18L17 3M6 10h12M5 17h14M9 10v7m6-7v7"/>',
  reset:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3v1"/>',
  leaf:'<path d="M20 3C8 2 2 9 6 16s14 2 14-13ZM5 21l10-12"/>',
  check:'<path d="m5 12 5 5L20 7"/>',
  play:'<path d="m9 5 11 7-11 7V5Z"/>',
  pause:'<path d="M9 5v14m6-14v14"/>',
  flag:'<path d="M5 22V3m0 1c5-4 9 4 15 0v11c-6 4-10-4-15 0"/>',
};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.tent}</svg>`;
const $=s=>document.querySelector(s);
const storageKey='pioneerlab-camp-v1';
let storageAvailable=true,progress,world,viewer,nearby=null,activeStation=stations[0],time=0,playing=false,quiz=false,lastStep=-1,previousFocus=null;
let activeLesson=lessons['clove-hitch'];
const availableStations=stations.filter(s=>s.available&&lessons[s.lessonId]);
const stepCount=()=>activeLesson.steps.length;
let reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
try{progress=parseProgress(localStorage.getItem(storageKey));}catch{progress=parseProgress(null);storageAvailable=false;}

$('#app').innerHTML=`
  <header class="topbar">
    <div class="brand"><div class="brand-mark">${icon('tent')}</div><div class="brand-name">Pioneer<span>Lab</span></div></div>
    <nav class="topnav" aria-label="Main"><button class="active" id="camp-tab">${icon('compass')}Camp</button><button id="journal-tab">${icon('book')}Field journal</button></nav>
    <div class="topright"><button class="progress-pill" id="progress-button" aria-label="Open activity progress"><span class="progress-ring" id="progress-count">0/${availableStations.length}</span><span>Skills explored</span></button><div class="profile" aria-label="Explorer">E</div></div>
  </header>
  <main class="shell">
    <aside class="sidebar" aria-label="Camp stations">
      <div class="intro"><div class="eyebrow">${icon('leaf')}LEARN BY EXPLORING</div><h1>A little camp.<br>A useful skill.</h1><p>Take the trail. Find a project.<br>Learn the ropes, one knot at a time.</p><button class="primary" id="first-visit">Visit the rope yard ${icon('arrow')}</button></div>
      <div class="divider"></div><div class="section-heading"><span class="eyebrow">AROUND THE CAMP</span><span>3 stations</span></div>
      <p class="mobile-stations">Choose a station to start learning. Walking controls use a keyboard.</p>
      <nav class="station-list" aria-label="Choose a learning station">${stations.map((s,i)=>`<button class="station-card ${i===0?'selected':''}" data-station="${s.id}"><span class="station-icon">${icon(['rope','tent','rack'][i])}</span><span class="station-copy"><strong>${s.name}</strong><small>${s.duration}</small><span class="station-status ${s.available?'':'preview'}" id="status-${s.id}">${s.available?'START HERE':'PREVIEW'}</span></span></button>`).join('')}</nav>
      <div class="sidebar-bottom"><div class="field-note">${icon('leaf')}<span>Go at your own pace.<br>Every good knot begins with curiosity.</span></div><div class="sidebar-footer"><span>PIONEERLAB FIELD CAMP</span><span>NO. 001</span></div></div>
    </aside>
    <section class="world" id="world" aria-label="Interactive woodland camp">
      <div class="world-top"><div class="location">${icon('compass')}<div><strong>Pinewood Camp</strong><small>Your first expedition</small></div></div><div class="world-actions"><button class="icon-button" id="reset-camera" aria-label="Reset camera" title="Reset camera (R)">${icon('reset')}</button><button class="icon-button" id="help-button" aria-label="Controls and accessibility" title="Controls & accessibility">${icon('help')}</button></div></div>
      <div class="world-caption">Follow the trail to the rope yard.<br>Your first lesson is waiting.</div>
      <button class="nearby" id="nearby" hidden><kbd>E</kbd><span><strong id="nearby-title"></strong><small>Visit learning station</small></span>${icon('arrow')}</button>
      <div class="world-bottom"><div class="control-bar"><span class="control-item"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Walk</span><span class="control-item">Drag to look</span><span class="control-item"><kbd>E</kbd> Interact</span></div><div class="compass" aria-hidden="true"><small>N</small>${icon('compass')}</div></div>
    </section>
  </main>
  <dialog class="detail-dialog" id="detail-dialog" aria-labelledby="detail-title"></dialog>
  <dialog class="lesson-dialog" id="lesson-dialog" aria-labelledby="lesson-title">
    <div class="lesson-header"><button class="back-button" id="return-camp">${icon('back')}Return to camp</button><div class="lesson-heading"><strong id="lesson-title">The Clove Hitch</strong><small id="lesson-station">ROPE PRACTICE YARD / LESSON 01</small></div></div>
    <div class="lesson-layout"><div class="lesson-visual"><div class="rope-canvas" id="rope-canvas"></div><div class="view-label">ROPE A · ONE CONTINUOUS STRAND<span>Guided path study</span></div><div class="viewer-controls"><button id="front-view">Front</button><button id="side-view">Side</button></div><div class="playback"><div class="playback-main"><button class="play-toggle" id="play-toggle" aria-label="Play rope-path guide">${icon('play')}</button><input class="playback-range" id="timeline" type="range" min="0" max="5" step="0.01" value="0" aria-label="Lesson timeline"/><span class="time-label" id="time-label">0:00 / 0:25</span></div><div class="step-dots"></div></div></div><div class="instruction" id="instruction"></div></div>
    <div class="lesson-footer"><span id="lesson-caution"></span><button id="sources-button">Lesson sources</button></div>
  </dialog>
  <div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
`;

const detailDialog=$('#detail-dialog'),lessonDialog=$('#lesson-dialog');let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4200);}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(progress));storageAvailable=true;}catch{if(storageAvailable)toast('Your browser could not save progress. You can keep exploring in this visit.');storageAvailable=false;}}
function renderProgress(){
  const done=availableStations.filter(s=>progress.completed.includes(s.lessonId)).length;
  $('#progress-count').textContent=`${done}/${availableStations.length}`;
  availableStations.forEach((s,i)=>{$(`#status-${s.id}`).textContent=progress.completed.includes(s.lessonId)?'ACTIVITY COMPLETE':i===0?'START HERE':s.id==='shelter'?'LEARN THE TIE-OFF':'BUILD A JOINT';});
  $('#progress-button').setAttribute('aria-label',`${done} of ${availableStations.length} learning activities complete. Open field journal.`);world?.setCompleted(progress.completed);
  const next=availableStations.find(s=>!progress.completed.includes(s.lessonId))??availableStations[0];
  $('#first-visit').dataset.destination=next.id;$('#first-visit').innerHTML=`Visit ${next.name.toLowerCase()} ${icon('arrow')}`;
  $('.world-caption').textContent=done===availableStations.length?`All ${availableStations.length} activities complete. Revisit any station to practise again.`:`Follow the trail to ${next.name.toLowerCase()}. Your next lesson is waiting.`;
}
function syncPaused(){world?.setPaused(detailDialog.open||lessonDialog.open);}
function showDetail(html){
  const replacing=detailDialog.open;
  if(!replacing)previousFocus=document.activeElement;
  detailDialog.innerHTML=html;
  if(replacing){const heading=$('#detail-title');heading.setAttribute('tabindex','-1');heading.focus();}
  else detailDialog.showModal();
  syncPaused();
}
const detailHeader=(label)=>`<div class="dialog-top"><span class="eyebrow">${label}</span><button class="close-x" data-close aria-label="Close dialog">×</button></div>`;
function openStation(id){
  const s=stations.find(s=>s.id===id);if(!s)return;activeStation=s;
  if(!progress.discovered.includes(id)){progress={...progress,discovered:[...progress.discovered,id]};save();}
  document.querySelectorAll('.station-card').forEach(el=>el.classList.toggle('selected',el.dataset.station===id));
  showDetail(`${detailHeader(s.category)}<div class="dialog-body"><div class="detail-number">${s.number}</div><h2 id="detail-title">${s.task}</h2><p>${s.description}</p><p>${s.detail}</p>${s.available?`<p class="detail-meta">ONE ROPE · ${lessons[s.lessonId].steps.length} STEPS · A SHORT RECALL ACTIVITY</p><button class="primary" id="begin-lesson">${progress.completed.includes(s.lessonId)?'Revisit the lesson':'Begin the lesson'} ${icon('arrow')}</button>`:`<div class="preview-note">Lesson preview · This station is ready to explore. Its step-by-step lesson is not available yet.</div>`}<button class="subtle" style="width:100%;margin-top:10px" id="walk-station">Visit this spot in camp</button></div>`);
}
function openJournal(){
  showDetail(`${detailHeader('YOUR FIELD JOURNAL')}<div class="dialog-body"><h2 id="detail-title">Small steps, useful skills.</h2><p>${availableStations.length} activities in your camp. Visit the stations in any order, and return whenever you want to look again.</p>${availableStations.map(s=>{const done=progress.completed.includes(s.lessonId);return `<div class="journal-entry" data-journal="${s.id}"><strong>${lessons[s.lessonId].title}</strong><span>${done?'✓ Recall activity completed':'Recall activity not yet completed'}</span><button class="subtle journal-revisit" data-station="${s.id}">${done?'Revisit':'Explore'} ${s.name.toLowerCase()} ${icon('arrow')}</button></div>`;}).join('')}<p>${progress.discovered.length} of ${stations.length} stations discovered.</p><div class="preview-note">This journal records activity in PioneerLab. It does not certify practical knot-tying ability. Progress is ${storageAvailable?'saved in this browser':'available for this visit only'}.</div></div>`);
}
function openHelp(){showDetail(`${detailHeader('MAKE YOURSELF AT HOME')}<div class="dialog-body"><h2 id="detail-title">Find your way around.</h2><p><strong>W A S D or arrow keys</strong> to walk.<br><strong>Drag</strong> the camp to look around.<br><strong>Scroll</strong> to zoom.<br><strong>E</strong> to visit a nearby station.<br><strong>R</strong> to reset the camera.</p><p>You can also choose any station from the list. In a lesson, use the step buttons, timeline, or Front and Side views. Escape closes the current dialog.</p><label class="setting-row"><input id="reduced-motion" type="checkbox" ${reducedMotion?'checked':''}/><span>Reduce motion<br><span class="muted">Remove camera smoothing and idle motion.</span></span></label><div class="preview-note">Walking is designed for a desktop keyboard and mouse. On a smaller screen, use the station list to access lessons directly.</div></div>`);}
function openSources(){playing=false;updatePlayback();showDetail(`${detailHeader('LESSON REFERENCES')}<div class="dialog-body"><h2 id="detail-title">Learn with good guidance.</h2><p>${activeLesson.referenceIntro}</p><ul class="source-list">${activeLesson.sources.map(s=>`<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title}</a></li>`).join('')}</ul><p>The 3D illustration has not been assessed by a qualified knot instructor. It demonstrates strand routing, not rope forces or knot security. Use supervision and choose a suitable fastening for the actual task.</p></div>`);}

function openLesson(){
  activeLesson=lessons[activeStation.lessonId];if(!activeLesson)return;
  $('#lesson-title').textContent=activeLesson.title;$('#lesson-station').textContent=`${activeStation.name.toUpperCase()} / LESSON ${activeStation.number}`;
  $('#lesson-caution').textContent=activeLesson.footer;$('#timeline').max=String(stepCount());
  $('.step-dots').innerHTML=activeLesson.steps.map((s,i)=>`<button data-step="${i}" aria-label="Step ${i+1}: ${s.short}"></button>`).join('');
  detailDialog.close();time=0;playing=false;quiz=false;lastStep=-1;lessonDialog.showModal();syncPaused();
  try{viewer=createLessonViewer($('#rope-canvas'),activeLesson);}catch(error){$('#rope-canvas').innerHTML='<div class="fallback"><h3>3D view unavailable</h3><p>The written steps and recall activity are still available. Try a browser with WebGL enabled to inspect the rope.</p></div>';console.warn('Rope viewer unavailable:',error.message);}
  showStep();$('#return-camp').focus();
}
function showStep(){
  const focused=document.activeElement;
  const restoreInstructionFocus=$('#instruction').contains(focused);
  const focusedId=focused?.id;
  const focusedStep=focused?.dataset?.step;
  const state=timelineState(time,stepCount());const step=activeLesson.steps[state.step];quiz=false;
  $('#instruction').innerHTML=`<div class="eyebrow">STEP ${String(state.step+1).padStart(2,'0')} / ${String(stepCount()).padStart(2,'0')}</div><h2>${step.title}</h2><p>${step.text}</p><div class="cue">${step.cue}</div><nav class="lesson-steps" aria-label="Lesson steps">${activeLesson.steps.map((s,i)=>`<button data-step="${i}" class="${i===state.step?'current':''}" ${i===state.step?'aria-current="step"':''}><span>${i+1}</span>${s.short}</button>`).join('')}</nav><div class="lesson-nav"><button class="subtle" id="previous-step" ${state.step===0?'disabled':''}>Previous</button><button class="primary" id="next-step">${state.step===stepCount()-1?'Check understanding':'Next step'} ${icon('arrow')}</button></div>`;
  lastStep=state.step;updatePlayback();
  if(restoreInstructionFocus){
    const destination=focusedStep!==undefined?$('#instruction [aria-current="step"]'):document.getElementById(focusedId);
    (destination&&!destination.disabled&&destination.getClientRects().length?destination:$('#next-step'))?.focus({preventScroll:true});
  }
}
function setTime(value){time=timelineState(value,stepCount()).time;const s=timelineState(time,stepCount());if(s.step!==lastStep||quiz)showStep();updatePlayback();}
function updatePlayback(){
  const s=timelineState(time,stepCount());$('#timeline').value=String(time);$('#time-label').textContent=`0:${String(Math.round(time*5)).padStart(2,'0')} / 0:${String(stepCount()*5).padStart(2,'0')}`;
  $('#play-toggle').innerHTML=icon(playing?'pause':'play');$('#play-toggle').setAttribute('aria-label',playing?'Pause rope-path guide':'Play rope-path guide');
  document.querySelectorAll('.step-dots button').forEach((el,i)=>{el.classList.toggle('current',s.step===i);el.classList.toggle('done',s.step>i);});
  viewer?.update(s.step,s.fraction);
}
function showQuiz(){
  playing=false;setTime(stepCount());quiz=true;updatePlayback();const q=activeLesson.quiz;
  $('#instruction').innerHTML=`<div class="eyebrow">A QUICK CHECK</div><h2>${q.question}</h2><p>${q.prompt}</p><div class="quiz-options">${q.options.map((o,i)=>`<button class="quiz-option" data-answer="${o.id}"><span>${String.fromCharCode(65+i)}</span>${o.text}</button>`).join('')}</div><p class="feedback" id="quiz-feedback" role="status" aria-live="polite"></p><button class="subtle" data-step="${stepCount()-1}">Look at the final step again</button>`;
  $('#instruction h2').setAttribute('tabindex','-1');$('#instruction h2').focus();
}
function answerQuiz(answer,button){
  if(answer!==activeLesson.quiz.answer){button.classList.add('incorrect');$('#quiz-feedback').textContent=activeLesson.quiz.incorrect;return;}
  progress=completeActivity(progress,activeLesson.id);save();renderProgress();
  $('#instruction').innerHTML=`<div class="success-stamp">${icon('check')}</div><div class="eyebrow">ACTIVITY COMPLETE</div><h2>${activeLesson.successTitle}</h2><p>${activeLesson.successText}</p><div class="cue">${activeLesson.payoff}</div><p style="font-size:12px;margin-top:15px">${storageAvailable?'Progress saved in this browser.':'Progress is available for this visit only.'} This records a recall activity, not a practical skill assessment.</p><div class="lesson-nav" style="margin-top:22px"><button class="subtle" data-step="0">Review lesson</button><button class="primary" id="finish-lesson">Back to camp ${icon('arrow')}</button></div>`;
  $('#instruction h2').setAttribute('tabindex','-1');$('#instruction h2').focus({preventScroll:true});
}
function returnToCamp(){lessonDialog.close();}
detailDialog.addEventListener('close',()=>{syncPaused();if(previousFocus?.isConnected&&(!lessonDialog.open||lessonDialog.contains(previousFocus)))previousFocus.focus({preventScroll:true});});
lessonDialog.addEventListener('close',()=>{playing=false;viewer?.dispose();viewer=null;syncPaused();world?.focus();});
document.addEventListener('click',e=>{
  const button=e.target.closest('button');if(!button)return;
  if(button.hasAttribute('data-close')){detailDialog.close();return;}
  if(button.dataset.station){openStation(button.dataset.station);return;}
  if(button.dataset.step!==undefined){playing=false;setTime(Number(button.dataset.step));return;}
  if(button.dataset.answer){answerQuiz(button.dataset.answer,button);return;}
  switch(button.id){
    case 'first-visit':{const destination=button.dataset.destination;world?.visit(destination);if(!world)openStation(destination);else toast('You’re at the station. Press E or choose the nearby prompt.');break;}
    case 'camp-tab':world?.focus();break;
    case 'journal-tab':case 'progress-button':openJournal();break;
    case 'help-button':openHelp();break;
    case 'reset-camera':world?.resetCamera();toast('Camera reset.');break;
    case 'nearby':if(nearby)openStation(nearby.id);break;
    case 'begin-lesson':openLesson();break;
    case 'walk-station':detailDialog.close();world?.visit(activeStation.id);break;
    case 'return-camp':case 'finish-lesson':returnToCamp();break;
    case 'front-view':viewer?.front();break;
    case 'side-view':viewer?.side();break;
    case 'play-toggle':if(time>=stepCount())setTime(0);if(quiz)showStep();playing=!playing;updatePlayback();break;
    case 'previous-step':playing=false;setTime(Math.max(0,Math.floor(time)-1));break;
    case 'next-step':playing=false;if(timelineState(time,stepCount()).step===stepCount()-1)showQuiz();else setTime(Math.floor(time)+1);break;
    case 'sources-button':openSources();break;
  }
});
$('#timeline').addEventListener('input',e=>{playing=false;setTime(Number(e.target.value));});
detailDialog.addEventListener('change',e=>{if(e.target.id==='reduced-motion'){reducedMotion=e.target.checked;world?.setReducedMotion(reducedMotion);}});
// Pause playback when the tab is hidden; returning must never skip teaching steps.
document.addEventListener('visibilitychange',()=>{if(document.hidden){playing=false;updatePlayback();}});
let previousTime=performance.now();
function playback(now){const dt=Math.min((now-previousTime)/1000,.1);previousTime=now;if(playing&&lessonDialog.open&&!detailDialog.open){time=Math.min(stepCount(),time+dt/5);const s=timelineState(time,stepCount());if(s.step!==lastStep)showStep();if(time===stepCount())playing=false;updatePlayback();}requestAnimationFrame(playback);}
requestAnimationFrame(playback);
try {
  world=createWorld($('#world'),{completed:progress.completed,reducedMotion,onNearby(s){nearby=s;$('#nearby').hidden=!s;if(s)$('#nearby-title').textContent=s.name;},onInteract(s){openStation(s.id);}});
} catch(error){
  $('#world').insertAdjacentHTML('afterbegin','<div class="fallback"><h2>The camp is ready to explore.</h2><p>The 3D world could not start on this device. Choose a station from the list to read the lessons and complete the activity.</p></div>');console.warn('Camp renderer unavailable:',error.message);
}
renderProgress();
// Read-only diagnostics for verifying the actual movement and station transitions.
window.pioneerlab={getState:()=>({world:world?.getState()??null,progress:structuredClone(progress),lesson:{id:activeLesson.id,open:lessonDialog.open,time,playing,quiz},storageAvailable})};
