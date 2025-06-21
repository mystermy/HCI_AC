// MENU SETUP
const menu = document.getElementById('menu');
const formView = document.getElementById('formView');
const sessionView = document.getElementById('sessionView');
const listView = document.getElementById('listView');
const statsView = document.getElementById('statsView');
const overlay = document.getElementById('overlay');

const startForgeBtn = document.getElementById('startForge');
const showListBtn = document.getElementById('showList');
const beginSessionBtn = document.getElementById('beginSession');
const backButtons = document.querySelectorAll('.backMenu');
const saveBladeBtn = document.getElementById('saveBlade');

const phaseHeader = document.getElementById('phaseHeader');
const timerDisplay = document.getElementById('timer');
const leaveForgeBtn = document.getElementById('leaveForge');

const overlayHeader = document.getElementById('overlayHeader');
const overlayCountdown = document.getElementById('overlayCountdown');
const overlayBtn = document.getElementById('overlayBtn');

const bladeListEl = document.getElementById('bladeList');
const statsEl = document.getElementById('stats');
const nameEntry = document.getElementById('nameEntry');
const bladeNameInput = document.getElementById('bladeName');

// FORM HANDLERS
startForgeBtn.addEventListener('click', () => showView(formView));
showListBtn.addEventListener('click', () => {
  renderBladeList();
  showView(listView);
});

beginSessionBtn.addEventListener('click', () => {
  rounds = parseInt(document.getElementById('rounds').value) || 1;
  studyDuration = (parseInt(document.getElementById('studyMinutes').value) || 1) * 60;
  restDuration = (parseInt(document.getElementById('restMinutes').value) || 1) * 60;
  currentRound = 1;
  studyRemaining = studyDuration;
  restRemaining = restDuration;
  transitionDurations = [];
  outOfFull = 0;
  inFullDuringRest = 0;
  outcome = 'Blade Forged';
  showView(sessionView);
  startStudy();
});

backButtons.forEach(btn => btn.addEventListener('click', () => showView(menu)));

saveBladeBtn.addEventListener('click', () => {
  const name = bladeNameInput.value.trim();
  if (name) {
    forgedBlades.push({ name, transitions: transitionDurations.slice() });
    bladeNameInput.value = '';
  }
  showView(menu);
});

function showView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  overlay.classList.add('hidden');
  view.classList.remove('hidden');
  document.body.className = '';
  clearInterval(phaseTimer);
  phaseTimer = null;
  clearInterval(transitionTimer);
  transitionTimer = null;
  if (view !== sessionView) exitFullscreen();
}

// SESSION STATE & CONFIG
let rounds = 1;
let studyDuration = 0;
let restDuration = 0;
let currentRound = 1;
let studyRemaining = 0;
let restRemaining = 0;
let transitionDurations = [];
let transitionTimer = null;
let phaseTimer = null;
let outOfFull = 0;
let inFullDuringRest = 0;
let outcome = 'Blade Forged';
const forgedBlades = [];
let ignoreFsChange = false;

// STUDY PHASE LOGIC
function startStudy() {
  phaseHeader.textContent = `Studying — Round ${currentRound} of ${rounds}`;
  leaveForgeBtn.classList.remove('hidden');
  document.body.classList.add('forge-background');
  requestFullscreen(sessionView);
  if (studyRemaining <= 0) studyRemaining = studyDuration;
  timerDisplay.textContent = format(studyRemaining);
  phaseTimer = setInterval(() => {
    studyRemaining--;
    timerDisplay.textContent = format(studyRemaining);
    if (!document.fullscreenElement) outOfFull++;
    if (studyRemaining <= 0) {
      clearInterval(phaseTimer);
      phaseTimer = null;
      overheated();
    }
  }, 1000);
}

leaveForgeBtn.addEventListener('click', () => leaveStudy());

function leaveStudy() {
  clearInterval(phaseTimer);
  phaseTimer = null;
  exitFullscreen();
  if (currentRound >= rounds && studyRemaining <= 0) {
    endSession(true);
  } else {
    showTransition('Leave full-screen within 30s or forging fails!', 'Return to Forge', () => {
      requestFullscreen(sessionView);
      startStudy();
    });
  }
}

