let WORDS = [];
const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const letterStates = {};
const letterCounts = {};
const tileElements = {};
const popupLetterElements = {};
const countInputElements = {};
let sessionId = null;
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
            popupLetterElements[ch] = div;
            div.addEventListener('click', () => {
                if (letterStates[ch] !== 'absent' && activeInput) {
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

function getSessionId() {
    let id = sessionStorage.getItem('wordleHelperSession');
    if (!id) {
        id = Date.now().toString(36) + Math.random().toString(36).slice(2);
        sessionStorage.setItem('wordleHelperSession', id);
    }
    return id;
}


function createGrid() {
    const grid = document.getElementById('letter-grid');
    KEYBOARD_ROWS.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'letter-row';
        row.split('').forEach(letter => {
            letterStates[letter] = 'unknown';
            letterCounts[letter] = 0;

            const wrapper = document.createElement('div');
            wrapper.className = 'tile-container';

            const div = document.createElement('div');
            div.className = 'tile';
            div.textContent = letter.toUpperCase();
            div.addEventListener('click', () => cycleState(letter));
            wrapper.appendChild(div);
            tileElements[letter] = div;

            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.max = '5';
            input.step = '1';
            input.value = '0';
            input.className = 'count-input';
            input.addEventListener('input', () => {
                letterCounts[letter] = parseInt(input.value, 10) || 0;
                if (letterCounts[letter] > 0 && letterStates[letter] === 'unknown') {
                    setState(letter, 'present');
                }
                filterWords();
            });
            wrapper.appendChild(input);
            countInputElements[letter] = input;

            rowDiv.appendChild(wrapper);
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
    const popupElement = popupLetterElements[letter];
    if (popupElement) {
        if (state === 'absent') {
            popupElement.classList.add('disabled');
        } else {
            popupElement.classList.remove('disabled');
        }
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
        if (!stillUsed && input.dataset.addedPresent === prev && !keepPresent) {
            setState(prev, 'unknown');
        }
        input.dataset.addedPresent = '';
    }
    input.value = val;
    input.dataset.prev = val;
    if (val) {
        const usedElsewhere = Array.from(document.querySelectorAll('#position-row input')).some(el => el !== input && el.value.toLowerCase() === val);
        if (letterStates[val] === 'unknown' && !usedElsewhere && letterCounts[val] === 0) {
            input.dataset.addedPresent = val;
        } else {
            input.dataset.addedPresent = '';
        }
        setState(val, 'present');
    }
    filterWords();
}

function saveState() {
    const positions = [];
    document.querySelectorAll('#position-row input').forEach(input => {
        positions.push(input.value.toLowerCase());
    });
    const state = {
        letterStates,
        letterCounts,
        positions
    };
    try {
        localStorage.setItem('wordleHelperState-' + sessionId, JSON.stringify(state));
    } catch (err) {
        console.error('Failed to save state', err);
    }
}

function loadState() {
    let data;
    try {
        data = localStorage.getItem('wordleHelperState-' + sessionId);
    } catch (err) {
        console.error('Failed to access storage', err);
        return;
    }
    if (!data) return;
    try {
        const state = JSON.parse(data);
        if (state.letterStates) {
            Object.keys(state.letterStates).forEach(letter => {
                if (letterStates.hasOwnProperty(letter)) {
                    setState(letter, state.letterStates[letter]);
                }
            });
        }
        if (state.letterCounts) {
            Object.keys(state.letterCounts).forEach(letter => {
                if (letterCounts.hasOwnProperty(letter)) {
                    letterCounts[letter] = state.letterCounts[letter];
                    if (countInputElements[letter]) {
                        countInputElements[letter].value = state.letterCounts[letter];
                    }
                }
            });
        }
        if (Array.isArray(state.positions)) {
            document.querySelectorAll('#position-row input').forEach((input, i) => {
                const val = state.positions[i] || '';
                input.value = val;
                input.dataset.prev = val;
                input.dataset.addedPresent = '';
            });
        }
    } catch (err) {
        console.error('Failed to load state', err);
    }
    filterWords();
}

function filterWords() {
    const present = Object.keys(letterStates).filter(l => letterStates[l] === 'present');
    const absent = Object.keys(letterStates).filter(l => letterStates[l] === 'absent');
    const counts = { ...letterCounts };
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
        for (const [ltr, cnt] of Object.entries(counts)) {
            if (cnt > 0) {
                const occurrences = word.split(ltr).length - 1;
                if (occurrences !== cnt) return false;
            }
        }
        for (let i = 0; i < 5; i++) {
            if (positions[i] && word[i] !== positions[i]) return false;
        }
        return true;
    });

    matches.sort();
    const resultEl = document.getElementById('result');
    const listEl = document.getElementById('word-list');

    resultEl.textContent = `${matches.length} possible words`;
    listEl.innerHTML = '';
    matches.forEach(word => {
        const li = document.createElement('li');
        li.textContent = word;
        listEl.appendChild(li);
    });
    saveState();
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
    sessionId = getSessionId();
    createGrid();
    createPopup();
    document.querySelectorAll('#position-row input').forEach(input => {
        input.addEventListener('input', handlePositionInput);
        input.addEventListener('click', () => showPopup(input));
        input.dataset.prev = '';
        input.dataset.addedPresent = '';
    });
    loadState();
    loadWords();
});
