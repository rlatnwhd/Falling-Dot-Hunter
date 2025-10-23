(function (G) {
  let canvas, ctx, getLevel, onMiss;
  const circles = [];

  // 라운드 관리
  let roundTotal = 0;   // 이번 라운드에 떨어질 총 개수(예: 15)
  let spawned = 0;      // 지금까지 스폰한 개수
  const MIN_ACTIVE = 2; // 동시에 화면에 최소 유지

  const types = [
    { color: "red",   value: 1, w: 3 },
    { color: "blue",  value: 1, w: 4 },
    { color: "green", value: 1, w: 2 },
    { color: "yellow",value: 1, w: 1 },
    { color: "purple",value: 1, w: 1 }
  ];

  G.initCircles = function (c, context2d, levelGetter, onMissCb) {
    canvas = c; ctx = context2d; getLevel = levelGetter; onMiss = onMissCb;
  };

  function pickType() {
    const total = types.reduce((s, t) => s + t.w, 0);
    let r = Math.random() * total;
    for (const t of types) { if ((r -= t.w) <= 0) return t; }
    return types[0];
  }

  function getRadiusByLevel() { return Math.max(10, 30 - (getLevel() - 1) * 3); }

  function makeCircle() {
    const { color, value } = pickType();
    const r = getRadiusByLevel();
    const x = Math.random() * (canvas.width - r * 2) + r;
    const y = -r - Math.random() * 50;
    const base = 80 + Math.random() * 80;                 // 80~160 px/s
    const speed = base * (1 + (getLevel() - 1) * 0.15);   // 레벨 가중
    return { x, y, r, color, value, speed };
  }

  // 라운드 시작
  G.startRound = function (totalCount) {
    roundTotal = totalCount;
    spawned = 0;
    circles.length = 0;
  };

  // 스폰(동시 개수 유지, 총량 초과 금지)
  G.roundTrySpawn = function () {
    const need = Math.max(MIN_ACTIVE, 2 + Math.floor((getLevel() - 1) / 3));
    while (circles.length < need && spawned < roundTotal) {
      circles.push(makeCircle());
      spawned++;
    }
  };

  // 진행 업데이트(낙하/그리기)
  G.updateCircles = function (dt, globalSpeed) {
    for (let i = circles.length - 1; i >= 0; i--) {
      const c = circles[i];
      c.y += c.speed * globalSpeed * dt;

      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.fill();

      // 화면 아래로 사라짐(미스)
      if (c.y - c.r > canvas.height) {
        onMiss && onMiss();
        if (spawned < roundTotal) {
          circles[i] = makeCircle(); // 아직 스폰 남았으면 대체
          spawned++;
        } else {
          circles.splice(i, 1);      // 더 스폰 불가면 제거
        }
      }
    }
  };

  // 클릭 판정
  G.clickCircles = function (mx, my, spawnEffect) {
    for (let i = circles.length - 1; i >= 0; i--) {
      const c = circles[i];
      const dx = mx - c.x, dy = my - c.y;
      if (dx * dx + dy * dy <= c.r * c.r) {
        const add = 1; // 모든 색 1점
        spawnEffect && spawnEffect(c.x, c.y, c.color);
        if (spawned < roundTotal) {
          circles[i] = makeCircle();
          spawned++;
        } else {
          circles.splice(i, 1);
        }
        return add;
      }
    }
    return 0;
  };

  // 라운드 종료 조건: 지정 개수 모두 스폰했고, 화면에 남은 공이 없음
  G.isRoundDone = function () {
    return spawned >= roundTotal && circles.length === 0;
  };
})(window.Game = window.Game || {});