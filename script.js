const cat = document.getElementById('cat');
const obstacle = document.getElementById('obstacle');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level-display');
const crownStatusDisplay = document.getElementById('crown-status');
const gameContainer = document.getElementById('game-container');
const startScreen = document.getElementById('start-screen');
const clearScreen = document.getElementById('clear-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const gameControls = document.getElementById('game-controls');

// Buttons
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');
const jumpBtn = document.getElementById('jump-btn');
const nextLevelBtn = document.getElementById('next-level-btn');
const retryLevelBtn = document.getElementById('retry-level-btn');
const backToTopClearBtn = document.getElementById('back-to-top-clear-btn');
const restartBtnGameover = document.getElementById('restart-btn-gameover');
const backToTopBtn = document.getElementById('back-to-top-btn');

// Cat Selection
const catSelection = document.getElementById('cat-selection');
const catOptions = document.querySelectorAll('.cat-option');
let selectedCatType = 'calico'; // Default selected cat

// Game state & variables
let gameState = 'waiting';
let catY, catVelocity, obstacleX, score, obstacleSpeed;
let obstacleHeight, obstacleY, obstacleType;
let currentLevel = 1;
let clearedLevels = [];
let crownData = { bronze: [], silver: [], gold: [] };

const gravity = -0.5;
const jumpStrength = 12;
const initialObstacleSpeed = 4;
const CLEAR_SCORE = 20;
let gameLoopInterval;

// Level difficulty settings
const levelSettings = {
    1: { speed: 4, speedIncrease: 0.1, obstacleMinHeight: 150, obstacleMaxHeight: 150 },
    2: { speed: 5, speedIncrease: 0.15, obstacleMinHeight: 140, obstacleMaxHeight: 180 },
    3: { speed: 6, speedIncrease: 0.2, obstacleMinHeight: 130, obstacleMaxHeight: 200 },
    4: { speed: 7, speedIncrease: 0.25, obstacleMinHeight: 120, obstacleMaxHeight: 220 },
    5: { speed: 8, speedIncrease: 0.3, obstacleMinHeight: 100, obstacleMaxHeight: 250 }
};

// --- Event Listeners ---
document.addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); handleJump(); } });
gameContainer.addEventListener('touchstart', (e) => { e.preventDefault(); handleJump(); });
startBtn.addEventListener('click', startGame);
startBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // デフォルトのタッチ動作を防ぐ
    console.log('Start button touched'); // デバッグ用
    startGame();
});
pauseBtn.addEventListener('click', togglePause);
pauseBtn.addEventListener('touchstart', (e) => { e.preventDefault(); togglePause(); });

restartBtn.addEventListener('click', () => {
    init();
    startGame();
});
restartBtn.addEventListener('touchstart', (e) => { 
    e.preventDefault(); 
    init();
    startGame();
});

nextLevelBtn.addEventListener('click', () => {
    if (currentLevel < 5) {
        currentLevel++;
        init();
        startGame();
    }
});
nextLevelBtn.addEventListener('touchstart', (e) => { 
    e.preventDefault(); 
    if (currentLevel < 5) {
        currentLevel++;
        init();
        startGame();
    }
});

retryLevelBtn.addEventListener('click', () => {
    init();
    startGame();
});
retryLevelBtn.addEventListener('touchstart', (e) => { 
    e.preventDefault(); 
    init();
    startGame();
});

backToTopClearBtn.addEventListener('click', () => {
    resetGame(true);
});
backToTopClearBtn.addEventListener('touchstart', (e) => { 
    e.preventDefault(); 
    resetGame(true);
});

jumpBtn.addEventListener('click', (e) => { e.stopPropagation(); handleJump(); });
jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); handleJump(); });

restartBtnGameover.addEventListener('click', () => {
    init();
    startGame();
});
restartBtnGameover.addEventListener('touchstart', (e) => { 
    e.preventDefault(); 
    init();
    startGame();
});

backToTopBtn.addEventListener('click', () => {
    currentLevel = 1;
    resetGame(true);
});
backToTopBtn.addEventListener('touchstart', (e) => { 
    e.preventDefault(); 
    currentLevel = 1;
    resetGame(true); 
});

// Cat selection event listener
catOptions.forEach(option => {
    // クリックイベント
    option.addEventListener('click', () => {
        console.log('Cat option clicked:', option.dataset.catType); // デバッグ用
        catOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedCatType = option.dataset.catType;
        applyCatType();
        updateCatSelectionCrowns();
    });
    
    // タッチイベント（スマホ対応）
    option.addEventListener('touchstart', (e) => {
        e.preventDefault(); // デフォルトのタッチ動作を防ぐ
        console.log('Cat option touched:', option.dataset.catType); // デバッグ用
        catOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedCatType = option.dataset.catType;
        applyCatType();
        updateCatSelectionCrowns();
    });
});

