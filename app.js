/** Wait for Content to load */
document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM Content Loaded");
    
    /** Constants that contain elements on the screen */
    // Get all 30 tiles
    const TILES = Array.from(document.querySelectorAll(".tile"));
    console.log("TILES found:", TILES.length);
    
    // Get all 6 rows
    const ROWS = document.querySelectorAll(".row");
    console.log("ROWS found:", ROWS.length);
    
    // First get the keyboard
    const KEYBOARD = document.querySelector("#keyboard");
    console.log("KEYBOARD found:", KEYBOARD);
    
    // Then get each key on the keyboard
    const KEYBOARD_KEYS = KEYBOARD.querySelectorAll("button");
    console.log("KEYBOARD_KEYS found:", KEYBOARD_KEYS.length);

    /** Start the whole game (Student) */
    async function startWebGame() {
        console.log("Starting web game...");
        await GameState.loadOrStart();
        console.log("GameState loaded:", GameState);
        
        // Clear all tiles to ensure clean start
        TILES.forEach(tile => {
            tile.textContent = "";
            tile.dataset.status = "empty";
            tile.removeAttribute("data-animation");
        });
        
        paintGameState();
        startInteraction();
        console.log("Game started and interactions bound");
    }

    /** Bind events */
    function startInteraction() {
        console.log("Starting interactions...");
        const keyboardElement = document.getElementById("keyboard");
        keyboardElement.addEventListener("click", handleClickEvent);
        document.addEventListener("keydown", handlePressEvent);
        
        // Add reset button functionality
        const resetButton = document.getElementById("reset-button");
        console.log("Reset button found:", resetButton);
        if (resetButton) {
            resetButton.addEventListener("click", handleResetGame);
            console.log("Reset button event listener added");
        } else {
            console.error("Reset button not found!");
        }
        
        console.log("Event listeners added");
    }

    /** Unbind events during animation */
    function stopInteraction() {
        const keyboardElement = document.getElementById("keyboard");
        keyboardElement.removeEventListener("click", handleClickEvent);
        document.removeEventListener("keydown", handlePressEvent);
        
        // Remove reset button listener
        const resetButton = document.getElementById("reset-button");
        if (resetButton) {
            resetButton.removeEventListener("click", handleResetGame);
        }
    }

    /** Handle reset game button */
    async function handleResetGame() {
        console.log("=== RESET GAME STARTED ===");
        
        // Clear localStorage
        window.localStorage.removeItem("HSAKA_WORDLE");
        console.log("localStorage cleared");
        
        // Reset game state
        GameState.attemptCount = 0;
        GameState.userAttempts = [];
        GameState.highlightedRows = [];
        GameState.status = "in-progress";
        console.log("GameState reset:", GameState);
        
        // Get a NEW random answer using the global function
        if (window.getRandomAnswer) {
            GameState.answer = window.getRandomAnswer();
            console.log("New random word:", GameState.answer);
        } else {
            console.error("getRandomAnswer function not available!");
        }
        
        // Clear the board
        TILES.forEach(tile => {
            tile.textContent = "";
            tile.dataset.status = "empty";
            tile.removeAttribute("data-animation");
        });
        console.log("Board cleared");
        
        // Reset keyboard colors to unknown
        KEYBOARD_KEYS.forEach(keyEl => {
            keyEl.dataset.status = "unknown";
        });
        console.log("Keyboard colors reset");
        
        // Reset keyboard state in GameState using the global function
        if (window.getKeyboard) {
            GameState.keyboard = window.getKeyboard();
            console.log("Keyboard state reset in GameState");
        } else {
            console.error("getKeyboard function not available!");
        }
        
        console.log("=== RESET GAME COMPLETE ===");
    }

    /** Button click events on the keyboard elements */
    function handleClickEvent(event) {
        console.log("Click event:", event.target);
        const button = event.target;
        if (!(button instanceof HTMLButtonElement)) {
            console.log("Not a button element");
            return;
        }
        let key = button.dataset.key;
        if (!key) {
            console.log("No key data");
            return;
        }
        console.log("Clicking key:", key);
        pressKey(key);
    }

    /** Keyboard press events on the document */
    function handlePressEvent(event) {
        console.log("Key press event:", event.key);
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
            console.log("Modifier key pressed, ignoring");
            return;
        }
        const key = event.key;
        console.log("Processing key:", key);
        pressKey(key);
    }

    /** Handle keypress (Student) */
    function pressKey(key) {
        console.log("pressKey called with:", key);
        const status = GameState.getStatus();
        console.log("Game status:", status);

        if (status !== "in-progress") {
            console.log("Game not in progress, ignoring key");
            return;
        }

        const currentGuess = GameState.getCurrentGuess();
        console.log("Current guess:", currentGuess);

        let next = Array.from(TILES).findIndex(
            tileEle => tileEle.innerText === ""
        );
        console.log("Next empty tile index:", next);

        if (next === -1) {
            next = MAX_ATTEMPTS * WORD_LENGTH;
        }

        const regex = new RegExp("^[a-zA-Z]$");

        if (regex.test(key)) {
            console.log("Handling alphabet key:", key);
            handleAlphabetKey(currentGuess, key, next);
        } else if (key === "Backspace" || key === "Delete") {
            console.log("Handling delete key");
            handleDeleteKey(currentGuess, next);
        } else if (key === "Enter") {
            console.log("Handling enter key");
            handleSubmitKey(currentGuess);
        }
    }

    /** Handle a valid keypress (Student) */
    function handleAlphabetKey(currentGuess, key, next) {
        const currentLength = currentGuess.length;
        if (currentLength === WORD_LENGTH) {
            return;
        }
        const nextTile = TILES[next];
        nextTile.textContent = key;
        nextTile.dataset.status = "tbd"; // Keep as "tbd" (to be determined) until submitted
        nextTile.dataset.animation = "pop";
        nextTile.removeAttribute("data-animation"); // Remove any previous animation
        
        console.log(`Typing '${key}' at position ${next}, status set to:`, nextTile.dataset.status);
        
        // Appends to the last word in user attempts
        // eg. "b" -> "ba" -> "bat"
        GameState.setUserAttempt(currentGuess + key);
    }

    /** Handle delete (Student) */
    function handleDeleteKey(currentGuess, next) {
        if (currentGuess === "") {
            return;
        }
        const currentLength = currentGuess.length;
        const lastTile = TILES[next - 1];
        lastTile.textContent = "";
        lastTile.dataset.status = "empty";
        lastTile.removeAttribute("data-animation");
        // Remove the last character
        // eg. "bat" -> "ba" -> "b" -> ""
        currentGuess = currentGuess.slice(0, currentLength - 1);
        GameState.setUserAttempt(currentGuess);
    }

    /** Handle Submit (Student) */
    async function handleSubmitKey(currentGuess) {
        console.log("handleSubmitKey called with:", currentGuess);
        if (currentGuess.length < WORD_LENGTH) {
            console.log("Word too short, ignoring");
            return;
        }

        const answer = GameState.getAnswer();
        const oldKeyboard = GameState.getKeyboard();
        const attemptCount = GameState.getAttemptCount();
        
        console.log("Checking word validity...");
        console.log("isInputCorrect function available:", typeof isInputCorrect);

        /********* Move code from wordle.js to here ********/
        // 1. Check if word is in word list
        if (isInputCorrect(currentGuess)) {
            console.log("Word is valid, processing...");
            // 2. absent (grey), present (yellow), correct (green)
            const highlightedCharacters = getCharactersHighlight(
                currentGuess,
                answer
            );
            GameState.setHighlightedRows(highlightedCharacters);
            // 3. highlight keyboard
            const newKeyboard = updateKeyboardHighlights(
                oldKeyboard,
                currentGuess,
                highlightedCharacters
            );
            GameState.setKeyboard(newKeyboard);
            // 4. update status
            const newStatus = updateGameStatus(
                currentGuess,
                answer,
                attemptCount,
                MAX_ATTEMPTS - 1 // MAX_ATTEMPT is 1-based
            );
            GameState.setStatus(newStatus);
            // 5. Update attempt count
            GameState.incrementAttempt();
            // 6. Save game
            GameState.save();
            /*********************************************/
            // 7. Paint Attempt (can see the changes on website)
            // a. On the attempt row: Flip tile + Color tile
            // b. Color the keyboard
            await paintAttempt(
                attemptCount,
                highlightedCharacters,
                newKeyboard
            );
            // 8. Paint the result of success or failure
            await paintResult(newStatus, answer, attemptCount);

            console.log("GAME_STATE", GameState);
        } else {
            console.log("Word is invalid");
            // Handle wrong words
            shakeRow(currentGuess, attemptCount);
        }
    }

    /** Painting One Attempt (Student) */
    async function paintAttempt(attempt, highlightedCharacters) {
        stopInteraction();
        await paintRow(attempt, highlightedCharacters);
        paintKeyboard();
        startInteraction();
    }

    /** Shaking a row on the board (Student) */
    function shakeRow(currentGuess, index) {
        stopInteraction();

        alert(`${currentGuess.toUpperCase()} not in world list`);

        ROWS[index].dataset.status = "invalid";
        ROWS[index].onanimationend = () => {
            ROWS[index].removeAttribute("data-status");
            startInteraction();
        };
    }

    /** Painting a row on the board (Student) */
    async function paintRow(index, evaluation) {
        const row = ROWS[index];
        const tileRow = row.querySelectorAll(".tile");

        return new Promise(resolve => {
            tileRow.forEach((tile, index) => {
                tile.dataset.animation = "flip";
                tile.style.animationDelay = `${index * FLIP_SPEED}ms`;
                tile.onanimationstart = () => {
                    setTimeout(
                        () => (tile.dataset.status = evaluation[index]),
                        FLIP_SPEED / 2
                    );
                };
                if (index === WORD_LENGTH - 1) {
                    tile.onanimationend = resolve;
                }
            });
        });
    }
    /** Handle game status animation (Student) */
    async function paintResult(newStatus, answer, index) {
        if (newStatus === "in-progress") {
            // Game is still in-progress, so nothing to paint or unbind
            return;
        }

        // If success or failed, stop interaction
        stopInteraction();

        if (newStatus === "success") {
            handleSuccessAnimation(index);
        } else {
            alert(`The word was ${answer.toUpperCase()}`);
        }
    }

    /** When game ends and status is success (Student) */
    function handleSuccessAnimation(index) {
        const row = ROWS[index];
        const tileRow = row.querySelectorAll(".tile");

        for (let i = 0; i < WORD_LENGTH; i++) {
            tileRow[i].dataset.animation = "win";
            tileRow[i].style.animationDelay = `${i * 100}ms`;

            if (i === WORD_LENGTH - 1) {
                tileRow[i].onanimationend = () => {
                    console.log("first");
                    // Use attemptCount (1-based) instead of row index (0-based)
                    const attemptCount = GameState.getAttemptCount();
                    const message = CONGRATULATIONS[attemptCount - 1] || "Congratulations";
                    alert(`${message}!`);
                };
            }
        }
    }

    /** Highligh keyboard keys (Student) */
    function paintKeyboard() {
        const newKeyboard = GameState.getKeyboard();

        KEYBOARD_KEYS.forEach(keyEl => {
            const key = keyEl.dataset.key;
            const newStatus = newKeyboard[key];
            keyEl.dataset.status = newStatus;
        });
    }

    /** Painting a whole Game State (Student) */
    async function paintGameState() {
        const attemptCount = GameState.getAttemptCount();

        // Start of a new game so game state is empty - don't paint anything
        if (attemptCount === 0) {
            console.log("New game - no previous state to paint");
            return;
        }

        console.log("Painting previous game state...");
        const evaluation = GameState.getHighlightedRows();
        const userAttempts = GameState.getUserAttempt();

        const previousChars = userAttempts.flatMap(word => [...word.split("")]);

        // Don't paint keyboard on initial load - only paint it after submitting words
        // paintKeyboard();

        previousChars.forEach((char, i) => {
            TILES[i].textContent = char;
            TILES[i].dataset.status = "reveal";
        });

        for (let col = 0; col < WORD_LENGTH; col++) {
            for (let row = 0; row < attemptCount; row++) {
                const idx = row * WORD_LENGTH + col;
                TILES[idx].dataset.animation = "flip";
                TILES[idx].style.animationDelay = `${col * FLIP_SPEED}ms`;
                TILES[idx].onanimationstart = () => {
                    setTimeout(() => {
                        TILES[idx].dataset.status = evaluation[row][col];
                    }, FLIP_SPEED / 2);
                };
            }
        }
    }

    await startWebGame();
});
