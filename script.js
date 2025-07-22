const cat = document.getElementById('cat');
const obstacle = document.getElementById('obstacle');
const scoreDisplay = document.getElementById('score');
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
const restartBtnClear = document.getElementById('restart-btn-clear');
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

const gravity = -0.5;
const jumpStrength = 12;
const initialObstacleSpeed = 4;
const CLEAR_SCORE = 20;
let gameLoopInterval;

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

restartBtn.addEventListener('click', () => resetGame(true));
restartBtn.addEventListener('touchstart', (e) => { e.preventDefault(); resetGame(true); });

restartBtnClear.addEventListener('click', () => resetGame(true));
restartBtnClear.addEventListener('touchstart', (e) => { e.preventDefault(); resetGame(true); });

jumpBtn.addEventListener('click', (e) => { e.stopPropagation(); handleJump(); });
jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); handleJump(); });

restartBtnGameover.addEventListener('click', () => startGame());
restartBtnGameover.addEventListener('touchstart', (e) => { e.preventDefault(); startGame(); });

backToTopBtn.addEventListener('click', () => resetGame(true));
backToTopBtn.addEventListener('touchstart', (e) => { e.preventDefault(); resetGame(true); });

// Cat selection event listener
catOptions.forEach(option => {
    // クリックイベント
    option.addEventListener('click', () => {
        console.log('Cat option clicked:', option.dataset.catType); // デバッグ用
        catOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedCatType = option.dataset.catType;
        applyCatType();
    });
    
    // タッチイベント（スマホ対応）
    option.addEventListener('touchstart', (e) => {
        e.preventDefault(); // デフォルトのタッチ動作を防ぐ
        console.log('Cat option touched:', option.dataset.catType); // デバッグ用
        catOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedCatType = option.dataset.catType;
        applyCatType();
    });
});

// --- Game Flow ---
function init() {
    gameState = 'waiting';
    catY = 250;
    catVelocity = 0;
    obstacleX = 400;
    score = 0;
    obstacleSpeed = initialObstacleSpeed;

    cat.style.bottom = catY + 'px';
    obstacle.style.left = obstacleX + 'px';
    scoreDisplay.textContent = `Score: 0 / ${CLEAR_SCORE}`;

    startScreen.style.display = 'flex';
    clearScreen.style.display = 'none';
    gameoverScreen.style.display = 'none';
    gameControls.style.display = 'none';

    applyCatType(); // Apply selected cat type on init
    setNewObstacle();
}

function startGame() {
    if (gameState !== 'waiting' && gameState !== 'gameover') return;
    resetGame(false);
    gameState = 'playing';
    startScreen.style.display = 'none';
    gameoverScreen.style.display = 'none';
    gameControls.style.display = 'flex';
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
    clearScreen.style.display = 'flex';
    gameControls.style.display = 'none';
}

function gameOver() {
    gameState = 'gameover';
    clearInterval(gameLoopInterval);
    gameoverScreen.style.display = 'flex';
    gameControls.style.display = 'none';
}

// --- Cat Type Application ---
function applyCatType() {
    console.log('Applying cat type:', selectedCatType); // デバッグ用
    cat.className = ''; // Remove existing classes
    cat.classList.add('cat-type-' + selectedCatType);
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
        obstacleSpeed += 0.1;
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
    obstacleHeight = Math.random() * 150 + 150;
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

init();