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
            rounds: rounds,
            transitionLimit: transitionLimit
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
        'The sword is not being watched, it might break!',
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
  showTransition('Sword is burning!', 'Cool it Down', () => {
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

  // Calculate score for this session
  const tempBlade = {
    userName: currentUserName,
    transitions: transitionDurations.slice(),
    studyDuration: studyDuration,
    rounds: rounds,
    transitionLimit: transitionLimit
  };
  const scoreResult = calculatePlayerRank([tempBlade]);
  const scoreChange = scoreResult.lastSessionScore;

  // Calculate maximum possible points (base score with no deductions)
  const studyMinutes = studyDuration / 60;
  const maxPossiblePoints = 100 * studyMinutes;

  // Calculate percentage: 100% at max points, 50% at 0 points, 0% at -max points or lower
  let percentage = 50 + ((scoreChange / maxPossiblePoints) * 50);
  percentage = Math.max(0, Math.min(100, percentage)); // Clamp between 0 and 100

  // Create score display with color
  const scoreColor = scoreChange >= 0 ? '#4CAF50' : '#FF5252';
  let statsHtml = `<p class="score-change" style="color: ${scoreColor}; font-size: 1.5em; font-weight: bold;">
      Score: ${scoreChange >= 0 ? '+' : ''}${scoreChange}</p>
      <p style="font-size: 1.2em; margin-top: 10px; color: #00bfff;">Sword Quality: ${Math.round(percentage)}%</p>`;

  statsHtml += `<p>Outcome: ${outcome}</p><div class="round-stats">`;

  // ...existing code for round-by-round breakdown...
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
    let lastSessionScore = 0;
    blades.forEach(blade => {
        const studyMinutes = blade.studyDuration / 60;
        const numSessions = blade.rounds;
        const baseScore = 100 * studyMinutes;

        // Calculate deduction rate: baseScore / (transitionLimit * rounds) * 2 for increased penalty
        const deductionRate = (baseScore / (blade.transitionLimit * numSessions)) * 2;

        // Process each round's transitions
        let sessionScore = baseScore;
        for (let i = 0; i < blade.transitions.length; i++) {
            const transitionTime = blade.transitions[i];

            // For each second in transition after grace period, deduct points based on rate
            if (transitionTime > 0) {
                sessionScore -= (transitionTime * deductionRate);
            }
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

        // Analyze all transitions to find the longest and its type
        let longestTransition = 0;
        let isForgeTransition = true;
        let totalStudyTransitions = 0;
        let totalRestTransitions = 0;
        let studyTransitionCount = 0;
        let restTransitionCount = 0;

        playerBlades[currentUserName].forEach(blade => {
            blade.transitions.forEach((time, index) => {
                if (index % 2 === 0) {
                    totalStudyTransitions += time;
                    studyTransitionCount++;
                } else {
                    totalRestTransitions += time;
                    restTransitionCount++;
                }
                if (time > longestTransition) {
                    longestTransition = time;
                    isForgeTransition = (index % 2 === 0);
                }
            });
        });

        // Calculate averages
        const avgStudyTransition = studyTransitionCount > 0 ? Math.round(totalStudyTransitions / studyTransitionCount) : 0;
        const avgRestTransition = restTransitionCount > 0 ? Math.round(totalRestTransitions / restTransitionCount) : 0;

        // Create improvement suggestions based on mode
        let improvementMsg = '';
        if (longestTransition > 0) {
            if (selectedMode === 'personalised') {
                const focusType = isForgeTransition ?
                    `maintaining focus during study (avg. ${avgStudyTransition}s lost)` :
                    `taking proper break length (avg. ${avgRestTransition}s over)`;

                const tipText = isForgeTransition ?
                    'Tip: Try to eliminate distractions before starting your study session' :
                    'Tip: Set an alarm for your break time to avoid over-extending';

                improvementMsg = `<div style="color: #FFA500; margin-top: 10px; text-align: left;">
                    <div style="font-size: 1.2em; color: #FFD700; margin-bottom: 15px;">Study Improvement Tips</div>
                    <div style="margin-bottom: 10px;">Area to improve: ${focusType}</div>
                    <div style="font-size: 0.9em; color: #FFD700;">${tipText}</div>
                </div>`;
            } else if (selectedMode === 'random') {
                const randomTips = [
                    'Try studying in a quiet environment to maintain better focus',
                    'Take short breaks between study sessions to stay refreshed',
                    'Use a timer to track your study and break periods',
                    'Remove distractions like phones before starting',
                    'Stay hydrated during your study sessions',
                    'Make sure your study area is well-lit and comfortable',
                    'Try the Pomodoro technique: 25 minutes of study, 5 minutes break',
                    'Review your material briefly before starting a session'
                ];
                const randomTip = randomTips[Math.floor(Math.random() * randomTips.length)];

                improvementMsg = `<div style="color: #FFA500; margin-top: 10px; text-align: left;">
                    <div style="font-size: 1.2em; color: #FFD700; margin-bottom: 15px;">Random Study Tip</div>
                    <div style="font-size: 0.9em; color: #FFD700;">${randomTip}</div>
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
            // Add missing transitionLimit to blade for score calculation
            blade.transitionLimit = 30 + Math.ceil(blade.studyDuration / 60);

            const singleBladeRank = calculatePlayerRank([blade]);
            const scoreChange = singleBladeRank.lastSessionScore;
            const maxPossiblePoints = 100 * (blade.studyDuration / 60);
            let percentage = 50 + ((scoreChange / maxPossiblePoints) * 50);
            percentage = Math.max(0, Math.min(100, percentage));

            const li = document.createElement('li');
            const bladeInfo = document.createElement('div');
            bladeInfo.className = 'blade-info';

            bladeInfo.innerHTML = `
                <img src="../sword_icon.png" alt="sword icon" class="list-icon">
                <div class="blade-details">
                    <span class="blade-name">${blade.name}</span>
                    <span class="blade-stats">Study Duration: ${blade.studyDuration/60} minutes, ${blade.rounds} rounds</span>
                    <span class="blade-stats">Transitions: [${blade.transitions.join(', ')}]</span>
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
    // Get reference to the results view and preserve the back button if it exists
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
                        <th>Rounds</th>
                        <th>Score</th>
                        <th>Quality</th>
                        <th>Transitions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Add each blade's data
    forgedBlades.forEach(blade => {
        const studyMinutes = blade.studyDuration / 60;
        const singleBladeRank = calculatePlayerRank([blade]);
        const scoreChange = singleBladeRank.lastSessionScore;
        const maxPossiblePoints = 100 * studyMinutes;
        let percentage = 50 + ((scoreChange / maxPossiblePoints) * 50);
        percentage = Math.max(0, Math.min(100, percentage));

        tableHTML += `
            <tr>
                <td>${blade.userName}</td>
                <td>${blade.name}</td>
                <td>${selectedMode}</td>
                <td>${studyMinutes}</td>
                <td>${blade.rounds}</td>
                <td>${scoreChange}</td>
                <td>${Math.round(percentage)}%</td>
                <td>${blade.transitions.join(', ')}</td>
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