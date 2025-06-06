let WORDS = [];
const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const letterStates = {};
const tileElements = {};

function createGrid() {
    const grid = document.getElementById('letter-grid');
    KEYBOARD_ROWS.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'letter-row';
        row.split('').forEach(letter => {
            letterStates[letter] = 'unknown';
            const div = document.createElement('div');
            div.className = 'tile';
            div.textContent = letter.toUpperCase();
            div.addEventListener('click', () => cycleState(letter));
            rowDiv.appendChild(div);
            tileElements[letter] = div;
        });
        grid.appendChild(rowDiv);
    });
}

function setState(letter, state) {
    letterStates[letter] = state;
    const element = tileElements[letter];
    if (element) {
        element.className = 'tile' + (state !== 'unknown' ? ' ' + state : '');
    }
}

function cycleState(letter) {
    const states = ['unknown', 'present', 'absent'];
    let idx = states.indexOf(letterStates[letter]);
    idx = (idx + 1) % states.length;
    setState(letter, states[idx]);
    if (letterStates[letter] === 'absent') {
        document.querySelectorAll('.positions input').forEach(input => {
            if (input.value.toLowerCase() === letter) {
                input.value = '';
            }
        });
    }
    filterWords();
}

function handlePositionInput(e) {
    let val = e.target.value.toLowerCase().replace(/[^a-z]/g, '');
    if (val.length > 1) val = val[0];
    if (val && letterStates[val] === 'absent') {
        val = '';
    }
    e.target.value = val;
    if (val) {
        setState(val, 'present');
    }
    filterWords();
}

function filterWords() {
    const present = Object.keys(letterStates).filter(l => letterStates[l] === 'present');
    const absent = Object.keys(letterStates).filter(l => letterStates[l] === 'absent');
    const positions = [];
    for (let i = 0; i < 5; i++) {
        const val = document.getElementById('pos' + i).value.toLowerCase().replace(/[^a-z]/g, '');
        positions.push(val);
    }

    const matches = WORDS.filter(word => {
        for (const a of absent) {
            if (word.includes(a)) return false;
        }
        for (const p of present) {
            if (!word.includes(p)) return false;
        }
        for (let i = 0; i < 5; i++) {
            if (positions[i] && word[i] !== positions[i]) return false;
        }
        return true;
    });

    document.getElementById('result').textContent = `${matches.length} possible words`;
}

async function loadWords() {
    try {
        const response = await fetch('words.txt');
        const text = await response.text();
        WORDS = text.split(/\r?\n/).map(w => w.trim()).filter(Boolean);
    } catch (err) {
        console.error('Failed to load words:', err);
        WORDS = [];
    }
    filterWords();
}

document.addEventListener('DOMContentLoaded', () => {
    createGrid();
    document.querySelectorAll('.positions input').forEach(input => {
        input.addEventListener('input', handlePositionInput);
    });
    loadWords();
});
