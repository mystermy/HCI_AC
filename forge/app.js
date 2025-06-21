// MENU SETUP
const menu = document.getElementById('menu');
const bladeListView = document.getElementById('bladeList');
const setupView = document.getElementById('setup');
const forgeArea = document.getElementById('forgeArea');
const statsView = document.getElementById('stats');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlayText');
const countdown = document.getElementById('countdown');
const bladesUl = document.getElementById('blades');
const phaseTitle = document.getElementById('phaseTitle');
const timerEl = document.getElementById('timer');
const quenchBtn = document.getElementById('quenchBtn');
const reenterBtn = document.getElementById('reenterBtn');
const summary = document.getElementById('summary');
const nameEntry = document.getElementById('nameEntry');
const bladeNameInput = document.getElementById('bladeName');

let blades = [];
let currentCycle = 0;
let totalCycles = 0;
let workDuration = 0;
let breakDuration = 0;
let workTimer; // interval
let breakTimer;
let freezeTimer;
let overheatTimer;
let reenterTimer;
let outOfForgeSeconds = 0;
let outOfBreakSeconds = 0;
let bladeBroken = false;

function showView(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    view.classList.remove('hidden');
}

function backToMenu() {
    exitFull();
    showView(menu);
}

document.querySelectorAll('.backBtn').forEach(btn => btn.addEventListener('click', backToMenu));

document.getElementById('viewBladesBtn').addEventListener('click', () => {
    bladesUl.innerHTML = blades.map(b => `<li>${b}</li>`).join('');
    showView(bladeListView);
});

document.getElementById('forgeBladeBtn').addEventListener('click', () => {
    showView(setupView);
});

// SETUP FORM HANDLERS
document.getElementById('beginBtn').addEventListener('click', () => {
    workDuration = parseInt(document.getElementById('workDuration').value) * 60;
    breakDuration = parseInt(document.getElementById('breakDuration').value) * 60;
    totalCycles = parseInt(document.getElementById('cycles').value);
    currentCycle = 0;
    outOfForgeSeconds = 0;
    outOfBreakSeconds = 0;
    bladeBroken = false;
    startWorkCycle();
});

// FULLSCREEN HANDLERS
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && forgeArea.classList.contains('forge-background')) {
        startFreeze();
    } else if (document.fullscreenElement && freezeTimer) {
        clearInterval(freezeTimer);
        overlay.classList.add('hidden');
    }
});

function enterFull() {
    forgeArea.requestFullscreen().catch(() => {});
}

function exitFull() {
    if (document.fullscreenElement) document.exitFullscreen();
}

// WORK & BREAK TIMER LOGIC
function startWorkCycle() {
    currentCycle++;
    phaseTitle.textContent = `Work Cycle ${currentCycle}`;
    showView(forgeArea);
    quenchBtn.classList.add('hidden');
    reenterBtn.classList.add('hidden');
    enterFull();
    let timeLeft = workDuration;
    timerEl.textContent = format(timeLeft);
    forgeArea.classList.add('forge-background');
    workTimer = setInterval(() => {
        timeLeft--;
        timerEl.textContent = format(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(workTimer);
            startBreakPhase();
        }
    }, 1000);
}

function startBreakPhase() {
    phaseTitle.textContent = 'Quench Time';
    quenchBtn.classList.remove('hidden');
    quenchBtn.disabled = false;
    let wait = 30;
    overlay.classList.add('hidden');
    forgeArea.classList.add('mist');
    // WARP TIMER HANDLERS - overheat before quench
    overheatTimer = setInterval(() => {
        wait--;
        if (wait <= 0) {
            clearInterval(overheatTimer);
            bladeBroken = true;
            finishSession();
        }
    }, 1000);
}

quenchBtn.addEventListener('click', () => {
    clearInterval(overheatTimer);
    quenchBtn.classList.add('hidden');
    forgeArea.classList.remove('mist');
    exitFull();
    startBreakTimer();
});

function startBreakTimer() {
    let timeLeft = breakDuration;
    timerEl.textContent = format(timeLeft);
    breakTimer = setInterval(() => {
        timeLeft--;
        timerEl.textContent = format(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(breakTimer);
            showReenter();
        }
    }, 1000);
}

function showReenter() {
    phaseTitle.textContent = 'Rest Complete';
    reenterBtn.classList.remove('hidden');
    let wait = 30;
    reenterTimer = setInterval(() => {
        wait--;
        if (wait <= 0) {
            clearInterval(reenterTimer);
            bladeBroken = true;
            finishSession();
        }
    }, 1000);
}

reenterBtn.addEventListener('click', () => {
    clearInterval(reenterTimer);
    reenterBtn.classList.add('hidden');
    enterFull();
    if (currentCycle < totalCycles) {
        startWorkCycle();
    } else {
        finishSession();
    }
});

// WARP TIMER HANDLERS
function startFreeze() {
    let wait = 30;
    overlayText.textContent = 'The sword is going cold';
    overlay.classList.remove('hidden');
    countdown.textContent = wait;
    freezeTimer = setInterval(() => {
        wait--;
        outOfForgeSeconds++;
        countdown.textContent = wait;
        if (wait <= 0) {
            clearInterval(freezeTimer);
            bladeBroken = true;
            finishSession();
        }
    }, 1000);
}

// OVERLAY RENDERS
// (handled inline in timers above)

// ANIMATIONS (SVG/CSS)
// (defined in style.css)

function format(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
}

// STATS DISPLAY
function finishSession() {
    clearInterval(workTimer);
    clearInterval(breakTimer);
    clearInterval(overheatTimer);
    clearInterval(reenterTimer);
    clearInterval(freezeTimer);
    forgeArea.classList.remove('forge-background');
    forgeArea.classList.remove('mist');
    exitFull();
    showView(statsView);
    const outcome = bladeBroken ? 'Blade Broken' : 'Blade Forged';
    summary.innerHTML = `<p>Time out of forge: ${outOfForgeSeconds}s</p>` +
        `<p>Time outside breaks: ${outOfBreakSeconds}s</p>` +
        `<p>Outcome: ${outcome}</p>`;
    if (!bladeBroken) {
        nameEntry.classList.remove('hidden');
    } else {
        nameEntry.classList.add('hidden');
    }
}

document.getElementById('saveBladeBtn').addEventListener('click', () => {
    const name = bladeNameInput.value.trim();
    if (name) blades.push(name);
    bladeNameInput.value = '';
    backToMenu();
});