// REST PHASE LOGIC
function startRest() {
  document.body.classList.add('mist');
  phaseHeader.textContent = `Resting — Round ${currentRound} of ${rounds}`;
  leaveForgeBtn.classList.add('hidden');
  restRemaining = restDuration;
  timerDisplay.textContent = format(restRemaining);
  phaseTimer = setInterval(() => {
    restRemaining--;
    timerDisplay.textContent = format(restRemaining);
    if (document.fullscreenElement) inFullDuringRest++;
    if (restRemaining <= 0) {
      clearInterval(phaseTimer);
      phaseTimer = null;
      if (currentRound < rounds) {
        showTransition('Enter Forge within 30s', 'Enter Forge', () => {
          currentRound++;
          studyRemaining = studyDuration;
          startStudy();
        });
      } else {
        endSession(true);
      }
    }
  }, 1000);
}

// TRANSITION TIMERS
function showTransition(text, btnText, onConfirm) {
  let elapsed = 0;
  overlayHeader.textContent = text;
  overlayCountdown.textContent = 30;
  overlayBtn.textContent = btnText;
  overlay.classList.remove('hidden');
  overlayBtn.onclick = () => {
    clearInterval(transitionTimer);
    transitionTimer = null;
    overlay.classList.add('hidden');
    transitionDurations.push(elapsed);
    onConfirm();
  };
  transitionTimer = setInterval(() => {
    elapsed++;
    overlayCountdown.textContent = 30 - elapsed;
    if (elapsed >= 30) {
      clearInterval(transitionTimer);
      transitionTimer = null;
      overlay.classList.add('hidden');
      transitionDurations.push(30);
      endSession(false);
    }
  }, 1000);
}

function overheated() {
  exitFullscreen();
  showTransition('The sword is overheated! Temper within 30s', 'Temper the Sword', () => {
    if (currentRound >= rounds) {
      endSession(true);
    } else {
      startRest();
    }
  });
}

function startCoolDown() {
  clearInterval(phaseTimer);
  phaseTimer = null;
  showTransition('Blade damage imminent! Cool within 30s', 'Cool it Down', () => {
    exitFullscreen();
    startRestTimer();
  });
}

function startRestTimer() {
  phaseTimer = setInterval(() => {
    restRemaining--;
    timerDisplay.textContent = format(restRemaining);
    if (document.fullscreenElement) inFullDuringRest++;
    if (restRemaining <= 0) {
      clearInterval(phaseTimer);
      phaseTimer = null;
      if (currentRound < rounds) {
        showTransition('Enter Forge within 30s', 'Enter Forge', () => {
          currentRound++;
          studyRemaining = studyDuration;
          startStudy();
        });
      } else {
        endSession(true);
      }
    }
  }, 1000);
}

// FULLSCREEN HANDLERS
document.addEventListener('fullscreenchange', () => {
  if (ignoreFsChange) { ignoreFsChange = false; return; }
  if (sessionView.classList.contains('hidden')) return;
  if (document.fullscreenElement) return;
  if (phaseTimer && leaveForgeBtn.classList.contains('hidden') === false) {
    leaveStudy();
  } else if (phaseHeader.textContent.startsWith('Resting')) {
    startCoolDown();
  }
});

function requestFullscreen(el) {
  if (el.requestFullscreen) el.requestFullscreen();
}

function exitFullscreen() {
  if (document.fullscreenElement) {
    ignoreFsChange = true;
    document.exitFullscreen();
  }
}

// STATS & LIST RENDERING
function endSession(success) {
  clearInterval(phaseTimer);
  phaseTimer = null;
  exitFullscreen();

  // Log the values for debugging
  console.log('outOfFull:', outOfFull);
  console.log('inFullDuringRest:', inFullDuringRest);

  if (!success) outcome = 'Blade Broken';
  statsEl.innerHTML = `
    <p>Total seconds out of full-screen during Studying Phases: ${transitionDurations.filter((_, index) => index % 1 === 0).join(', ')}</p>
    <p>Total seconds inside full-screen during Rest Phases: ${transitionDurations.filter((_, index) => index % 2 !== 0).join(', ')}</p>
    <p>Outcome: ${outcome}</p>`;
  if (success) {
    nameEntry.classList.remove('hidden');
  } else {
    nameEntry.classList.add('hidden');
  }
  showView(statsView);
}

function renderBladeList() {
  bladeListEl.innerHTML = '';
  forgedBlades.forEach(blade => {
    const li = document.createElement('li');
    li.textContent = `${blade.name} - [${blade.transitions.join(', ')}]`;
    bladeListEl.appendChild(li);
  });
}

function format(s) {
  const m = String(Math.floor(s / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
}
