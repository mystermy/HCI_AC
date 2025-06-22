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

// Track selected mode
let selectedMode = '';

// FORM HANDLERS
randomModeBtn.addEventListener('click', () => {
    const userName = document.getElementById('userName').value.trim();
    if (!userName) {
        alert('Please enter your name');
        return;
    }
    currentUserName = userName;
    selectedMode = 'random';
    showView(menu);
});

personalisedModeBtn.addEventListener('click', () => {
    const userName = document.getElementById('userName').value.trim();
    if (!userName) {
        alert('Please enter your name');
        return;
    }
    currentUserName = userName;
    selectedMode = 'personalised';
    showView(menu);
});

startForgeBtn.addEventListener('click', () => showView(formView));
showListBtn.addEventListener('click', () => {
    renderBladeList();
    showView(listView);
});

// Add show results button handler
document.getElementById('showResults').addEventListener('click', () => {
  generateResultsTable();
});

beginSessionBtn.addEventListener('click', () => {
    currentUserName = document.getElementById('userName').value.trim();
    if (!currentUserName) {
        alert('Please enter your name');
        return;
    }
    rounds = parseInt(document.getElementById('rounds').value) || 1;
    const studyMinutes = parseFloat(document.getElementById('studyMinutes').value) || 1;
    studyDuration = Math.round(studyMinutes * 60); // Convert to seconds, round to nearest second
    restDuration = Math.round((parseFloat(document.getElementById('restMinutes').value) || 1) * 60);
    // Calculate transition limit: 30 seconds base + 1 second per minute of study time (rounded up)
    transitionLimit = 30 + Math.ceil(studyMinutes);
    // Calculate grace period: 2 seconds base + 1 second for each 2 minutes of study (rounded up)
    gracePeriodDuration = 2 + Math.floor(studyMinutes / 2);
    currentRound = 1;
    studyRemaining = studyDuration;
    restRemaining = restDuration;
    burningTransitions = [];
    meltingTransitions = [];
    rustingTransitions = [];
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
        // Generate improvement message
        let improvementMsg = '';

        // Calculate total transitions for each type
        let totalBurning = burningTransitions.reduce((sum, time) => sum + (time || 0), 0);
        let totalMelting = meltingTransitions.reduce((sum, time) => sum + (time || 0), 0);
        let totalRusting = rustingTransitions.reduce((sum, time) => sum + (time || 0), 0);

        // Find the most problematic transition type
        const maxTransition = Math.max(totalBurning, totalMelting, totalRusting);
        let problemArea = '';

        if (maxTransition > 0) {
            if (maxTransition === totalBurning) {
                problemArea = 'maintaining focus during study';
            } else if (maxTransition === totalMelting) {
                problemArea = 'managing study time';
            } else {
                problemArea = 'managing break time';
            }

            const tips = [
                { area: 'maintaining focus during study', tip: 'Try to eliminate distractions before starting your study session' },
                { area: 'managing study time', tip: 'Set a timer to help you track your study duration' },
                { area: 'managing break time', tip: 'Set an alarm for your break time to avoid over-extending' }
            ];

            if (selectedMode === 'personalised') {
                const avgTransition = Math.round(maxTransition / rounds);
                let tipText = '';

                if (maxTransition === totalBurning) {
                    tipText = tips[0].tip;
                } else if (maxTransition === totalMelting) {
                    tipText = tips[1].tip;
                } else {
                    tipText = tips[2].tip;
                }

                improvementMsg = {
                    type: 'personalised',
                    focusArea: `${problemArea} (avg. ${avgTransition}s lost)`,
                    tip: tipText
                };
            } else if (selectedMode === 'random') {
                // Randomly select a tip from the same tips used in personalized mode
                const randomTip = tips[Math.floor(Math.random() * tips.length)];
                improvementMsg = {
                    type: 'random',
                    tip: randomTip.tip
                };
            }
        }

        forgedBlades.push({
            name,
            userName: currentUserName,
            burning: burningTransitions.slice(),
            melting: meltingTransitions.slice(),
            rusting: rustingTransitions.slice(),
            studyDuration: studyDuration,
            restDuration: restDuration,
            rounds: rounds,
            transitionLimit: transitionLimit,
            improvementMsg: improvementMsg
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

  // Update mode display in menu
  if (view === menu) {
    const modeDisplay = document.getElementById('currentMode');
    if (modeDisplay) {
      modeDisplay.textContent = `Current Mode: ${selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)}`;
    }
  }

  if (view !== sessionView) exitFullscreen();
}

// SESSION STATE & CONFIG
let rounds = 1;
let studyDuration = 0;
let restDuration = 0;
let currentRound = 1;
let studyRemaining = 0;
let restRemaining = 0;
let burningTransitions = [];
let meltingTransitions = [];
let rustingTransitions = [];
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
        'The sword is burning! Return quickly!',
        'Return to Forge',
        (effectiveTime) => {
          // This is a burning transition (manual leave)
          burningTransitions[currentRound - 1] = effectiveTime;
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
            (effectiveTime) => {
              // Record rusting transition
              rustingTransitions[currentRound - 1] = effectiveTime;
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
  let effectiveTime = 0;  // Track actual countable time
  let countingStarted = false;  // Flag to track when to start counting
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
    // Pass the current effective time when button is clicked
    onConfirm(effectiveTime);
  };

  transitionTimer = setInterval(() => {
    elapsed++;

    // Show grace period countdown until it ends
    if (elapsed <= gracePeriodDuration) {
      graceCountdownEl.textContent = `Grace Period: ${gracePeriodDuration - elapsed}s`;
    } else if (elapsed === gracePeriodDuration + 1) {
      // Grace period just ended
      graceCountdownEl.textContent = 'Grace Period Ended!';
      overlayHeader.textContent = text + "\nTransitions now count!";
      countingStarted = true;  // Start counting only when this message appears
      effectiveTime = 0;  // Reset counter at this point
    } else if (countingStarted) {
      // Only increment if we're past grace and counting has started
      effectiveTime++;
    }

    // Update the main countdown showing effective time
    overlayCountdown.textContent = Math.max(0, transitionLimit - effectiveTime);

    // Auto-confirm if limit reached
    if (effectiveTime >= transitionLimit) {
      clearInterval(transitionTimer);
      transitionTimer = null;
      overlay.classList.add('hidden');
      overlay.classList.remove('burning-glow', 'rusting-glow');
      onConfirm(transitionLimit);
    }
  }, 1000);
}

function overheated() {
  exitFullscreen();
  showTransition(
      'The sword is melting! It was in the forge too long!',
      'Cool it Down',
      (effectiveTime) => {
        // This is a melting transition (study timer expired)
        meltingTransitions[currentRound - 1] = effectiveTime;

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
  showTransition(
    'Sword is rusting!',
    'Cool it Down',
    (effectiveTime) => {
      // Use the effective time (after grace period)
      transitionDurations.push(effectiveTime);
      exitFullscreen();
      startRestTimer();
    },
    '../sword_rusting.png',
    'rusting-glow'
  );
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

  // Calculate score for this session
  const tempBlade = {
    userName: currentUserName,
    burning: burningTransitions.slice(),
    melting: meltingTransitions.slice(),
    rusting: rustingTransitions.slice(),
    studyDuration: studyDuration,
    rounds: rounds,
    transitionLimit: transitionLimit
  };

  // Calculate deductions based on all transition types
  const studyMinutes = studyDuration / 60;
  const baseScore = 100 * studyMinutes;
  const deductionRate = (baseScore / (transitionLimit * rounds)) * 2;

  let scoreChange = baseScore;

  // Apply deductions for each type of transition
  for (let i = 0; i < rounds; i++) {
    if (burningTransitions[i]) scoreChange -= (burningTransitions[i] * deductionRate);
    if (meltingTransitions[i]) scoreChange -= (meltingTransitions[i] * deductionRate);
    if (rustingTransitions[i]) scoreChange -= (rustingTransitions[i] * deductionRate);
  }

  // Calculate maximum possible points and percentage
  const maxPossiblePoints = baseScore;
  let percentage = 50 + ((scoreChange / maxPossiblePoints) * 50);
  percentage = Math.max(0, Math.min(100, percentage));

  // Create score display with color
  const scoreColor = scoreChange >= 0 ? '#4CAF50' : '#FF5252';
  let statsHtml = `<p class="score-change" style="color: ${scoreColor}; font-size: 1.5em; font-weight: bold;">
      Score: ${scoreChange >= 0 ? '+' : ''}${Math.round(scoreChange)}</p>
      <p style="font-size: 1.2em; margin-top: 10px; color: #00bfff;">Sword Quality: ${Math.round(percentage)}%</p>`;

  statsHtml += `<p>Outcome: ${outcome}</p>
        <p>Study Duration: ${studyDuration / 60} minutes</p>
        <p>Rest Duration: ${restDuration / 60} minutes</p>
        <div class="round-stats">`;

  for (let round = 0; round < rounds; round++) {
    statsHtml += `<div class="round-detail">
        <h3>Round ${round + 1}</h3>
        <p>Left forge (burning): ${burningTransitions[round] || 0} seconds</p>
        <p>Study time exceeded (melting): ${meltingTransitions[round] || 0} seconds</p>
        <p>Rest phase (rusting): ${rustingTransitions[round] || 0} seconds</p>
    </div>`;
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
    let lastSessionScore = 0;
    blades.forEach(blade => {
        const studyMinutes = blade.studyDuration / 60;
        const numSessions = blade.rounds;
        const baseScore = 100 * studyMinutes;

        // Calculate deduction rate: baseScore / (transitionLimit * rounds) * 2 for increased penalty
        const deductionRate = (baseScore / (blade.transitionLimit * numSessions)) * 2;

        // Process each round's transitions
        let sessionScore = baseScore;
        for (let i = 0; i < blade.rounds; i++) {
            // Sum up all types of transitions
            const burning = blade.burning ? (blade.burning[i] || 0) : 0;
            const melting = blade.melting ? (blade.melting[i] || 0) : 0;
            const rusting = blade.rusting ? (blade.rusting[i] || 0) : 0;

            // Deduct points for each type of transition
            sessionScore -= (burning * deductionRate);
            sessionScore -= (melting * deductionRate);
            sessionScore -= (rusting * deductionRate);
        }

        lastSessionScore = sessionScore;
        totalScore += sessionScore;
    });
    return {
        totalScore: Math.round(totalScore),
        lastSessionScore: Math.round(lastSessionScore)
    };
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

        // Analyze transitions for improvement suggestions
        let totalBurning = 0;
        let totalMelting = 0;
        let totalRusting = 0;
        let totalRounds = 0;

        playerBlades[currentUserName].forEach(blade => {
            if (blade.burning) {
                blade.burning.forEach(time => totalBurning += (time || 0));
                totalRounds += blade.rounds;
            }
            if (blade.melting) {
                blade.melting.forEach(time => totalMelting += (time || 0));
            }
            if (blade.rusting) {
                blade.rusting.forEach(time => totalRusting += (time || 0));
            }
        });

        const maxTransition = Math.max(totalBurning, totalMelting, totalRusting);
        let problemArea = '';
        let avgTransition = Math.round(maxTransition / totalRounds);

        if (maxTransition > 0) {
            if (maxTransition === totalBurning) {
                problemArea = 'maintaining focus during study';
            } else if (maxTransition === totalMelting) {
                problemArea = 'managing study time';
            } else {
                problemArea = 'managing break time';
            }
        }

        // Create improvement suggestions based on mode
        let improvementMsg = '';
        if (maxTransition > 0) {
            const tips = [
                { area: 'maintaining focus during study', tip: 'Try to eliminate distractions before starting your study session' },
                { area: 'managing study time', tip: 'Set a timer to help you track your study duration' },
                { area: 'managing break time', tip: 'Set an alarm for your break time to avoid over-extending' }
            ];

            if (selectedMode === 'personalised') {
                let tipText = '';
                if (maxTransition === totalBurning) {
                    tipText = tips[0].tip;
                } else if (maxTransition === totalMelting) {
                    tipText = tips[1].tip;
                } else {
                    tipText = tips[2].tip;
                }

                improvementMsg = `<div style="color: #FFA500; margin-top: 10px; text-align: left;">
                    <div style="font-size: 1.2em; color: #FFD700; margin-bottom: 15px;">Study Improvement Tips</div>
                    <div style="margin-bottom: 10px;">Area to improve: ${problemArea} (avg. ${avgTransition}s lost)</div>
                    <div style="font-size: 0.9em; color: #FFD700;">${tipText}</div>
                </div>`;
            } else if (selectedMode === 'random') {
                // Randomly select a tip from the same tips used in personalized mode
                const randomTip = tips[Math.floor(Math.random() * tips.length)];
                improvementMsg = `<div style="color: #FFA500; margin-top: 10px; text-align: left;">
                    <div style="font-size: 1.2em; color: #FFD700; margin-bottom: 15px;">Random Study Tip</div>
                    <div style="font-size: 0.9em; color: #FFD700;">${randomTip.tip}</div>
                </div>`;
            }
        }

        playerStatsEl.innerHTML = `
            <div class="player-name">${currentUserName}</div>
            <div class="player-rank">Total Score: ${rank.totalScore}</div>
            ${improvementMsg}
        `;

        // Show current player's blades
        const blades = playerBlades[currentUserName];
        bladeListEl.innerHTML = '<h2>Your Forged Blades</h2>';
        blades.forEach(blade => {
            blade.transitionLimit = 30 + Math.ceil(blade.studyDuration / 60);

            const singleBladeRank = calculatePlayerRank([blade]);
            const scoreChange = singleBladeRank.lastSessionScore;
            const maxPossiblePoints = 100 * (blade.studyDuration / 60);
            let percentage = 50 + ((scoreChange / maxPossiblePoints) * 50);
            percentage = Math.max(0, Math.min(100, percentage));

            // Format transitions to show all phases for each round
            const formattedTransitions = [];
            for (let round = 0; round < blade.rounds; round++) {
                const burning = blade.burning ? blade.burning[round] || 0 : 0;
                const melting = blade.melting ? blade.melting[round] || 0 : 0;
                const rusting = blade.rusting ? blade.rusting[round] || 0 : 0;

                let roundTransitions = `Round ${round + 1}: `;
                roundTransitions += `Left forge (burning): ${burning}s`;
                roundTransitions += `, Study time exceeded (melting): ${melting}s`;
                roundTransitions += `, Rest phase (rusting): ${rusting}s`;

                formattedTransitions.push(roundTransitions);
            }

            const li = document.createElement('li');
            const bladeInfo = document.createElement('div');
            bladeInfo.className = 'blade-info';

            bladeInfo.innerHTML = `
                <img src="../sword_icon.png" alt="sword icon" class="list-icon">
                <div class="blade-details">
                    <span class="blade-name">${blade.name}</span>
                    <span class="blade-stats">Study Duration: ${blade.studyDuration/60} minutes, ${blade.rounds} rounds</span>
                    <span class="blade-stats">Transitions: [${formattedTransitions.join(', ')}]</span>
                    <div class="blade-stats">
                        <span style="color: ${scoreChange >= 0 ? '#4CAF50' : '#FF5252'}">
                            Score: ${scoreChange >= 0 ? '+' : ''}${scoreChange}
                        </span>
                        <span style="color: #00bfff; margin-left: 10px;">
                            Quality: ${Math.round(percentage)}%
                        </span>
                    </div>
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

function generateResultsTable() {
    const resultsView = document.getElementById('resultsView');
    const backButton = resultsView.querySelector('.backMenu');

    // Create table headers
    let tableHTML = `
        <div class="results-table">
            <h2>Study Session Results</h2>
            <table>
                <thead>
                    <tr>
                        <th>User Name</th>
                        <th>Blade Name</th>
                        <th>Mode</th>
                        <th>Study Duration (min)</th>
                        <th>Rest Duration (min)</th>
                        <th>Rounds</th>
                        <th>Score</th>
                        <th>Quality</th>
                        <th>Transitions</th>
                        <th>Improvement Tips</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Add each blade's data
    forgedBlades.forEach(blade => {
        const studyMinutes = blade.studyDuration / 60;
        const restMinutes = blade.restDuration ? blade.restDuration / 60 : 5;

        // Calculate score using all transition types
        const baseScore = 100 * studyMinutes;
        const deductionRate = (baseScore / (blade.transitionLimit * blade.rounds)) * 2;
        let scoreChange = baseScore;

        // Apply deductions for each type of transition
        for (let i = 0; i < blade.rounds; i++) {
            if (blade.burning && blade.burning[i]) scoreChange -= (blade.burning[i] * deductionRate);
            if (blade.melting && blade.melting[i]) scoreChange -= (blade.melting[i] * deductionRate);
            if (blade.rusting && blade.rusting[i]) scoreChange -= (blade.rusting[i] * deductionRate);
        }

        const maxPossiblePoints = baseScore;
        let percentage = 50 + ((scoreChange / maxPossiblePoints) * 50);
        percentage = Math.max(0, Math.min(100, percentage));

        // Format transitions to show rounds clearly
        const formattedTransitions = [];
        for (let round = 0; round < blade.rounds; round++) {
            const burning = blade.burning ? blade.burning[round] || 0 : 0;
            const melting = blade.melting ? blade.melting[round] || 0 : 0;
            const rusting = blade.rusting ? blade.rusting[round] || 0 : 0;

            let roundTransitions = `Round ${round + 1}: `;
            roundTransitions += `Left forge (burning): ${burning}s`;
            roundTransitions += `, Study time exceeded (melting): ${melting}s`;
            roundTransitions += `, Rest phase (rusting): ${rusting}s`;

            formattedTransitions.push(roundTransitions);
        }

        // Format improvement message
        let improvementContent = '';
        if (blade.improvementMsg) {
            if (blade.improvementMsg.type === 'personalised') {
                improvementContent = `
                    <div>Area to improve: ${blade.improvementMsg.focusArea}</div>
                    <div>Tip: ${blade.improvementMsg.tip}</div>
                `;
            } else if (blade.improvementMsg.type === 'random') {
                improvementContent = `<div>Tip: ${blade.improvementMsg.tip}</div>`;
            }
        }

        tableHTML += `
            <tr>
                <td>${blade.userName}</td>
                <td>${blade.name}</td>
                <td>${selectedMode}</td>
                <td>${studyMinutes}</td>
                <td>${restMinutes}</td>
                <td>${blade.rounds}</td>
                <td>${Math.round(scoreChange)}</td>
                <td>${Math.round(percentage)}%</td>
                <td>${formattedTransitions.join('<br>')}</td>
                <td>${improvementContent}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    </div>`;

    // Clear the view and add the table
    resultsView.innerHTML = `
        <h1>Study Results</h1>
        ${tableHTML}
    `;

    // Re-add the back button
    if (backButton) {
        resultsView.appendChild(backButton);
    }

    showView(resultsView);
}

function format(s) {
  const m = String(Math.floor(s / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
}

// Start on the mode selection menu
showView(modeMenu);