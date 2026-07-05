<template>
  <div class="snake-page">
    <div class="page-header">
      <h2 class="page-title">{{ t('snake.title') }}</h2>
    </div>

    <!-- 分数 -->
    <div class="score-bar">
      <div class="score-item">
        <span class="score-label">{{ t('snake.score') }}</span>
        <span class="score-value">{{ score }}</span>
      </div>
      <div class="score-item">
        <span class="score-label">{{ t('snake.best') }}</span>
        <span class="score-value best">{{ bestScore }}</span>
      </div>
    </div>

    <!-- 游戏画布 -->
    <div class="canvas-wrapper" ref="wrapperRef">
      <canvas
        ref="canvasRef"
        :width="canvasW"
        :height="canvasH"
        class="game-canvas"
        tabindex="0"
        @keydown="onKey"
      ></canvas>

      <!-- 暂停遮罩 -->
      <div v-if="paused && !gameOver" class="overlay">
        <span class="overlay-icon">⏸️</span>
        <p>{{ t('snake.paused') }}</p>
      </div>

      <!-- 结束遮罩 -->
      <div v-if="gameOver" class="overlay gameover">
        <span class="overlay-icon">💀</span>
        <p>{{ t('snake.gameOver') }}</p>
        <p class="final-score">{{ t('snake.finalScore', [score]) }}</p>
        <button class="restart-btn" @click="startGame">{{ t('snake.restart') }}</button>
      </div>
    </div>

    <!-- 操作提示 -->
    <div class="hint-bar">
      <span>⬆⬇⬅➡ {{ t('snake.control') }}</span>
      <span>␣ {{ t('snake.pause') }}</span>
    </div>

    <!-- 移动端方向键 -->
    <div class="mobile-controls">
      <div class="dpad-row">
        <button class="dpad-btn" @click="changeDir('up')">⬆</button>
      </div>
      <div class="dpad-row">
        <button class="dpad-btn" @click="changeDir('left')">⬅</button>
        <button class="dpad-btn dpad-center"></button>
        <button class="dpad-btn" @click="changeDir('right')">➡</button>
      </div>
      <div class="dpad-row">
        <button class="dpad-btn" @click="changeDir('down')">⬇</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const COLS = 18
const ROWS = 18
const CELL = 20
const canvasW = COLS * CELL
const canvasH = ROWS * CELL

const canvasRef = ref<HTMLCanvasElement>()
const wrapperRef = ref<HTMLDivElement>()

const score = ref(0)
const bestScore = ref(0)
const paused = ref(false)
const gameOver = ref(false)

// 贪吃蛇数据
let snake: { x: number; y: number }[] = []
let food: { x: number; y: number } = { x: 0, y: 0 }
let dir: 'up' | 'down' | 'left' | 'right' = 'right'
let nextDir: typeof dir = 'right'
let timer: ReturnType<typeof setInterval> | null = null
let speed = 150

// 加载最佳成绩
function loadBest(): void {
  try {
    bestScore.value = Number(localStorage.getItem('snake_best')) || 0
  } catch {
    bestScore.value = 0
  }
}

function saveBest(s: number): void {
  if (s > bestScore.value) {
    bestScore.value = s
    try { localStorage.setItem('snake_best', String(s)) } catch {}
  }
}

// 随机生成食物
function spawnFood(): void {
  const occupied = new Set(snake.map(p => `${p.x},${p.y}`))
  const free: { x: number; y: number }[] = []
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y })
    }
  }
  if (free.length === 0) {
    // 赢了！
    gameOver.value = true
    saveBest(score.value)
    return
  }
  food = free[Math.floor(Math.random() * free.length)]
}

// 初始化蛇
function initSnake(): void {
  const cx = Math.floor(COLS / 2)
  const cy = Math.floor(ROWS / 2)
  snake = [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ]
}

