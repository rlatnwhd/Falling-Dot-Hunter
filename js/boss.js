(function (G) {
  let canvas, ctx, getLevel, onDefeat, onTimeout, spawnEffect;

  const CFG = {
    TIME: 25,        // 제한시간(초)
    SPEED: 100,      // 이동 속도
    PULSE: 0.28
  };

  const PALETTE = [
    "#ff6b6b", "#ffd166", "#06d6a0", "#4dabf7", "#a78bfa",
    "#f97316", "#22c55e", "#f43f5e", "#38bdf8", "#e879f9"
  ];

  let boss = null;

  G.initBoss = function (c, context2d, levelGetter, defeatCb, timeoutCb, spawnEffectCb) {
    canvas = c; ctx = context2d; getLevel = levelGetter;
    onDefeat = defeatCb; onTimeout = timeoutCb; spawnEffect = spawnEffectCb;
  };

  G.hasBoss = function () { return !!boss; };

  function pick(array) { return array[Math.floor(Math.random() * array.length)]; }

  function colorToRGBA(hex, a = 1) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return `rgba(255,255,255,${a})`;
    return `rgba(${parseInt(m[1],16)},${parseInt(m[2],16)},${parseInt(m[3],16)},${a})`;
  }

  function mix(c, k) { // 간단 밝기 보정 0.0~1.0(검정 기준)
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(c);
    if (!m) return c;
    const r = Math.round(parseInt(m[1],16) * k);
    const g = Math.round(parseInt(m[2],16) * k);
    const b = Math.round(parseInt(m[3],16) * k);
    return `rgb(${r},${g},${b})`;
  }

  G.spawnBossNow = function () {
    const ang = Math.random() * Math.PI * 2;
    const speed = CFG.SPEED * (1 + (getLevel() - 1) * 0.05);
    const r = 60;
    const color = pick(PALETTE);
    const maxHp = Math.max(10, getLevel() * 10); // 레벨 × 10
    boss = {
      x: canvas.width / 2,
      y: canvas.height / 3,
      r,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      color,
      maxHp,          // 총 클릭 수(보상 기준)
      hp: maxHp,      // 남은 클릭 수
      timeLeft: CFG.TIME,
      pulseT: 0,
      scale: 1
    };
  };

  G.updateBoss = function (dt) {
    if (!boss) return;

    // 시간
    boss.timeLeft -= dt;
    if (boss.timeLeft <= 0 && boss.hp > 0) {
      onTimeout && onTimeout();
      boss = null;
      return;
    }

    // 이동 + 벽 반사
    boss.x += boss.vx * dt; boss.y += boss.vy * dt;
    if (boss.x - boss.r < 0) { boss.x = boss.r; boss.vx = Math.abs(boss.vx); }
    if (boss.x + boss.r > canvas.width) { boss.x = canvas.width - boss.r; boss.vx = -Math.abs(boss.vx); }
    if (boss.y - boss.r < 0) { boss.y = boss.r; boss.vy = Math.abs(boss.vy); }
    if (boss.y + boss.r > canvas.height) { boss.y = canvas.height - boss.r; boss.vy = -Math.abs(boss.vy); }

    // 피격 펄스
    if (boss.pulseT > 0) {
      boss.pulseT = Math.max(0, boss.pulseT - dt);
      const t = 1 - boss.pulseT / CFG.PULSE;
      boss.scale = 1 + 0.25 * Math.sin(t * Math.PI * 2) * (1 - t * 0.6);
    } else boss.scale = 1;
  };

  G.drawBoss = function () {
    if (!boss) return;

    // 본체
    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.scale(boss.scale, boss.scale);

    const inner = mix(boss.color, 1.0);
    const mid = colorToRGBA(boss.color, 1);
    const outer = mix(boss.color, 0.55);

    const rg = ctx.createRadialGradient(0, 0, boss.r * 0.2, 0, 0, boss.r);
    rg.addColorStop(0, "#fff4b3");
    rg.addColorStop(0.5, mid);
    rg.addColorStop(1, outer);
    ctx.fillStyle = rg;

    ctx.beginPath();
    ctx.arc(0, 0, boss.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.stroke();

    // 중앙에 남은 클릭 수 크게 표시
    const remain = boss.hp;
    ctx.font = "bold 26px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // 가독성: 어두운 외곽선 + 밝은 본문
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.strokeText(`${remain}`, 0, 0);
    ctx.fillStyle = "#fff";
    ctx.fillText(`${remain}`, 0, 0);

    ctx.restore();

    // HP 바(보스 위)
    const barW = boss.r * 2, barH = 8;
    const hpRatio = boss.hp / boss.maxHp;
    const bx = boss.x - barW / 2, by = boss.y - boss.r - 16;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = hpRatio > 0.4 ? "#46e06f" : hpRatio > 0.2 ? "#ffd166" : "#ff5c5c";
    ctx.fillRect(bx, by, barW * Math.max(0, hpRatio), barH);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.strokeRect(bx, by, barW, barH);
    ctx.restore();

    // 타이머(우측 상단)
    const label = `BOSS ${boss.timeLeft.toFixed(1)}s`;
    const M = 10, padX = 12, r = 12;
    ctx.save();
    ctx.font = "bold 14px Segoe UI, Arial";
    const tw = ctx.measureText(label).width;
    const w = tw + padX * 2;
    const h = 28;
    const x = canvas.width - w - M;
    const y = M;

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.stroke();

    ctx.fillStyle = "#ffd54f";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + w / 2, y + h / 2);
    ctx.restore();
  };

  G.hitBoss = function (mx, my) {
    if (!boss) return false;
    const dx = mx - boss.x, dy = my - boss.y;
    if (dx * dx + dy * dy <= boss.r * boss.r) {
      boss.hp -= 1;
      boss.pulseT = CFG.PULSE;
      spawnEffect && spawnEffect(boss.x, boss.y, boss.color);

      if (boss.hp <= 0) {
        onDefeat && onDefeat(boss.maxHp || 0);  // 처치 보상 전달
        boss = null;
      }
      return true;
    }
    return false;
  };
})(window.Game = window.Game || {});