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
const resumeBtn = document.getElementById('resumeBtn');
const summary = document.getElementById('summary');
const nameEntry = document.getElementById('nameEntry');
const bladeNameInput = document.getElementById('bladeName');

let overlayMode = null; // type of overlay currently shown
let breakTimeLeft = 0;

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
    forgeArea.classList.remove('crack');
    startWorkCycle();
});

// FULLSCREEN HANDLERS
document.addEventListener('fullscreenchange', () => {
    // FULLSCREEN PREVENTION DURING OVERLAYS
    if (overlayMode === 'end' && !document.fullscreenElement) {
        showTemperOverlay();
        return;
    }
    if (!document.fullscreenElement && forgeArea.classList.contains('forge-background') && overlayMode === null) {
        startFreeze();
    } else if (document.fullscreenElement && freezeTimer && overlayMode === 'freeze') {
        clearInterval(freezeTimer);
        overlay.classList.add('hidden');
        resumeBtn.classList.add('hidden');
        overlayMode = null;
    }
    if (document.fullscreenElement && breakTimer && overlayMode === null) {
        startBreakOverheat();
    }
});

document.addEventListener('keydown', e => {
    if (overlayMode === 'end' && (e.key === 'Escape' || e.key === 'F11')) {
        e.preventDefault();
        showTemperOverlay();
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
            showTemperOverlay();
        }
    }, 1000);
}

// END-OF-STUDY OVERLAY
function showTemperOverlay() {
    overlayMode = 'end';
    overlayText.textContent = 'The sword is overheated';
    resumeBtn.textContent = 'Temper the Sword';
    overlay.classList.remove('hidden');
    resumeBtn.classList.remove('hidden');
    let wait = 30;
    countdown.textContent = wait;
    clearInterval(overheatTimer);
    overheatTimer = setInterval(() => {
        wait--;
        countdown.textContent = wait;
        if (wait <= 0) {
            clearInterval(overheatTimer);
            bladeBroken = true;
            finishSession();
        }
    }, 1000);
}


function startBreakTimer() {
    forgeArea.classList.add('mist');
    breakTimeLeft = breakDuration;
    timerEl.textContent = format(breakTimeLeft);
    breakTimer = setInterval(() => {
        breakTimeLeft--;
        timerEl.textContent = format(breakTimeLeft);
        if (document.fullscreenElement) {
            outOfBreakSeconds++;
        }
        if (breakTimeLeft <= 0) {
            clearInterval(breakTimer);
            showReenter();
        }
    }, 1000);
}

// RE-ENTRY HANDLER
function showReenter() {
    phaseTitle.textContent = 'Rest Complete';
    reenterBtn.classList.remove('hidden');
    forgeArea.classList.remove('mist');
    let wait = 30;
    reenterTimer = setInterval(() => {
        wait--;
        if (wait <= 0) {
            clearInterval(reenterTimer);
            reenterBtn.classList.add('hidden');
            startBreakOverheat();
        }
    }, 1000);
}

function startNextCycle() {
    if (currentCycle < totalCycles) {
        startWorkCycle();
    } else {
        finishSession();
    }
}

reenterBtn.addEventListener('click', () => {
    clearInterval(reenterTimer);
    reenterBtn.classList.add('hidden');
    enterFull();
    startNextCycle();
});

// TEMPER BUTTON HANDLER
resumeBtn.addEventListener('click', () => {
    if (overlayMode === 'freeze') {
        clearInterval(freezeTimer);
        overlay.classList.add('hidden');
        resumeBtn.classList.add('hidden');
        enterFull();
        overlayMode = null;
    } else if (overlayMode === 'end') {
        clearInterval(overheatTimer);
        overlay.classList.add('hidden');
        resumeBtn.classList.add('hidden');
        overlayMode = null;
        exitFull();
        forgeArea.classList.add('mist');
        if (totalCycles === 1) {
            // SINGLE-CYCLE SKIP
            finishSession();
        } else {
            startBreakTimer();
        }
    } else if (overlayMode === 'break') {
        clearInterval(overheatTimer);
        overlay.classList.add('hidden');
        resumeBtn.classList.add('hidden');
        overlayMode = null;
        exitFull();
        if (breakTimeLeft > 0) {
            startBreakTimer();
        } else {
            enterFull();
            startNextCycle();
        }
    }
});

// WARP TIMER HANDLERS
function startFreeze() {
    overlayMode = 'freeze';
    let wait = 30;
    overlayText.textContent = 'The sword is going cold';
    overlay.classList.remove('hidden');
    resumeBtn.classList.remove('hidden');
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

// BREAK OVERHEAT HANDLER
function startBreakOverheat() {
    overlayMode = 'break';
    overlayText.textContent = 'Blade damage imminent';
    resumeBtn.textContent = 'Cool it down';
    overlay.classList.remove('hidden');
    resumeBtn.classList.remove('hidden');
    let wait = 30;
    countdown.textContent = wait;
    clearInterval(overheatTimer);
    overheatTimer = setInterval(() => {
        wait--;
        countdown.textContent = wait;
        if (wait <= 0) {
            clearInterval(overheatTimer);
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
    overlay.classList.add('hidden');
    resumeBtn.classList.add('hidden');
    overlayMode = null;
    forgeArea.classList.remove('forge-background');
    forgeArea.classList.remove('mist');
    if (bladeBroken) forgeArea.classList.add('crack');
    exitFull();
    showView(statsView);
    const outcome = bladeBroken ? 'Blade Broken' : 'Blade Forged';
    summary.innerHTML = `<p>Out of full-screen during work: ${outOfForgeSeconds}s</p>` +
        `<p>In full-screen during breaks: ${outOfBreakSeconds}s</p>` +
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