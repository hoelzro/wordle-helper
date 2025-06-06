let WORDS = [];
const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const letterStates = {};
const tileElements = {};
let activeInput = null;

function createPopup() {
    const popup = document.getElementById('alphabet-popup');
    KEYBOARD_ROWS.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'popup-row';
        row.split('').forEach(ch => {
            const div = document.createElement('div');
            div.className = 'popup-letter';
            div.textContent = ch.toUpperCase();
            div.addEventListener('click', () => {
                if (activeInput) {
                    activeInput.value = ch;
                    activeInput.dispatchEvent(new Event('input'));
                }
                hidePopup();
            });
            rowDiv.appendChild(div);
        });
        popup.appendChild(rowDiv);
    });
    const clearDiv = document.createElement('div');
    clearDiv.className = 'popup-clear';
    clearDiv.textContent = 'Clear';
    clearDiv.addEventListener('click', () => {
        if (activeInput) {
            activeInput.value = '';
            activeInput.dataset.keepPresent = 'true';
            activeInput.dispatchEvent(new Event('input'));
            delete activeInput.dataset.keepPresent;
        }
        hidePopup();
    });
    popup.appendChild(clearDiv);
    document.addEventListener('click', (e) => {
        if (!popup.contains(e.target) && !e.target.classList.contains('position-tile')) {
            hidePopup();
        }
    });
}

function showPopup(input) {
    activeInput = input;
    const popup = document.getElementById('alphabet-popup');
    const rect = input.getBoundingClientRect();
    popup.style.left = rect.left + window.scrollX + 'px';
    popup.style.top = rect.bottom + window.scrollY + 5 + 'px';
    popup.style.display = 'flex';
}

function hidePopup() {
    activeInput = null;
    const popup = document.getElementById('alphabet-popup');
    popup.style.display = 'none';
}

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
        document.querySelectorAll('#position-row input').forEach(input => {
            if (input.value.toLowerCase() === letter) {
                input.value = '';
                input.dispatchEvent(new Event('input'));
            }
        });
    }
    filterWords();
}

function handlePositionInput(e) {
    const input = e.target;
    const keepPresent = input.dataset.keepPresent === 'true';
    let val = input.value.toLowerCase().replace(/[^a-z]/g, '');
    if (val.length > 1) val = val[0];
    if (val && letterStates[val] === 'absent') {
        val = '';
    }
    const prev = input.dataset.prev || '';
    if (prev && prev !== val) {
        const stillUsed = Array.from(document.querySelectorAll('#position-row input')).some(el => el !== input && el.value.toLowerCase() === prev);
        if (!stillUsed && letterStates[prev] === 'present' && !keepPresent) {
            setState(prev, 'unknown');
        }
    }
    input.value = val;
    input.dataset.prev = val;
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
    createPopup();
    document.querySelectorAll('#position-row input').forEach(input => {
        input.addEventListener('input', handlePositionInput);
        input.addEventListener('click', () => showPopup(input));
        input.dataset.prev = '';
    });
    loadWords();
});
