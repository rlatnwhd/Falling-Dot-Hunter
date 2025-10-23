const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreSpan = document.getElementById("score");
const livesSpan = document.getElementById("lives");
const levelSpan = document.getElementById("level");

let score = 0, lives = 3;
let elapsed = 0, lastTime = 0;
let running = true;
let level = 1;                 // 추가: 수동 레벨
const getLevel = () => level;  // 변경: 경과시간 기반 → 수동 레벨 반환

// 시스템 초기화
Game.initBackground(canvas, ctx, getLevel);
Game.initEffects(canvas, ctx);
Game.initCircles(canvas, ctx, getLevel, () => { lives--; if (lives <= 0) gameOver(); });
Game.initBoss(
  canvas, ctx, getLevel,
  (reward) => {                // 보스 처치
    score += reward || 0;      // 보스 시작 체력만큼 점수 추가
    level += 1;
    state = "levelup";
    overlayTimer = 1.5;
    overlayText = `LEVEL ${level}`;
  },
  () => {                      // 시간초과
    lives--; if (lives <= 0) { gameOver(); return; }
    state = "round";
    Game.startRound(30);
  },
  Game.spawnEffect
);

// 상태 머신
let state = "intro";           // intro → round → warning → boss → levelup → round ...
let overlayTimer = 1.4;        // 오버레이 텍스트 표시 시간
let overlayText = "GAME START";
let warningTimer = 0;

