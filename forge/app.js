// PHASE DEFINITIONS
const PHASE_STUDY = 'studying';
const PHASE_REST = 'rest';

// MENU SETUP
const menu = document.getElementById('menu');
const bladeListView = document.getElementById('bladeList');
const bladesUl = document.getElementById('blades');
const setupView = document.getElementById('setup');
const forgeArea = document.getElementById('forgeArea');
const statsView = document.getElementById('stats');
const phaseTitle = document.getElementById('phaseTitle');
const timerEl = document.getElementById('timer');
const transitionTimerEl = document.getElementById('transitionTimer');
const enterBtn = document.getElementById('enterBtn');
const leaveBtn = document.getElementById('leaveBtn');
const summary = document.getElementById('summary');

const viewBladesBtn = document.getElementById('viewBladesBtn');
const forgeBladeBtn = document.getElementById('forgeBladeBtn');
const saveBladeBtn = document.getElementById('saveBladeBtn');
const bladeNameInput = document.getElementById('bladeName');
const nameEntry = document.getElementById('nameEntry');

let blades = [];

let totalCycles = 0;
let studyDuration = 0;
let restDuration = 0;
let currentCycle = 0;
let currentPhase = null;
let phaseTimer;
let transitionTimer;
let transitionAction = null;
let outOfFullscreen = 0;
let inFullscreen = 0;
let bladeBroken = false;

function showView(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    view.classList.remove('hidden');
}

function enterFull() {
    forgeArea.requestFullscreen().catch(() => {});
}

function exitFull() {
    if (document.fullscreenElement) document.exitFullscreen();
}

function format(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
}

// SESSION LOGIC
function startSession() {
    studyDuration = parseInt(document.getElementById('workDuration').value) * 60;
    restDuration = parseInt(document.getElementById('breakDuration').value) * 60;
    totalCycles = parseInt(document.getElementById('cycles').value);
    currentCycle = 0;
    outOfFullscreen = 0;
    inFullscreen = 0;
    bladeBroken = false;
    showView(forgeArea);
    startStudying();
}

document.getElementById('beginBtn').addEventListener('click', startSession);

viewBladesBtn.addEventListener('click', () => {
    bladesUl.innerHTML = blades.map(b => `<li>${b}</li>`).join('');
    showView(bladeListView);
});

forgeBladeBtn.addEventListener('click', () => {
    showView(setupView);
});

saveBladeBtn.addEventListener('click', () => {
    const name = bladeNameInput.value.trim();
    if (name) blades.push(name);
    bladeNameInput.value = '';
    showView(menu);
});

document.querySelectorAll('.backBtn').forEach(btn => btn.addEventListener('click', () => {
    exitFull();
    nameEntry.classList.add('hidden');
    showView(menu);
}));

// BUTTON HANDLERS
enterBtn.addEventListener('click', () => {
    if (transitionAction === 'enter') {
        clearInterval(transitionTimer);
        transitionTimerEl.classList.add('hidden');
        enterBtn.classList.add('hidden');
        transitionAction = null;
        enterFull();
        startStudying();
    }
});

leaveBtn.addEventListener('click', () => {
    if (transitionAction === 'exit') {
        clearInterval(transitionTimer);
        transitionTimerEl.classList.add('hidden');
        leaveBtn.classList.add('hidden');
        transitionAction = null;
        exitFull();
        startRest();
    }
});

function startStudying() {
    currentCycle++;
    currentPhase = PHASE_STUDY;
    phaseTitle.textContent = `Studying (${currentCycle}/${totalCycles})`;
    if (!document.fullscreenElement) enterFull();
    let remaining = studyDuration;
    timerEl.textContent = format(remaining);
    transitionTimerEl.classList.add('hidden');
    enterBtn.classList.add('hidden');
    leaveBtn.classList.add('hidden');
    phaseTimer = setInterval(() => {
        remaining--;
        timerEl.textContent = format(remaining);
        if (!document.fullscreenElement) outOfFullscreen++;
        if (remaining <= 0) {
            clearInterval(phaseTimer);
            if (currentCycle === totalCycles) {
                finishSession();
            } else {
                startTransition('exit');
            }
        }
    }, 1000);
}

function startRest() {
    currentPhase = PHASE_REST;
    phaseTitle.textContent = 'Rest';
    if (document.fullscreenElement) exitFull();
    let remaining = restDuration;
    timerEl.textContent = format(remaining);
    transitionTimerEl.classList.add('hidden');
    enterBtn.classList.add('hidden');
    leaveBtn.classList.add('hidden');
    phaseTimer = setInterval(() => {
        remaining--;
        timerEl.textContent = format(remaining);
        if (document.fullscreenElement) inFullscreen++;
        if (remaining <= 0) {
            clearInterval(phaseTimer);
            startTransition('enter');
        }
    }, 1000);
}

// TRANSITION TIMER
function startTransition(action) {
    transitionAction = action; // 'enter' or 'exit'
    let remaining = 30;
    transitionTimerEl.textContent = remaining;
    transitionTimerEl.classList.remove('hidden');
    if (action === 'enter') {
        enterBtn.classList.remove('hidden');
        leaveBtn.classList.add('hidden');
        phaseTitle.textContent = 'Prepare to Study';
    } else {
        leaveBtn.classList.remove('hidden');
        enterBtn.classList.add('hidden');
        phaseTitle.textContent = 'Prepare to Rest';
    }
    timerEl.textContent = '';
    transitionTimer = setInterval(() => {
        remaining--;
        transitionTimerEl.textContent = remaining;
        if (remaining <= 0) {
            clearInterval(transitionTimer);
            bladeBroken = true;
            finishSession();
        }
    }, 1000);
}

// FULLSCREEN ENFORCEMENT
document.addEventListener('fullscreenchange', () => {
    if (transitionAction) return;
    if (currentPhase === PHASE_STUDY && !document.fullscreenElement) {
        clearInterval(phaseTimer);
        startTransition('exit');
    } else if (currentPhase === PHASE_REST && document.fullscreenElement) {
        clearInterval(phaseTimer);
        startTransition('enter');
    }
});

// STATS DISPLAY
function finishSession() {
    clearInterval(phaseTimer);
    clearInterval(transitionTimer);
    enterBtn.classList.add('hidden');
    leaveBtn.classList.add('hidden');
    transitionTimerEl.classList.add('hidden');
    exitFull();
    showView(statsView);
    const outcome = bladeBroken ? 'Blade Broken' : 'Blade Forged';
    summary.innerHTML =
        `<p>Out of full-screen during Studying: ${outOfFullscreen}s</p>` +
        `<p>In full-screen during Rest: ${inFullscreen}s</p>` +
        `<p>Outcome: ${outcome}</p>`;
    if (!bladeBroken) {
        nameEntry.classList.remove('hidden');
    } else {
        nameEntry.classList.add('hidden');
    }
}
