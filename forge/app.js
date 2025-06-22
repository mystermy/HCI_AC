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
const forgeImageWrapper = document.getElementById('forgeImageWrapper');
const coolingImageWrapper = document.getElementById('coolingImageWrapper');
const overlayImageWrapper = document.getElementById('overlayImageWrapper');
const overlayImage = document.getElementById('overlayImage');
const brokenIcon = document.getElementById('brokenIcon');
const finalSwordIcon = document.getElementById('finalSwordIcon');
const timerSound = document.getElementById('timerSound');

// FORM HANDLERS
randomModeBtn.addEventListener('click', () => {
    const userName = document.getElementById('userName').value.trim();
    if (!userName) {
        alert('Please enter your name');
        return;
    }
    currentUserName = userName;
    showView(menu);
});

personalisedModeBtn.addEventListener('click', () => {
    const userName = document.getElementById('userName').value.trim();
    if (!userName) {
        alert('Please enter your name');
        return;
    }
    currentUserName = userName;
    showView(menu);
});

startForgeBtn.addEventListener('click', () => showView(formView));
showListBtn.addEventListener('click', () => {
  renderBladeList();
  showView(listView);
});

beginSessionBtn.addEventListener('click', () => {
    currentUserName = document.getElementById('userName').value.trim();
    if (!currentUserName) {
        alert('Please enter your name');
        return;
    }
    rounds = parseInt(document.getElementById('rounds').value) || 1;
    const studyMinutes = parseInt(document.getElementById('studyMinutes').value) || 1;
    studyDuration = studyMinutes * 60;
    restDuration = (parseInt(document.getElementById('restMinutes').value) || 1) * 60;
    // Calculate transition limit: 30 seconds base + 1 second per minute of study time
    transitionLimit = 30 + studyMinutes;
    // Calculate grace period: 2 seconds base + 1 second for each 2 minutes of study
    gracePeriodDuration = 2 + Math.floor(studyMinutes / 2);
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
        forgedBlades.push({
            name,
            userName: currentUserName,
            transitions: transitionDurations.slice(),
            studyDuration: studyDuration,
            rounds: rounds
        });
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
let currentUserName = '';
let transitionLimit = 30; // Base transition time
let gracePeriodDuration = 2; // Base grace period
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
        'The sword is not being watched it might break!',
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
  let gracePeriod = true;
  const graceCountdownEl = document.getElementById('graceCountdown');

  overlayHeader.textContent = text;
  overlayCountdown.textContent = transitionLimit;
  graceCountdownEl.textContent = `Grace Period: ${gracePeriodDuration}s`;
  overlayBtn.textContent = btnText;
  timerSound.currentTime = 0;
  timerSound.play();

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
    timerSound.pause();
    timerSound.currentTime = 0;
    clearInterval(transitionTimer);
    transitionTimer = null;
    overlay.classList.add('hidden');
    overlay.classList.remove('burning-glow', 'rusting-glow');
    // Only count the time after grace period
    const countedTime = Math.max(0, elapsed - gracePeriodDuration);
    transitionDurations.push(countedTime);
    onConfirm();
  };

  transitionTimer = setInterval(() => {
    elapsed++;

    // Update the grace period countdown if we're still in grace period
    if (elapsed <= gracePeriodDuration) {
      graceCountdownEl.textContent = `Grace Period: ${gracePeriodDuration - elapsed}s`;
    } else if (elapsed === gracePeriodDuration + 1) {
      graceCountdownEl.textContent = 'Grace Period Ended!';
      overlayHeader.textContent = text + "\nTransitions now count!";
    }

    // Update the main countdown (showing remaining time excluding grace period)
    overlayCountdown.textContent = transitionLimit - Math.max(0, elapsed - gracePeriodDuration);


    if (elapsed >= transitionLimit + gracePeriodDuration) {
      clearInterval(transitionTimer);
      transitionTimer = null;
      overlay.classList.add('hidden');
      overlay.classList.remove('burning-glow', 'rusting-glow');
      transitionDurations.push(transitionLimit);
      endSession(false);
    }
  }, 1000);
}