// 중앙 큰 텍스트 + 간단한 애니메이션
function drawCenterText(text, t) {
  // t: 0~1 (등장/퇴장 페이드)
  const alpha = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1;
  const scale = 1 + 0.08 * Math.sin(t * Math.PI); // 은은한 펄스
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(scale, scale);
  ctx.fillStyle = `rgba(255,255,255,${Math.max(0, Math.min(1, alpha))})`;
  ctx.font = "bold 36px Pretendard, Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

// 경고(빨간 플래시)
function drawWarningOverlay(timeLeft, total = 2.5) {
  const t = 1 - timeLeft / total; // 0->1
  const flash = 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(t * 20)); // 빠른 점멸
  ctx.save();
  ctx.fillStyle = `rgba(255,0,0,${flash})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // 텍스트
  ctx.save();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("WARNING", canvas.width/2, canvas.height/2 - 22);
  ctx.font = "bold 22px Arial";
  ctx.fillText("보스전", canvas.width/2, canvas.height/2 + 16);
  ctx.restore();
}

// HUD 그리기 도우미 -------------------------------------------
function roundRectPath(x, y, w, h, r) {
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawHeart(x, y, size, fill, stroke, alpha = 1) {
  // size: 전체 크기(px). (x, y)는 중심
  const r = size;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.25);
  ctx.bezierCurveTo(x + r * 0.5, y - r * 0.5, x + r * 1.2, y + r * 0.3, x, y + r);
  ctx.bezierCurveTo(x - r * 1.2, y + r * 0.3, x - r * 0.5, y - r * 0.5, x, y + r * 0.25);
  ctx.closePath();
  if (fill) {
    const g = ctx.createLinearGradient(x, y - r, x, y + r);
    g.addColorStop(0, fill);
    g.addColorStop(1, "#b32638");
    ctx.fillStyle = g;
    ctx.fill();
  }
  if (stroke) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
  ctx.restore();
}

// HUD 그리기
function drawHUD() {
  // 외부 DOM 점수는 계속 갱신(상단 중앙 배지)
  if (scoreSpan) scoreSpan.textContent = score;
  if (livesSpan) livesSpan.textContent = lives;
  if (levelSpan) levelSpan.textContent = getLevel();

  const M = 10;

  // 상단 좌측: 레벨 배지
  ctx.save();
  const lv = getLevel();
  const lvText = `LV ${lv}`;
  ctx.font = "bold 14px Segoe UI, Arial";
  const lvTw = ctx.measureText(lvText).width;
  const lvW = lvTw + 18, lvH = 24;
  const lvX = M, lvY = M;

  roundRectPath(lvX, lvY, lvW, lvH, 10);
  const lg = ctx.createLinearGradient(lvX, lvY, lvX, lvY + lvH);
  lg.addColorStop(0, "rgba(255,255,255,0.10)");
  lg.addColorStop(1, "rgba(255,255,255,0.02)");
  ctx.fillStyle = lg;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.stroke();

  ctx.fillStyle = "#d7e3ff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(lvText, lvX + lvW / 2, lvY + lvH / 2);
  ctx.restore();

  // 하단 중앙: 목숨 하트(간격 넓힘)
  ctx.save();
  const MAX_LIVES = 3;
  const heartSize = 16;
  const space = 28; // 간격 넓힘
  const panelW = MAX_LIVES * heartSize + (MAX_LIVES - 1) * (space - heartSize) + 24;
  const panelH = 34;
  const panelX = (canvas.width - panelW) / 2;
  const panelY = canvas.height - panelH - M;

  roundRectPath(panelX, panelY, panelW, panelH, 12);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.stroke();

  const startX = panelX + (panelW - ((MAX_LIVES - 1) * space + heartSize)) / 2 + heartSize / 2;
  const y = panelY + panelH / 2 - 2;

  for (let i = 0; i < MAX_LIVES; i++) {
    const cx = startX + i * space;
    if (i < lives) {
      drawHeart(cx, y, heartSize, "#ff5a6d", "#ffb4c0", 1);
    } else {
      drawHeart(cx, y, heartSize, null, "rgba(255,255,255,0.5)", 0.7);
    }
  }
  ctx.restore();
}

function update(now) {
  if (!running) return;
  if (!lastTime) lastTime = now;
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  elapsed += dt;

  const globalSpeed = 1;   // 변경: 시간 가속 제거(원 속도는 circles.js에서 레벨로 반영)

  // 공통 배경
  Game.drawBackground(dt);

  if (state === "intro") {
    overlayTimer -= dt;
    drawCenterText(overlayText, Math.max(0, 1 - overlayTimer / 1.4));
    if (overlayTimer <= 0) {
      state = "round";
      Game.startRound(30);    // 라운드당 30개 유지
    }
  }
  else if (state === "round") {
    Game.roundTrySpawn();
    Game.updateCircles(dt, globalSpeed);

    if (Game.isRoundDone()) {
      state = "warning";
      warningTimer = 2.5; // 경고 연출 길이
    }
  }
  else if (state === "warning") {
    warningTimer -= dt;
    drawWarningOverlay(warningTimer, 2.5);
    if (warningTimer <= 0) {
      state = "boss";
      Game.spawnBossNow();
    }
  }
  else if (state === "boss") {
    Game.updateBoss(dt);
    Game.drawBoss();
    // 승패 처리는 콜백에서 상태 변경
  }
  else if (state === "levelup") {
    overlayTimer -= dt;
    drawCenterText(overlayText, Math.max(0, 1 - overlayTimer / 1.5));
    if (overlayTimer <= 0) {
      state = "round";
      Game.startRound(30);    // 다음 라운드 시작
    }
  }

  Game.updateEffects(dt);
  drawHUD();

  if (running) requestAnimationFrame(update);
}

function gameOver() {
  running = false;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = "28px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`Game Over`, canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = "18px Arial";
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 22);
  ctx.restore();
}

// 입력
canvas.addEventListener("click", (e) => {
  if (!running) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;

  if (state === "boss") {
    if (Game.hitBoss(mx, my)) return;
  }
  if (state === "round") {
    const gained = Game.clickCircles(mx, my, Game.spawnEffect);
    if (gained) score += gained;
  }
});

requestAnimationFrame(update);

// 재시작 버튼: 페이지 전체 리로드(상태 완전 초기화)
(() => {
  const btn = document.getElementById('btnRestart');
  if (btn) btn.addEventListener('click', () => {
    window.location.reload(); // 에러 없이 깔끔한 재시작
  });
})();