// --- Game Flow ---
function init() {
    gameState = 'waiting';
    catY = 250;
    catVelocity = 0;
    obstacleX = 400;
    score = 0;
    const settings = levelSettings[currentLevel];
    obstacleSpeed = settings.speed;

    cat.style.bottom = catY + 'px';
    obstacle.style.left = obstacleX + 'px';
    scoreDisplay.textContent = `Score: 0 / ${CLEAR_SCORE}`;
    levelDisplay.textContent = `レベル: ${currentLevel}`;
    
    // Update start screen with current level info
    const startScreen = document.getElementById('start-screen');
    const levelInfo = clearedLevels.length > 0 ? 
        `🏆 クリア済みレベル: ${clearedLevels.join(', ')}` : '';
    const existingLevelInfo = startScreen.querySelector('.cleared-levels');
    if (existingLevelInfo) {
        existingLevelInfo.textContent = levelInfo;
    } else if (levelInfo) {
        const levelInfoElement = document.createElement('p');
        levelInfoElement.className = 'cleared-levels';
        levelInfoElement.textContent = levelInfo;
        startScreen.querySelector('.game-info').appendChild(levelInfoElement);
    }

    startScreen.style.display = 'flex';
    clearScreen.style.display = 'none';
    gameoverScreen.style.display = 'none';
    gameControls.style.display = 'none';

    applyCatType(); // Apply selected cat type on init
    updateCrownDisplay();
    updateCatSelectionCrowns();
    setNewObstacle();
}

function startGame() {
    if (gameState !== 'waiting' && gameState !== 'gameover') return;
    resetGame(false);
    gameState = 'playing';
    startScreen.style.display = 'none';
    gameoverScreen.style.display = 'none';
    gameControls.style.display = 'flex';
    updateCrownDisplay();
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(gameLoop, 20);
}

function resetGame(showStartScreen) {
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    init();
    if (!showStartScreen) {
        startScreen.style.display = 'none';
    }
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        pauseBtn.textContent = '再開';
        clearInterval(gameLoopInterval);
    } else if (gameState === 'paused') {
        gameState = 'playing';
        pauseBtn.textContent = '一時停止';
        gameLoopInterval = setInterval(gameLoop, 20);
    }
}

function handleJump() {
    if (gameState === 'playing') {
        catVelocity = jumpStrength;
    }
}

function gameClear() {
    gameState = 'gameover';
    clearInterval(gameLoopInterval);
    
    // Add current level to cleared levels if not already there
    if (!clearedLevels.includes(currentLevel)) {
        clearedLevels.push(currentLevel);
        
        // Award crown based on level
        if (currentLevel === 1 && !crownData.bronze.includes(1)) {
            crownData.bronze.push(1);
        } else if (currentLevel === 2 && !crownData.silver.includes(2)) {
            crownData.silver.push(2);
        } else if (currentLevel >= 3 && !crownData.gold.includes(currentLevel)) {
            crownData.gold.push(currentLevel);
        }
        
        saveCrownData();
    }
    
    // Update clear screen message based on current level
    const clearTitle = clearScreen.querySelector('h1');
    const clearMessage = clearScreen.querySelector('p');
    const nextLevelBtn = document.getElementById('next-level-btn');
    
    if (currentLevel < 5) {
        clearTitle.innerHTML = `✨レベル${currentLevel}クリア！✨`;
        clearMessage.textContent = `レベル${currentLevel + 1}に挑戦しよう！`;
        nextLevelBtn.style.display = 'inline-block';
        nextLevelBtn.textContent = `レベル${currentLevel + 1}へ進む`;
    } else {
        clearTitle.innerHTML = '🎉全レベルクリア！🎉';
        clearMessage.textContent = 'すごい！全てのレベルをクリアしました！';
        nextLevelBtn.style.display = 'none';
    }
    
    clearScreen.style.display = 'flex';
    gameControls.style.display = 'none';
}

function gameOver() {
    gameState = 'gameover';
    clearInterval(gameLoopInterval);
    updateGameoverCat();
    gameoverScreen.style.display = 'flex';
    gameControls.style.display = 'none';
}

// --- Cat Type Application ---
function applyCatType() {
    console.log('Applying cat type:', selectedCatType); // デバッグ用
    cat.className = ''; // Remove existing classes
    cat.classList.add('cat-type-' + selectedCatType);
}

// --- Crown Display ---
function updateCrownDisplay() {
    // Remove existing crown if any
    const existingCrown = cat.querySelector('.crown');
    if (existingCrown) {
        existingCrown.remove();
    }
    
    // Add crown if current level has been cleared
    if (clearedLevels.includes(currentLevel)) {
        const crown = document.createElement('div');
        crown.className = 'crown';
        
        // Set crown type based on level
        if (currentLevel === 1) {
            crown.textContent = '🥉'; // Bronze
        } else if (currentLevel === 2) {
            crown.textContent = '🥈'; // Silver
        } else {
            crown.textContent = '🥇'; // Gold
        }
        
        cat.appendChild(crown);
    }
    
    // Update crown status display
    const totalCrowns = crownData.bronze.length + crownData.silver.length + crownData.gold.length;
    crownStatusDisplay.textContent = `👑 × ${totalCrowns}`;
}

