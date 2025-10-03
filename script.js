const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const mobileControls = document.querySelectorAll(".mobile-controls button");

const CELL_SIZE = 20;
const GRID_COUNT = canvas.width / CELL_SIZE;
const INITIAL_SPEED = 6; // cells per second
const SPEED_INCREMENT = 0.25;
const STORAGE_KEY = "snake-high-score";

let snake;
let direction;
let queuedDirection;
let food;
let score;
let highScore = Number(localStorage.getItem(STORAGE_KEY) || 0);
let running = false;
let lastTime = 0;
let speed = INITIAL_SPEED;
let accumulator = 0;
let gameOver = false;

function resetGame() {
  snake = [
    { x: Math.floor(GRID_COUNT / 2), y: Math.floor(GRID_COUNT / 2) },
    { x: Math.floor(GRID_COUNT / 2) - 1, y: Math.floor(GRID_COUNT / 2) },
  ];
  direction = { x: 1, y: 0 };
  queuedDirection = { ...direction };
  score = 0;
  speed = INITIAL_SPEED;
  accumulator = 0;
  gameOver = false;
  spawnFood();
  updateScore();
  statusEl.textContent = "按空格或点击开始游戏";
}

function spawnFood() {
  let valid = false;
  while (!valid) {
    const x = Math.floor(Math.random() * GRID_COUNT);
    const y = Math.floor(Math.random() * GRID_COUNT);
    valid = !snake.some((segment) => segment.x === x && segment.y === y);
    if (valid) {
      food = { x, y };
    }
  }
}

function updateScore() {
  scoreEl.textContent = score;
  highScore = Math.max(highScore, score);
  highScoreEl.textContent = highScore;
  localStorage.setItem(STORAGE_KEY, highScore);
}

function drawGrid() {
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
  ctx.lineWidth = 1;
  for (let i = 1; i < GRID_COUNT; i++) {
    const offset = i * CELL_SIZE + 0.5;
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset, canvas.height);
    ctx.moveTo(0, offset);
    ctx.lineTo(canvas.width, offset);
    ctx.stroke();
  }
}

function drawFood() {
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  const x = food.x * CELL_SIZE + CELL_SIZE / 2;
  const y = food.y * CELL_SIZE + CELL_SIZE / 2;
  ctx.arc(x, y, CELL_SIZE / 2.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawSnake() {
  ctx.fillStyle = "#34d399";
  snake.forEach((segment, index) => {
    const x = segment.x * CELL_SIZE;
    const y = segment.y * CELL_SIZE;
    const radius = index === 0 ? 8 : 6;

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + CELL_SIZE, y, x + CELL_SIZE, y + CELL_SIZE, radius);
    ctx.arcTo(x + CELL_SIZE, y + CELL_SIZE, x, y + CELL_SIZE, radius);
    ctx.arcTo(x, y + CELL_SIZE, x, y, radius);
    ctx.arcTo(x, y, x + CELL_SIZE, y, radius);
    ctx.closePath();
    ctx.fill();
  });
}

function advanceSnake() {
  direction = queuedDirection;
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= GRID_COUNT ||
    head.y >= GRID_COUNT ||
    snake.some((segment) => segment.x === head.x && segment.y === head.y)
  ) {
    running = false;
    gameOver = true;
    statusEl.textContent = "游戏结束！按重新开始再玩一次";
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    speed += SPEED_INCREMENT;
    spawnFood();
    updateScore();
  } else {
    snake.pop();
  }
}

function render() {
  drawGrid();
  drawFood();
  drawSnake();
}

function loop(timestamp) {
  if (!running) {
    render();
    lastTime = timestamp;
    requestAnimationFrame(loop);
    return;
  }

  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  accumulator += delta;

  const step = 1 / speed;
  while (accumulator >= step) {
    advanceSnake();
    accumulator -= step;
    if (gameOver) break;
  }

  render();
  if (!gameOver) {
    requestAnimationFrame(loop);
  }
}

function startGame() {
  if (gameOver) {
    resetGame();
  }
  running = !running;
  statusEl.textContent = running ? "游戏进行中..." : "游戏已暂停";
  if (running) {
    requestAnimationFrame(loop);
  }
}

function restartGame() {
  resetGame();
  running = true;
  statusEl.textContent = "游戏进行中...";
  requestAnimationFrame(loop);
}

function setDirection(newDir) {
  if (running && direction.x === -newDir.x && direction.y === -newDir.y) {
    return;
  }
  queuedDirection = newDir;
}

function handleKeyDown(event) {
  if (event.key === " " || event.code === "Space") {
    event.preventDefault();
    startGame();
    return;
  }

  if (!running && !gameOver) {
    startGame();
  }

  switch (event.key.toLowerCase()) {
    case "arrowup":
    case "w":
      setDirection({ x: 0, y: -1 });
      break;
    case "arrowdown":
    case "s":
      setDirection({ x: 0, y: 1 });
      break;
    case "arrowleft":
    case "a":
      setDirection({ x: -1, y: 0 });
      break;
    case "arrowright":
    case "d":
      setDirection({ x: 1, y: 0 });
      break;
  }
}

function handleControlClick(event) {
  const dir = event.currentTarget.dataset.dir;
  if (!dir) return;

  switch (dir) {
    case "up":
      setDirection({ x: 0, y: -1 });
      break;
    case "down":
      setDirection({ x: 0, y: 1 });
      break;
    case "left":
      setDirection({ x: -1, y: 0 });
      break;
    case "right":
      setDirection({ x: 1, y: 0 });
      break;
  }

  if (!running) {
    startGame();
  }
}

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", restartGame);
window.addEventListener("keydown", handleKeyDown);
mobileControls.forEach((btn) => btn.addEventListener("click", handleControlClick));

canvas.addEventListener("touchstart", (event) => {
  if (!running) {
    startGame();
  }
  if (event.touches.length > 0) {
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const head = snake[0];
    const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
    const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
    const dx = x - headX;
    const dy = y - headY;

    if (Math.abs(dx) > Math.abs(dy)) {
      setDirection({ x: dx > 0 ? 1 : -1, y: 0 });
    } else {
      setDirection({ x: 0, y: dy > 0 ? 1 : -1 });
    }
  }
});

highScoreEl.textContent = highScore;
resetGame();
requestAnimationFrame(loop);
