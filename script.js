let WORDS = [];
const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const letterStates = {};
const letterCounts = {};
const tileElements = {};
const popupLetterElements = {};
const countInputElements = {};
let sessionId = null;
let activeTile = null;
let pageLoadTime = null;

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
                if (letterStates[ch] !== 'absent' && activeTile) {
                    setTileLetter(activeTile, ch);
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
        if (activeTile) {
            clearPositionTile(activeTile);
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

function showPopup(tile) {
    activeTile = tile;
    const popup = document.getElementById('alphabet-popup');
    const rect = tile.getBoundingClientRect();
    popup.style.display = 'flex';
    const popupWidth = popup.offsetWidth;
    let left = rect.left + window.scrollX - (popupWidth - rect.width) / 2;
    const minLeft = window.scrollX + 5;
    const maxLeft = window.scrollX + document.documentElement.clientWidth - popupWidth - 5;
    if (left < minLeft) left = minLeft;
    if (left > maxLeft) left = maxLeft;
    popup.style.left = left + 'px';
    popup.style.top = rect.bottom + window.scrollY + 5 + 'px';
}

function hidePopup() {
    activeTile = null;
    const popup = document.getElementById('alphabet-popup');
    popup.style.display = 'none';
}

function getSessionId() {
    let id = sessionStorage.getItem('wordleHelperSession');
    if (!id) {
        id = Date.now().toString(36) + Math.random().toString(36).slice(2);
        sessionStorage.setItem('wordleHelperSession', id);
        const initTime = new Date().toISOString();
        sessionStorage.setItem('wordleHelperInitTime', initTime);
        console.log('Session initialized at', initTime);
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
            input.addEventListener('keydown', e => {
                if (/^[0-5]$/.test(e.key)) {
                    e.preventDefault();
                    input.value = e.key;
                    input.dispatchEvent(new Event('input'));
                } else if (e.key === 'Backspace' || e.key === 'Delete') {
                    e.preventDefault();
                    input.value = '0';
                    input.dispatchEvent(new Event('input'));
                }
            });
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
        document.querySelectorAll('#position-row .position-tile').forEach(tile => {
            if (tile.dataset.letter === letter) {
                clearPositionTile(tile);
            }
        });
    }
    filterWords();
}

function setTileLetter(tile, letter) {
    const keepPresent = tile.dataset.keepPresent === 'true';
    const prev = tile.dataset.letter || '';
    if (prev && prev !== letter) {
        const stillUsed = Array.from(document.querySelectorAll('#position-row .position-tile'))
            .some(t => t !== tile && t.dataset.letter === prev && t.dataset.state !== 'unknown');
        if (!stillUsed && tile.dataset.addedPresent === prev && !keepPresent) {
            setState(prev, 'unknown');
        }
        tile.dataset.addedPresent = '';
    }
    tile.dataset.letter = letter;
    tile.dataset.state = 'exact';
    tile.textContent = letter.toUpperCase();
    tile.classList.remove('not-here');
    const usedElsewhere = Array.from(document.querySelectorAll('#position-row .position-tile'))
        .some(t => t !== tile && t.dataset.letter === letter && t.dataset.state !== 'unknown');
    if (letterStates[letter] === 'unknown' && !usedElsewhere && letterCounts[letter] === 0) {
        tile.dataset.addedPresent = letter;
    } else {
        tile.dataset.addedPresent = '';
    }
    setState(letter, 'present');
    filterWords();
}

function clearPositionTile(tile) {
    const prev = tile.dataset.letter || '';
    const keepPresent = tile.dataset.keepPresent === 'true';
    tile.dataset.letter = '';
    tile.dataset.state = 'unknown';
    tile.textContent = '';
    tile.classList.remove('not-here');
    if (prev) {
        const stillUsed = Array.from(document.querySelectorAll('#position-row .position-tile'))
            .some(t => t !== tile && t.dataset.letter === prev && t.dataset.state !== 'unknown');
        if (!stillUsed && tile.dataset.addedPresent === prev && !keepPresent) {
            setState(prev, 'unknown');
        }
        tile.dataset.addedPresent = '';
    }
    filterWords();
}

function handlePositionTileClick(tile) {
    const state = tile.dataset.state || 'unknown';
    if (state === 'unknown') {
        showPopup(tile);
    } else if (state === 'exact') {
        tile.dataset.state = 'notHere';
        tile.classList.add('not-here');
        setState(tile.dataset.letter, 'present');
        filterWords();
    } else if (state === 'notHere') {
        clearPositionTile(tile);
    }
}

function saveState() {
    const positions = [];
    document.querySelectorAll('#position-row .position-tile').forEach(tile => {
        positions.push({
            letter: tile.dataset.letter || '',
            state: tile.dataset.state || 'unknown'
        });
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
            document.querySelectorAll('#position-row .position-tile').forEach((tile, i) => {
                const info = state.positions[i] || { letter: '', state: 'unknown' };
                tile.dataset.letter = info.letter || '';
                tile.dataset.state = info.state || 'unknown';
                tile.textContent = info.letter ? info.letter.toUpperCase() : '';
                if (info.state === 'notHere') {
                    tile.classList.add('not-here');
                } else {
                    tile.classList.remove('not-here');
                }
                tile.dataset.prev = info.letter || '';
                tile.dataset.addedPresent = '';
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
        const tile = document.getElementById('pos' + i);
        positions.push({
            letter: (tile.dataset.letter || '').toLowerCase(),
            state: tile.dataset.state || 'unknown'
        });
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
            const { letter, state } = positions[i];
            if (state === 'exact' && letter) {
                if (word[i] !== letter) return false;
            }
            if (state === 'notHere' && letter) {
                if (word[i] === letter) return false;
                if (!word.includes(letter)) return false;
            }
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

function updateDiagnostics() {
    const infoEl = document.getElementById('diagnostic-info');
    if (!infoEl) return;
    const initTime = sessionStorage.getItem('wordleHelperInitTime');
    infoEl.textContent = `Session init: ${initTime} | Page loaded: ${pageLoadTime} | Current: ${new Date().toISOString()}`;
}

document.addEventListener('DOMContentLoaded', () => {
    sessionId = getSessionId();
    pageLoadTime = new Date().toISOString();
    console.log('Page loaded at', pageLoadTime);
    createGrid();
    createPopup();
    document.querySelectorAll('#position-row .position-tile').forEach(tile => {
        tile.dataset.state = 'unknown';
        tile.dataset.letter = '';
        tile.dataset.prev = '';
        tile.dataset.addedPresent = '';
        tile.addEventListener('click', () => handlePositionTileClick(tile));
    });
    loadState();
    loadWords();
    updateDiagnostics();
    setInterval(updateDiagnostics, 60000);
});
