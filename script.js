const words = ['banana', 'orange', 'grapefruit', 'apple', 'kiwi'];
let chosenWord = '';
let guessedLetters = [];
let remainingLetters = 0;

function chooseWord() {
    const index = Math.floor(Math.random() * words.length);
    chosenWord = words[index];
    guessedLetters = [];
    remainingLetters = chosenWord.length;
}

function displayWord() {
    const display = chosenWord.split('').map(letter => (guessedLetters.includes(letter) ? letter : '_')).join(' ');
    document.getElementById('wordDisplay').textContent = display;
}

function showMessage(msg) {
    document.getElementById('message').textContent = msg;
}

function resetGame() {
    chooseWord();
    displayWord();
    showMessage('');
}

function handleGuess() {
    const input = document.getElementById('guessInput');
    const guess = input.value.toLowerCase();
    input.value = '';

    if (!guess || guessedLetters.includes(guess)) {
        showMessage('Invalid guess.');
        return;
    }

    if (chosenWord.includes(guess)) {
        guessedLetters.push(guess);
        remainingLetters = chosenWord.split('').filter(letter => !guessedLetters.includes(letter)).length;
        showMessage('Correct!');
    } else {
        showMessage('Wrong guess.');
    }

    displayWord();

    if (remainingLetters === 0) {
        showMessage('You guessed the word!');
    }
}

window.addEventListener('load', () => {
    document.getElementById('guessButton').addEventListener('click', handleGuess);
    resetGame();
});
