# Wordle Helper

A simple single-page application to help filter Wordle words.
The word list in `words.txt` now excludes proper nouns so you won't see names
like "Boris" popping up in your results.

## Usage

Open `index.html` in a browser. Use the alphabet grid to mark letters as present or absent by clicking each tile. Enter any known letters in each position. If you need to remove a letter, click the input and choose **Clear** from the popup, or simply erase the letter. Either method now keeps the letter marked present if you had already set it that way. The page displays how many words from the list loaded from `words.txt` match your criteria.

When changing how many times a letter appears, just type the digit you want. The existing value is replaced immediately, saving you from fiddling with the cursor.

Your selections persist in local storage for the lifetime of each tab's session. Every tab gets its own save slot, so you can keep multiple helpers open at once and return to them even after your device naps.

A small diagnostics line at the bottom of the page shows when the session began and when the page last loaded.
