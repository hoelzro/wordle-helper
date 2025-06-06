let WORDS = [];
const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const letterStates = {};

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
            div.addEventListener('click', () => cycleState(letter, div));
            rowDiv.appendChild(div);
        });
        grid.appendChild(rowDiv);
    });
}

function cycleState(letter, element) {
    const states = ['unknown', 'present', 'absent'];
    let idx = states.indexOf(letterStates[letter]);
    idx = (idx + 1) % states.length;
    letterStates[letter] = states[idx];
    element.className = 'tile' + (letterStates[letter] !== 'unknown' ? ' ' + letterStates[letter] : '');
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
        input.addEventListener('input', filterWords);
    });
    loadWords();
});