// 绘制
function draw(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  const isDark = document.documentElement.getAttribute('theme') === 'dark'

  // 背景
  ctx.fillStyle = isDark ? '#1e1e1e' : '#f8f9fa'
  ctx.fillRect(0, 0, canvasW, canvasH)

  // 网格线
  ctx.strokeStyle = isDark ? '#2a2a2a' : '#e9ecef'
  ctx.lineWidth = 0.5
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, canvasH); ctx.stroke()
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(canvasW, y * CELL); ctx.stroke()
  }

  // 食物
  ctx.fillStyle = '#FF6B6B'
  ctx.beginPath()
  ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2)
  ctx.fill()

  // 食物发光
  ctx.shadowColor = '#FF6B6B'
  ctx.shadowBlur = 6
  ctx.beginPath()
  ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // 蛇身
  snake.forEach((seg, i) => {
    const ratio = 1 - i / (snake.length + 8)
    const r = Math.floor(64 + 96 * ratio)
    const g = Math.floor(158 + 60 * ratio)
    const b = Math.floor(255 - 30 * ratio)
    ctx.fillStyle = `rgb(${r},${g},${b})`
    const pad = i === 0 ? 1 : 2
    const radius = i === 0 ? 6 : 4
    roundRect(ctx, seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, radius)
    ctx.fill()
  })

  // 蛇眼睛
  if (snake.length > 0) {
    const head = snake[0]
    const hx = head.x * CELL + CELL / 2
    const hy = head.y * CELL + CELL / 2
    ctx.fillStyle = '#fff'
    const eyeR = 3
    let ex1 = hx, ey1 = hy, ex2 = hx, ey2 = hy
    const off = 4
    if (dir === 'up') {
      ex1 = hx - off; ey1 = hy - 3; ex2 = hx + off; ey2 = hy - 3
    } else if (dir === 'down') {
      ex1 = hx - off; ey1 = hy + 3; ex2 = hx + off; ey2 = hy + 3
    } else if (dir === 'left') {
      ex1 = hx - 3; ey1 = hy - off; ex2 = hx - 3; ey2 = hy + off
    } else {
      ex1 = hx + 3; ey1 = hy - off; ex2 = hx + 3; ey2 = hy + off
    }
    ctx.beginPath(); ctx.arc(ex1, ey1, eyeR, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(ex2, ey2, eyeR, 0, Math.PI * 2); ctx.fill()
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// 游戏循环
function tick(): void {
  dir = nextDir

  const head = snake[0]
  let newHead: { x: number; y: number }
  switch (dir) {
    case 'up':    newHead = { x: head.x, y: head.y - 1 }; break
    case 'down':  newHead = { x: head.x, y: head.y + 1 }; break
    case 'left':  newHead = { x: head.x - 1, y: head.y }; break
    case 'right': newHead = { x: head.x + 1, y: head.y }; break
  }

  // 撞墙
  if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
    endGame()
    return
  }

  // 撞自己
  if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
    endGame()
    return
  }

  snake.unshift(newHead)

  // 吃到食物
  if (newHead.x === food.x && newHead.y === food.y) {
    score.value += 10
    spawnFood()
    // 加速
    if (speed > 60) {
      speed -= 3
      clearInterval(timer!)
      timer = setInterval(tick, speed)
    }
  } else {
    snake.pop()
  }

  draw()
}

function endGame(): void {
  if (timer) { clearInterval(timer); timer = null }
  gameOver.value = true
  saveBest(score.value)
}

function startGame(): void {
  initSnake()
  score.value = 0
  dir = 'right'
  nextDir = 'right'
  speed = 150
  gameOver.value = false
  paused.value = false
  spawnFood()
  draw()
  if (timer) clearInterval(timer)
  timer = setInterval(tick, speed)
  canvasRef.value?.focus()
}

function togglePause(): void {
  if (gameOver.value) return
  paused.value = !paused.value
  if (paused.value) {
    if (timer) { clearInterval(timer); timer = null }
  } else {
    timer = setInterval(tick, speed)
    canvasRef.value?.focus()
  }
}

function changeDir(d: typeof dir): void {
  if (gameOver.value || paused.value) return
  const opposites: Record<string, string> = { up: 'down', down: 'up', left: 'right', right: 'left' }
  if (opposites[d] === dir) return
  nextDir = d
}

function onKey(e: KeyboardEvent): void {
  e.preventDefault()
  if (e.key === ' ' || e.code === 'Space') {
    togglePause()
    return
  }
  const map: Record<string, typeof dir> = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right',
    W: 'up', S: 'down', A: 'left', D: 'right',
  }
  if (map[e.key]) changeDir(map[e.key])
}

onMounted(() => {
  loadBest()
  startGame()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.snake-page {
  padding: 20px 16px;
  max-width: 420px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-header { width: 100%; margin-bottom: 12px; }
.page-title { font-size: 20px; font-weight: 700; color: var(--text); }

.score-bar {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
}
.score-item {
  text-align: center;
  background: var(--bg-card);
  border-radius: 10px;
  padding: 8px 20px;
  box-shadow: var(--shadow);
}
.score-label { font-size: 11px; color: var(--text-muted); display: block; }
.score-value { font-size: 22px; font-weight: 700; color: var(--primary); }
.score-value.best { color: #FFB800; }

.canvas-wrapper {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.game-canvas {
  display: block;
  outline: none;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  border-radius: 12px;
}
.overlay-icon { font-size: 48px; margin-bottom: 8px; }
.overlay p { font-size: 16px; margin: 4px 0; }
.overlay .final-score { font-size: 13px; color: #ddd; }
.overlay.gameover { background: rgba(0,0,0,0.7); }

.restart-btn {
  margin-top: 12px;
  padding: 10px 28px;
  border: none;
  border-radius: 20px;
  background: #409EFF;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.restart-btn:hover { background: #66B1FF; }

.hint-bar {
  display: flex;
  gap: 16px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-muted);
}

/* 移动端方向键 */
.mobile-controls {
  display: none;
  margin-top: 16px;
}
.dpad-row {
  display: flex;
  justify-content: center;
  gap: 8px;
}
.dpad-row + .dpad-row { margin-top: 8px; }
.dpad-btn {
  width: 52px; height: 52px;
  border: none;
  border-radius: 12px;
  background: var(--bg-card);
  box-shadow: var(--shadow);
  font-size: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s;
}
.dpad-btn:active { transform: scale(0.9); }
.dpad-center { visibility: hidden; }

@media (max-width: 480px) {
  .mobile-controls { display: block; }
}
</style>