function overheated() {
  exitFullscreen();
  showTransition(
      'The sword is overheating!',
      'Cool it Down',
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
  showTransition('Sword is burning', 'Cool it Down', () => {
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

  if (!success) {
    outcome = 'Blade Broke';
    brokenIcon.classList.remove('hidden');
    finalSwordIcon.classList.add('hidden');
  } else {
    brokenIcon.classList.add('hidden');
    finalSwordIcon.classList.remove('hidden');
  }

  // Create round-by-round breakdown of transitions
  let statsHtml = `<p>Outcome: ${outcome}</p><div class="round-stats">`;

  for (let round = 0; round < rounds; round++) {
    const studyTransition = transitionDurations[round * 2];
    const restTransition = transitionDurations[round * 2 + 1];

    statsHtml += `<div class="round-detail">
      <h3>Round ${round + 1}</h3>`;

    if (studyTransition !== undefined) {
      statsHtml += `<p>Sword was not watched for ${studyTransition} seconds</p>`;
    }

    if (restTransition !== undefined) {
      statsHtml += `<p>Sword was burning for ${restTransition} seconds</p>`;
    }

    statsHtml += `</div>`;
  }

  statsHtml += '</div>';
  statsEl.innerHTML = statsHtml;

  if (success) {
    nameEntry.classList.remove('hidden');
  } else {
    nameEntry.classList.add('hidden');
  }
  showView(statsView);
}

function calculatePlayerRank(blades) {
    let totalScore = 0;
    blades.forEach(blade => {
        const studyMinutes = blade.studyDuration / 60;
        const numSessions = blade.rounds;
        const baseScore = 100 * studyMinutes;

        // Calculate deduction rate: baseScore / (transitionLimit * rounds)
        // This gives us how many points to deduct per second
        const deductionRate = baseScore / (blade.transitionLimit * numSessions);

        // Process each round's transitions
        for (let i = 0; i < blade.transitions.length; i++) {
            const transitionTime = blade.transitions[i];

            // Calculate points for this round
            let roundScore = baseScore;

            // For each second in transition after grace period, deduct points based on rate
            if (transitionTime > 0) {
                roundScore -= (transitionTime * deductionRate);
            }

            totalScore += roundScore;
        }
    });
    return Math.round(totalScore);
}

function renderBladeList() {
    const playerStatsEl = document.getElementById('playerStats');
    bladeListEl.innerHTML = '';

    // Group blades by player
    const playerBlades = {};
    forgedBlades.forEach(blade => {
        if (!playerBlades[blade.userName]) {
            playerBlades[blade.userName] = [];
        }
        playerBlades[blade.userName].push(blade);
    });

    // Show current player's stats
    if (playerBlades[currentUserName]) {
        const rank = calculatePlayerRank(playerBlades[currentUserName]);
        playerStatsEl.innerHTML = `
            <div class="player-name">${currentUserName}</div>
            <div class="player-rank">Rank: ${rank}</div>
        `;

        // Show current player's blades
        const blades = playerBlades[currentUserName];
        bladeListEl.innerHTML = '<h2>Your Forged Blades</h2>';
        blades.forEach(blade => {
            const li = document.createElement('li');
            const bladeInfo = document.createElement('div');
            bladeInfo.className = 'blade-info';

            bladeInfo.innerHTML = `
                <img src="../sword_icon.png" alt="sword icon" class="list-icon">
                <div class="blade-details">
                    <span class="blade-name">${blade.name}</span>
                    <span class="blade-stats">Study Duration: ${blade.studyDuration/60} minutes, ${blade.rounds} rounds</span>
                    <span class="blade-stats">Transitions: [${blade.transitions.join(', ')}]</span>
                </div>
            `;

            li.appendChild(bladeInfo);
            bladeListEl.appendChild(li);
        });
    } else {
        playerStatsEl.innerHTML = `
            <div class="player-name">${currentUserName}</div>
            <div class="player-rank">No swords forged yet</div>
        `;
    }
}

function format(s) {
  const m = String(Math.floor(s / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
}

// Start on the mode selection menu
showView(modeMenu);