// MENU SETUP
const modeMenu = document.getElementById('modeMenu');
const menu = document.getElementById('menu');
const formView = document.getElementById('formView');
const sessionView = document.getElementById('sessionView');
const listView = document.getElementById('listView');
const statsView = document.getElementById('statsView');
const overlay = document.getElementById('overlay');

const randomModeBtn = document.getElementById('randomMode');
const personalisedModeBtn = document.getElementById('personalisedMode');

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
const playerNameInput = document.getElementById('playerName');
const listTitle = document.getElementById('listTitle');
const forgeImageWrapper = document.getElementById('forgeImageWrapper');
const coolingImageWrapper = document.getElementById('coolingImageWrapper');
const overlayImageWrapper = document.getElementById('overlayImageWrapper');
const overlayImage = document.getElementById('overlayImage');
const brokenIcon = document.getElementById('brokenIcon');

// FORM HANDLERS
randomModeBtn.addEventListener('click', () => showView(menu));
personalisedModeBtn.addEventListener('click', () => showView(menu));

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
  const bladeName = bladeNameInput.value.trim();
  const player = playerNameInput.value.trim() || 'Unknown';
  if (bladeName) {
    forgedBlades.push({ bladeName, player, transitions: transitionDurations.slice() });
    bladeNameInput.value = '';
  }
  showView(menu);
});

function showView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  overlay.classList.add('hidden');
  view.classList.remove('hidden');
  document.body.className = '';
  sessionView.classList.remove('forge-background', 'cooling-background');
  forgeImageWrapper.classList.add('hidden');
  coolingImageWrapper.classList.add('hidden');
  overlayImageWrapper.classList.add('hidden');
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
  phaseHeader.textContent = `Studying \n Round ${currentRound} of ${rounds}`;
  leaveForgeBtn.classList.remove('hidden');
  document.body.classList.remove('mist');
  document.body.classList.remove('cooling-background');
  document.body.classList.add('forge-background');
  sessionView.classList.remove('cooling-background');
  sessionView.classList.add('forge-background');
  forgeImageWrapper.classList.remove('hidden');
  coolingImageWrapper.classList.add('hidden');
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
    showTransition(
      'The Sword is Breaking Down',
      'Return to Forge',
      () => {
        requestFullscreen(sessionView);
        startStudy();
      },
      '../sword_burning.png',
      'burning-glow'
    );
  }
}

// REST PHASE LOGIC
function startRest() {
  document.body.classList.remove('forge-background');
  sessionView.classList.remove('forge-background');
  forgeImageWrapper.classList.add('hidden');
  coolingImageWrapper.classList.remove('hidden');
  document.body.classList.remove('mist');
  document.body.classList.add('cooling-background');
  sessionView.classList.add('cooling-background');
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
        showTransition(
          'Sword is Rusting',
          'Back to Forge',
          () => {
            currentRound++;
            studyRemaining = studyDuration;
            startStudy();
          },
          '../sword_rusting.png',
          'rusting-glow'
        );
      } else {
        endSession(true);
      }
    }
  }, 1000);
}

// TRANSITION TIMERS
function showTransition(text, btnText, onConfirm, imgSrc = null, overlayClass = '') {
  let elapsed = 0;
  overlayHeader.textContent = text;
  overlayCountdown.textContent = 30;
  overlayBtn.textContent = btnText;
  if (imgSrc) {
    overlayImage.src = imgSrc;
    overlayImageWrapper.classList.remove('hidden');
  } else {
    overlayImageWrapper.classList.add('hidden');
  }
  overlay.classList.remove('hidden');
  overlay.classList.remove('burning-glow', 'rusting-glow');
  if (overlayClass) overlay.classList.add(overlayClass);
  overlayBtn.onclick = () => {
    clearInterval(transitionTimer);
    transitionTimer = null;
    overlay.classList.add('hidden');
    overlay.classList.remove('burning-glow', 'rusting-glow');
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
      overlay.classList.remove('burning-glow', 'rusting-glow');
      transitionDurations.push(30);
      endSession(false);
    }
  }, 1000);
}

function overheated() {
  exitFullscreen();
  showTransition(
    'The sword is overheating!',
    'Cool Down',
    () => {
      if (currentRound >= rounds) {
        endSession(true);
      } else {
        startRest();
      }
    },
    '../sword_burning.png',
    'burning-glow'
  );
}

function startCoolDown() {
  clearInterval(phaseTimer);
  phaseTimer = null;
  showTransition('Sword is burning', 'Cool Down', () => {
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
        showTransition(
          'Sword Rusting',
          'Enter Forge',
          () => {
            currentRound++;
            studyRemaining = studyDuration;
            startStudy();
          },
          '../sword_rusting.png',
          'rusting-glow'
        );
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

  if (!success) outcome = 'Blade Broke';
  statsEl.innerHTML = `
    <p>Outcome: ${outcome}</p>`;
    <p>Total seconds out of full-screen during Studying Phases: ${transitionDurations.filter((_, index) => index % 2 === 0).join(', ')}</p>
    <p>Total seconds inside full-screen during Rest Phases: ${transitionDurations.filter((_, index) => index % 2 !== 0).join(', ')}</p>
  if (success) {
    nameEntry.classList.remove('hidden');
    brokenIcon.classList.add('hidden');
  } else {
    nameEntry.classList.add('hidden');
    brokenIcon.classList.remove('hidden');
  }
  showView(statsView);
}

function renderBladeList() {
  bladeListEl.innerHTML = '';
  const player = playerNameInput.value.trim() || 'Unknown';
  if (listTitle) {
    listTitle.textContent = `Forged Swords - ${player}`;
  }
  forgedBlades.forEach(blade => {
    const li = document.createElement('li');
    const displayPlayer = blade.player || player;
    li.innerHTML = `<img src="../sword_icon.png" alt="sword icon" class="list-icon"> ${blade.bladeName} - ${displayPlayer} - [${blade.transitions.join(', ')}]`;
    bladeListEl.appendChild(li);
  });
}

function format(s) {
  const m = String(Math.floor(s / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
}

// Start on the mode selection menu
showView(modeMenu);