// --- Crown Data Management ---
function saveCrownData() {
    localStorage.setItem('nekojump_crowns', JSON.stringify(crownData));
}

function loadCrownData() {
    const saved = localStorage.getItem('nekojump_crowns');
    if (saved) {
        crownData = JSON.parse(saved);
        // Update clearedLevels based on crown data
        clearedLevels = [...crownData.bronze, ...crownData.silver, ...crownData.gold];
    }
}

function getCrownForLevel(level) {
    if (crownData.bronze.includes(level)) return '🥉';
    if (crownData.silver.includes(level)) return '🥈';
    if (crownData.gold.includes(level)) return '🥇';
    return null;
}

function addCrownToCat(catElement, level) {
    const crown = getCrownForLevel(level);
    if (crown) {
        const crownElement = document.createElement('div');
        crownElement.className = 'crown';
        crownElement.textContent = crown;
        catElement.appendChild(crownElement);
    }
}

function updateCatSelectionCrowns() {
    catOptions.forEach(option => {
        const catPreview = option.querySelector('.cat-preview');
        // Remove existing crowns
        const existingCrown = catPreview.querySelector('.crown');
        if (existingCrown) {
            existingCrown.remove();
        }
        
        // Find the highest crown for this cat type
        let highestCrown = null;
        if (crownData.gold.length > 0) {
            highestCrown = '🥇';
        } else if (crownData.silver.length > 0) {
            highestCrown = '🥈';
        } else if (crownData.bronze.length > 0) {
            highestCrown = '🥉';
        }
        
        if (highestCrown) {
            const crownElement = document.createElement('div');
            crownElement.className = 'crown';
            crownElement.textContent = highestCrown;
            catPreview.appendChild(crownElement);
        }
    });
}

function updateGameoverCat() {
    const gameoverCat = document.getElementById('gameover-cat');
    if (!gameoverCat) return;
    
    // Clear existing content
    gameoverCat.innerHTML = '';
    
    // Apply current cat type
    gameoverCat.className = 'gameover-cat cat-type-' + selectedCatType;
    
    // Add tail
    const tail = document.createElement('span');
    tail.className = 'tail';
    gameoverCat.appendChild(tail);
    
    // Add highest crown if any
    let highestCrown = null;
    if (crownData.gold.length > 0) {
        highestCrown = '🥇';
    } else if (crownData.silver.length > 0) {
        highestCrown = '🥈';
    } else if (crownData.bronze.length > 0) {
        highestCrown = '🥉';
    }
    
    if (highestCrown) {
        const crownElement = document.createElement('div');
        crownElement.className = 'crown';
        crownElement.textContent = highestCrown;
        gameoverCat.appendChild(crownElement);
    }
}

// --- Main Game Loop ---
function gameLoop() {
    catVelocity += gravity;
    catY += catVelocity;
    const gameHeight = gameContainer.offsetHeight;

    if (catY < 0) {
        catY = 0;
        catVelocity = 0;
    } else if (catY > gameHeight - cat.offsetHeight) {
        catY = gameHeight - cat.offsetHeight;
        catVelocity = 0;
    }

    obstacleX -= obstacleSpeed;
    if (obstacleX < -60) {
        obstacleX = 400;
        score++;
        scoreDisplay.textContent = `Score: ${score} / ${CLEAR_SCORE}`;
        const settings = levelSettings[currentLevel];
        obstacleSpeed += settings.speedIncrease;
        setNewObstacle();
        if (score >= CLEAR_SCORE) {
            gameClear();
            return;
        }
    }

    if (checkObstacleCollision()) {
        gameOver();
        return;
    }

    cat.style.bottom = catY + 'px';
    obstacle.style.left = obstacleX + 'px';
}

function setNewObstacle() {
    obstacleType = Math.floor(Math.random() * 3);
    const settings = levelSettings[currentLevel];
    obstacleHeight = Math.random() * (settings.obstacleMaxHeight - settings.obstacleMinHeight) + settings.obstacleMinHeight;
    obstacle.style.height = obstacleHeight + 'px';

    obstacle.style.top = 'auto';
    obstacle.style.bottom = 'auto';

    switch (obstacleType) {
        case 0:
            obstacle.style.bottom = '0px';
            obstacleY = 0;
            break;
        case 1:
            obstacle.style.top = '0px';
            obstacleY = gameContainer.offsetHeight - obstacleHeight;
            break;
        case 2:
            const middleY = Math.random() * (gameContainer.offsetHeight - obstacleHeight - 100) + 50;
            obstacle.style.top = middleY + 'px';
            obstacleY = middleY;
            break;
    }
}

function checkObstacleCollision() {
    const catRect = cat.getBoundingClientRect();
    const obstacleRect = obstacle.getBoundingClientRect();

    return (
        catRect.right > obstacleRect.left &&
        catRect.left < obstacleRect.right &&
        catRect.bottom > obstacleRect.top &&
        catRect.top < obstacleRect.bottom
    );
}

loadCrownData();
init();